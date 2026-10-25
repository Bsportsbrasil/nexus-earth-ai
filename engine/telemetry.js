import os from 'node:os';
import { monitorEventLoopDelay } from 'node:perf_hooks';

const loopHistogram = monitorEventLoopDelay({ resolution: 10 });
loopHistogram.enable();

/**
 * Real OS, CPU, RAM, Process Heap, and Prometheus Metrics Collector
 * Computes true per-core CPU utilization deltas from os.cpus() ticks.
 */
class TelemetryCollector {
  constructor() {
    this.prevCpuTimes = this._readCpuTotals();
    this.totalTokensGenerated = 0;
    this.totalThinkingTokens = 0;
    this.totalApiCalls = 0;
    this.lastApiLatencyMs = 0;
    this.tokenWindow = []; // [{ t, count }]
  }

  _readCpuTotals() {
    const cpus = os.cpus();
    let idle = 0, total = 0;
    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times)) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    }
    return { idle, total, cores: cpus.length, model: cpus[0]?.model || 'x64 CPU' };
  }

  recordTokens(count, isThought = false) {
    const n = Math.max(0, count | 0);
    this.totalTokensGenerated += n;
    if (isThought) this.totalThinkingTokens += n;
    this.tokenWindow.push({ t: Date.now(), count: n });
  }

  recordApiCall(latencyMs) {
    this.totalApiCalls++;
    if (typeof latencyMs === 'number' && latencyMs >= 0) {
      this.lastApiLatencyMs = Math.round(latencyMs);
    }
  }

  getSnapshot(graphStats = { totalNodes: 0, totalEdges: 0 }, brokerStats = { published: 0 }) {
    const cur = this._readCpuTotals();
    const idleDelta = cur.idle - this.prevCpuTimes.idle;
    const totalDelta = cur.total - this.prevCpuTimes.total;
    this.prevCpuTimes = cur;

    const cpuLoadPct = totalDelta > 0
      ? Math.max(1, Math.min(100, Math.round((1 - idleDelta / totalDelta) * 100)))
      : 0;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsedGB = +(usedMem / 1073741824).toFixed(2);
    const ramTotalGB = +(totalMem / 1073741824).toFixed(2);
    const ramPct = Math.round((usedMem / totalMem) * 100);

    const mem = process.memoryUsage();
    const heapUsedMB = +(mem.heapUsed / 1048576).toFixed(1);
    const rssMB = +(mem.rss / 1048576).toFixed(1);

    const now = Date.now();
    this.tokenWindow = this.tokenWindow.filter(e => now - e.t <= 3000);
    const tokensPerSec = Math.round(this.tokenWindow.reduce((s, e) => s + e.count, 0) / 3);

    const eventLoopLagMs = +(loopHistogram.mean / 1e6).toFixed(2);

    return {
      timestamp: now,
      cpu: {
        model: cur.model,
        cores: cur.cores,
        loadPct: cpuLoadPct
      },
      memory: {
        ramUsedGB,
        ramTotalGB,
        ramPct,
        heapUsedMB,
        rssMB
      },
      runtime: {
        eventLoopLagMs,
        uptimeSec: Math.round(process.uptime())
      },
      ai: {
        tokensPerSec,
        totalTokens: this.totalTokensGenerated,
        thinkingTokens: this.totalThinkingTokens,
        totalApiCalls: this.totalApiCalls,
        lastLatencyMs: this.lastApiLatencyMs
      },
      graph: graphStats,
      broker: brokerStats
    };
  }

  toPrometheusText(graphStats, brokerStats) {
    const s = this.getSnapshot(graphStats, brokerStats);
    return [
      '# HELP nexus_cpu_utilization_percent Real host CPU utilization percentage',
      '# TYPE nexus_cpu_utilization_percent gauge',
      `nexus_cpu_utilization_percent ${s.cpu.loadPct}`,
      '# HELP nexus_cpu_logical_cores Number of logical CPU cores',
      '# TYPE nexus_cpu_logical_cores gauge',
      `nexus_cpu_logical_cores ${s.cpu.cores}`,
      '# HELP nexus_ram_used_bytes Host RAM used in bytes',
      '# TYPE nexus_ram_used_bytes gauge',
      `nexus_ram_used_bytes ${Math.round(s.memory.ramUsedGB * 1073741824)}`,
      '# HELP nexus_nodejs_heap_used_bytes Node.js heap memory used in bytes',
      '# TYPE nexus_nodejs_heap_used_bytes gauge',
      `nexus_nodejs_heap_used_bytes ${Math.round(s.memory.heapUsedMB * 1048576)}`,
      '# HELP nexus_eventloop_lag_milliseconds Node.js event loop mean lag in ms',
      '# TYPE nexus_eventloop_lag_milliseconds gauge',
      `nexus_eventloop_lag_milliseconds ${s.runtime.eventLoopLagMs}`,
      '# HELP nexus_tokens_per_second Real-time LLM token generation rate',
      '# TYPE nexus_tokens_per_second gauge',
      `nexus_tokens_per_second ${s.ai.tokensPerSec}`,
      '# HELP nexus_tokens_total Total LLM tokens processed in session',
      '# TYPE nexus_tokens_total counter',
      `nexus_tokens_total ${s.ai.totalTokens}`,
      '# HELP nexus_thinking_tokens_total Total LLM reasoning/thought tokens extracted',
      '# TYPE nexus_thinking_tokens_total counter',
      `nexus_thinking_tokens_total ${s.ai.thinkingTokens}`,
      '# HELP nexus_knowledge_graph_nodes_total Total indexed nodes in GraphDB',
      '# TYPE nexus_knowledge_graph_nodes_total gauge',
      `nexus_knowledge_graph_nodes_total ${s.graph.totalNodes || 0}`,
      '# HELP nexus_broker_messages_published_total Total messages published to MessageBroker',
      '# TYPE nexus_broker_messages_published_total counter',
      `nexus_broker_messages_published_total ${s.broker.published || 0}`
    ].join('\n') + '\n';
  }
}

export const telemetry = new TelemetryCollector();
