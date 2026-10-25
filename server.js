import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { broker } from './engine/broker.js';
import { graphDB } from './engine/graph_db.js';
import { tensorEngine } from './engine/tensor.js';
import { telemetry } from './engine/telemetry.js';
import { streamWithThinking } from './engine/llm.js';
import { executeAgentDAG } from './engine/agents_dag.js';
import { taskEngine } from './engine/tasks.js';
import { generateVisualAsset, generateExecutiveReport } from './engine/studio.js';
import { alignmentEngine } from './engine/ethics_inclusion.js';
import { securityController } from './engine/security_control.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);

// Load .env.local automatically if present (gitignored for security)
try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
} catch (e) {}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// ── Native RFC 6455 WebSocket Frame Encoder / Decoder (Zero external WS dependency required) ──
const wsClients = new Set();

function encodeWsFrame(dataObj) {
  const payload = Buffer.from(typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj), 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text frame
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function decodeWsFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const byte1 = buffer[offset];
    const byte2 = buffer[offset + 1];
    const opcode = byte1 & 0x0f;
    if (opcode === 0x8) return { messages, close: true }; // Close frame
    const isMasked = (byte2 & 0x80) !== 0;
    let payloadLen = byte2 & 0x7f;
    let headerLen = 2;
    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(offset + 2));
      headerLen = 10;
    }
    const maskLen = isMasked ? 4 : 0;
    if (offset + headerLen + maskLen + payloadLen > buffer.length) break;

    const payload = Buffer.alloc(payloadLen);
    if (isMasked) {
      const mask = buffer.subarray(offset + headerLen, offset + headerLen + 4);
      const enc = buffer.subarray(offset + headerLen + 4, offset + headerLen + 4 + payloadLen);
      for (let i = 0; i < payloadLen; i++) payload[i] = enc[i] ^ mask[i % 4];
    } else {
      buffer.copy(payload, 0, offset + headerLen, offset + headerLen + payloadLen);
    }
    if (opcode === 0x1) {
      messages.push(payload.toString('utf8'));
    }
    offset += headerLen + maskLen + payloadLen;
  }
  return { messages, close: false };
}

function broadcastWs(obj) {
  if (!wsClients.size) return;
  const frame = encodeWsFrame(obj);
  for (const sock of wsClients) {
    if (!sock.destroyed) {
      sock.write(frame);
    }
  }
}

function sendWs(sock, obj) {
  if (!sock.destroyed) {
    sock.write(encodeWsFrame(obj));
  }
}

// Broadcast real OS/Hardware telemetry & Tensor state every 1000ms to connected clients
setInterval(() => {
  if (!wsClients.size) return;
  const gStats = { totalNodes: graphDB.nodes.size, totalEdges: graphDB.edges.length };
  const bStats = broker.getStats();
  const snap = telemetry.getSnapshot(gStats, bStats);
  broadcastWs({ type: 'telemetry', data: snap });
}, 1000);

// Forward all MessageBroker events to WebSockets in real time
broker.on('message', (msg) => {
  broadcastWs({ type: 'broker_message', msg });
});

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 64_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. Prometheus Observability Scraping Endpoint (/metrics)
  if (req.method === 'GET' && pathname === '/metrics') {
    const gStats = { totalNodes: graphDB.nodes.size, totalEdges: graphDB.edges.length };
    const bStats = broker.getStats();
    const promText = telemetry.toPrometheusText(gStats, bStats);
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
    return res.end(promText);
  }

  // 2. JSON System & Cluster Telemetry Endpoint (/api/telemetry)
  if (req.method === 'GET' && pathname === '/api/telemetry') {
    const gStats = { totalNodes: graphDB.nodes.size, totalEdges: graphDB.edges.length };
    const bStats = broker.getStats();
    return jsonResponse(res, 200, {
      ...telemetry.getSnapshot(gStats, bStats),
      security: securityController.getState()
    });
  }

  // 2b. Sovereign Security & Kill-Switch Governance Endpoint (/api/security)
  if (pathname === '/api/security') {
    if (req.method === 'GET') {
      return jsonResponse(res, 200, securityController.getState());
    }
    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        let state;
        if (body.action === 'kill_switch') {
          state = securityController.engageKillSwitch(body.reason || 'Acionado pelo Operador Humano');
        } else if (body.action === 'restore') {
          state = securityController.disengageKillSwitch();
        } else if (body.action === 'toggle_module') {
          state = securityController.setModuleState(body.module, body.enabled);
        } else if (body.action === 'purge_keys') {
          state = securityController.purgeRuntimeSecrets();
        } else {
          state = securityController.getState();
        }
        broadcastWs({ type: 'security_state', data: state });
        return jsonResponse(res, 200, state);
      } catch (e) {
        return jsonResponse(res, 400, { error: e.message });
      }
    }
  }

  // 3. Tensor Forward/Backward Execution Endpoint (/api/tensor)
  if (req.method === 'POST' && pathname === '/api/tensor') {
    try {
      const body = await parseJsonBody(req);
      if (body.layers || body.neurons) {
        tensorEngine.configure(body.layers || tensorEngine.layers, body.neurons || tensorEngine.dim);
      }
      const state = tensorEngine.forwardAndStep(body.input || '');
      broadcastWs({ type: 'tensor_state', data: state });
      return jsonResponse(res, 200, state);
    } catch (e) {
      return jsonResponse(res, 400, { error: e.message });
    }
  }

  // 4. GraphRAG & Persistent Graph Database Endpoint (/api/graph)
  if (pathname === '/api/graph') {
    try {
      securityController.assertAllowed('graphrag');
    } catch (e) {
      return jsonResponse(res, 423, { error: e.message, locked: true });
    }
    if (req.method === 'GET') {
      const q = url.searchParams.get('q');
      if (q) {
        const rag = await graphDB.queryGraphRAG(q, 6);
        return jsonResponse(res, 200, rag);
      }
      return jsonResponse(res, 200, graphDB.getFullGraph(60));
    }
    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const rag = await graphDB.queryGraphRAG(body.query || 'Artificial intelligence', body.topK || 6);
        return jsonResponse(res, 200, rag);
      } catch (e) {
        return jsonResponse(res, 400, { error: e.message });
      }
    }
  }

  // 5. Multi-Agent DAG Execution Endpoint (/api/agents/run)
  if (req.method === 'POST' && pathname === '/api/agents/run') {
    try {
      securityController.assertAllowed('agents');
      const body = await parseJsonBody(req);
      const result = await executeAgentDAG({
        query: body.query || 'Artificial Intelligence',
        apiKey: body.apiKey,
        emitWs: broadcastWs
      });
      return jsonResponse(res, 200, result);
    } catch (e) {
      return jsonResponse(res, 423, { error: e.message });
    }
  }

  // 5b. Task & Calendar Automation Endpoints (/api/tasks, /api/tasks/ics, /api/tasks/plan)
  if (pathname === '/api/tasks') {
    if (req.method === 'GET') {
      return jsonResponse(res, 200, { items: taskEngine.listItems() });
    }
    if (req.method === 'POST') {
      try {
        securityController.assertAllowed('tasks');
        const body = await parseJsonBody(req);
        if (body.action === 'toggle') {
          return jsonResponse(res, 200, { item: taskEngine.toggleItem(body.id), items: taskEngine.listItems() });
        }
        if (body.action === 'delete') {
          taskEngine.deleteItem(body.id);
          return jsonResponse(res, 200, { items: taskEngine.listItems() });
        }
        const item = taskEngine.addItem(body);
        return jsonResponse(res, 200, { item, items: taskEngine.listItems() });
      } catch (e) {
        return jsonResponse(res, 423, { error: e.message });
      }
    }
  }

  if (req.method === 'GET' && pathname === '/api/tasks/ics') {
    const ics = taskEngine.exportToICS();
    res.writeHead(200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="nexus_schedule.ics"'
    });
    return res.end(ics);
  }

  if (req.method === 'POST' && pathname === '/api/tasks/plan') {
    try {
      securityController.assertAllowed('tasks');
      const body = await parseJsonBody(req);
      const plan = await taskEngine.generateSmartPlan({
        goal: body.goal,
        type: body.type,
        apiKey: body.apiKey
      });
      return jsonResponse(res, 200, { ...plan, items: taskEngine.listItems() });
    } catch (e) {
      return jsonResponse(res, 423, { error: e.message });
    }
  }

  // 5c. Multimodal Studio Endpoints (/api/studio/image, /api/studio/report)
  if (req.method === 'POST' && pathname === '/api/studio/image') {
    try {
      securityController.assertAllowed('studio');
      const body = await parseJsonBody(req);
      const asset = await generateVisualAsset({ prompt: body.prompt, apiKey: body.apiKey });
      return jsonResponse(res, 200, asset);
    } catch (e) {
      return jsonResponse(res, 423, { error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/studio/report') {
    try {
      securityController.assertAllowed('studio');
      const body = await parseJsonBody(req);
      const rep = await generateExecutiveReport({ topic: body.topic, apiKey: body.apiKey });
      return jsonResponse(res, 200, rep);
    } catch (e) {
      return jsonResponse(res, 423, { error: e.message });
    }
  }

  // 5d. Cooperative Superintelligence: Controlled Release Gate & TEA Inclusive Pedagogy (/api/cooperative/gate, /api/cooperative/inclusion)
  if (req.method === 'POST' && pathname === '/api/cooperative/gate') {
    try {
      const body = await parseJsonBody(req);
      const evaluation = alignmentEngine.evaluateControlledRelease(body.directive || '', body.tokens || 120);
      broadcastWs({ type: 'ethics_gate', data: evaluation });
      return jsonResponse(res, 200, evaluation);
    } catch (e) {
      return jsonResponse(res, 400, { error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/cooperative/inclusion') {
    try {
      securityController.assertAllowed('llm');
      const body = await parseJsonBody(req);
      const result = await alignmentEngine.generateInclusivePedagogy({
        topic: body.topic,
        profile: body.profile,
        ageGroup: body.ageGroup,
        apiKey: body.apiKey
      });
      broadcastWs({ type: 'ethics_gate', data: result.gate });
      return jsonResponse(res, 200, result);
    } catch (e) {
      return jsonResponse(res, 423, { error: e.message });
    }
  }

  // 6. Gemini LLM Endpoint with Thinking & GraphRAG Grounding (/api/gemini)
  if (req.method === 'POST' && pathname === '/api/gemini') {
    try {
      const body = await parseJsonBody(req);
      if (!body.contents) {
        if (process.env.GEMINI_API_KEY && !securityController.emergencyLockdown && securityController.modules.llm) {
          return jsonResponse(res, 400, { error: 'Missing contents', serverKeyConfigured: true });
        }
        return jsonResponse(res, 503, { error: 'SERVER_KEY_NOT_CONFIGURED' });
      }
      securityController.assertAllowed('llm');
      const apiKey = body.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return jsonResponse(res, 503, { error: 'SERVER_KEY_NOT_CONFIGURED' });
      }

      const result = await streamWithThinking({
        apiKey,
        contents: body.contents,
        systemInstruction: body.systemInstruction,
        thinkingLevel: body.thinkingLevel || 'MEDIUM',
        onThoughtChunk: (delta, fullThought) => {
          broadcastWs({ type: 'chat_thought', delta, fullThought });
        },
        onAnswerChunk: (delta, fullAnswer) => {
          broadcastWs({ type: 'chat_answer', delta, fullAnswer });
        }
      });

      return jsonResponse(res, 200, {
        text: result.answer,
        thought: result.thought,
        latencyMs: result.latencyMs
      });
    } catch (e) {
      return jsonResponse(res, 500, { error: e.message });
    }
  }

  // 7. Static File Serving
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const resolvedPath = path.normalize(path.join(__dirname, filePath));
  if (!resolvedPath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
    const ext = path.extname(resolvedPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(resolvedPath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// ── WebSocket Upgrade Handler (/ws) ──
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  socket.write(
    [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`,
      '\r\n'
    ].join('\r\n')
  );

  wsClients.add(socket);

  // Send immediate welcome snapshot with real OS telemetry + initial Tensor state
  const gStats = { totalNodes: graphDB.nodes.size, totalEdges: graphDB.edges.length };
  const bStats = broker.getStats();
  sendWs(socket, {
    type: 'welcome',
    telemetry: telemetry.getSnapshot(gStats, bStats),
    tensor: tensorEngine.forwardAndStep('init_nexus'),
    security: securityController.getState()
  });

  socket.on('data', async (buf) => {
    try {
      const { messages, close } = decodeWsFrames(buf);
      if (close) {
        wsClients.delete(socket);
        socket.end();
        return;
      }
      for (const raw of messages) {
        const msg = JSON.parse(raw);
        if (securityController.emergencyLockdown) {
          sendWs(socket, { type: 'error', error: 'SECURITY_LOCKDOWN_ACTIVE: Kill-Switch engaged by operator.' });
          continue;
        }
        if (msg.action === 'tensor_step') {
          if (msg.layers || msg.neurons) {
            tensorEngine.configure(msg.layers, msg.neurons);
          }
          const st = tensorEngine.forwardAndStep(msg.input || 'pulse');
          sendWs(socket, { type: 'tensor_state', data: st });
        } else if (msg.action === 'run_dag') {
          await executeAgentDAG({
            query: msg.query,
            apiKey: msg.apiKey,
            emitWs: (ev) => sendWs(socket, ev)
          });
        } else if (msg.action === 'chat_stream') {
          const rag = await graphDB.queryGraphRAG(msg.query, 4);
          sendWs(socket, { type: 'chat_rag', rag });
          const apiKey = msg.apiKey || process.env.GEMINI_API_KEY;
          if (apiKey) {
            const groundedPrompt = rag.seedNodes.length
              ? `Pergunta do usuário: ${msg.query}\n\n[Evidências do Banco de Grafos (GraphRAG)]:\n` +
                rag.seedNodes.map(n => `• ${n.label}: ${n.summary} (${n.url})`).join('\n')
              : msg.query;
            const res = await streamWithThinking({
              apiKey,
              contents: [...(msg.history || []), { role: 'user', parts: [{ text: groundedPrompt }] }],
              systemInstruction: msg.systemInstruction,
              thinkingLevel: 'MEDIUM',
              onThoughtChunk: (delta, fullThought) => sendWs(socket, { type: 'chat_thought', delta, fullThought }),
              onAnswerChunk: (delta, fullAnswer) => sendWs(socket, { type: 'chat_answer', delta, fullAnswer })
            });
            sendWs(socket, { type: 'chat_complete', answer: res.answer, thought: res.thought, latencyMs: res.latencyMs, rag });
          } else {
            sendWs(socket, { type: 'chat_complete', noKey: true, rag });
          }
        }
      }
    } catch (err) {
      sendWs(socket, { type: 'error', error: err.message });
    }
  });

  socket.on('close', () => wsClients.delete(socket));
  socket.on('error', () => wsClients.delete(socket));
});

// Seed initial GraphDB on startup so GraphRAG has immediate indexed entities
graphDB.ingestTopic('Artificial intelligence').catch(() => {});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`NEXUS Enterprise Engine listening safely on http://localhost:${PORT} (127.0.0.1 only)`);
});
