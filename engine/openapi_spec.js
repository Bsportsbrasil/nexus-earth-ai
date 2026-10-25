/**
 * NEXUS Earth AI — Sovereign Artificial Superintelligence Ecosystem
 * OpenAPI 3.0.3 Enterprise Specification Engine
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "NEXUS Earth AI — Sovereign Artificial Superintelligence Ecosystem API",
    version: "2.4.0",
    description: "Enterprise REST & SSE specification for the NEXUS Earth AI hybrid cluster. Features decoupled Frontier LLM inference (Google Gemini 2.5 / Claude 3.5 Sonnet / OpenAI o1 via server-side vault), local 128-dimensional vector memories, multi-agent DAG consensus, real-time mechanistic interpretability hooks, sovereign AES-256-GCM credential vaults, and EU AI Act Level 4 XAI Merkle passports.",
    contact: {
      name: "NEXUS Architecture & AI Research Engineering",
      url: "https://nexusearthai.com"
    },
    license: {
      name: "Sovereign Enterprise AI Architecture License",
      url: "https://nexusearthai.com/license"
    }
  },
  servers: [
    {
      url: "https://nexusearthai.com",
      description: "Production Sovereign Cluster (Hostinger Cloud Enterprise Node / Ubuntu 22.04 LTS)"
    },
    {
      url: "http://localhost:5173",
      description: "Local Sovereign Development Node"
    }
  ],
  tags: [
    { name: "Cluster Health & Telemetry", description: "Real-time CPU/RAM/VRAM/Vector hardware telemetries, Prometheus metrics, and automated scientific ablation benchmarks." },
    { name: "Frontier LLM & Grounding", description: "Decoupled Frontier LLM streaming with dual-phase Thinking and real-time GraphRAG grounding." },
    { name: "Multi-Agent Consensus (DAG)", description: "Planner, Critic, Executor and Verifier autonomous agents with isolated 128D cosine vector memory." },
    { name: "Mechanistic Interpretability", description: "Real-time activation hooks, residual stream tracing, and attention entropy probes." },
    { name: "Knowledge Graph & GraphRAG", description: "High-density persistent knowledge graph (Wikipedia REST + EuropePMC ETL) with semantic vector traversal." },
    { name: "Enterprise Identity & Privacy", description: "Zero-Trust authentication, PBKDF2-SHA512 password hashing, session tokens, and LGPD Art. 18 / GDPR data export." },
    { name: "Regulatory Explainability (XAI)", description: "EU AI Act Article 13/14 and NIST AI RMF audit passports secured with SHA-256 Merkle root trees." },
    { name: "Geospatial Intelligence", description: "Sovereign 3D Earth cartography, OGC KML/GeoJSON parser, satellite terrain modeling, and solar potential analysis." }
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Cluster Health & Telemetry"],
        summary: "Cluster & Hardware Health Telemetry",
        description: "Returns instant real-time telemetry for host CPU cores, memory utilization, vector count, DAG status, neural hooks, and security controllers.",
        responses: {
          "200": {
            description: "Cluster is operational and healthy.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "operational" },
                    timestamp: { type: "string", format: "date-time" },
                    uptimeSeconds: { type: "number", example: 12450 },
                    system: {
                      type: "object",
                      properties: {
                        platform: { type: "string", example: "linux" },
                        hostCores: { type: "integer", example: 2 },
                        ramTotalGB: { type: "number", example: 7.75 },
                        ramUsedGB: { type: "number", example: 1.42 },
                        ramFreeGB: { type: "number", example: 6.33 }
                      }
                    },
                    infrastructure: {
                      type: "object",
                      properties: {
                        architecture: { type: "string", example: "Frontier API Hybrid Edge Cluster" },
                        vectorDatabase: { type: "object" },
                        consensusDAG: { type: "object" },
                        securityGuardian: { type: "object" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/telemetry": {
      get: {
        tags: ["Cluster Health & Telemetry"],
        summary: "System & Cluster Telemetry Snapshot",
        description: "Detailed system telemetry snapshot including graph metrics, broker message throughput, and Lennox guardian state.",
        responses: {
          "200": {
            description: "Telemetry snapshot retrieved.",
            content: { "application/json": {} }
          }
        }
      }
    },
    "/api/benchmark": {
      get: {
        tags: ["Cluster Health & Telemetry"],
        summary: "Reproducible Scientific Benchmark & Ablation",
        description: "Executes instant on-demand micro-benchmarks across GraphRAG 1-hop traversal, tensor forward/backward passes, and DAG consensus validation.",
        responses: {
          "200": {
            description: "Benchmark execution results and latency metrics.",
            content: { "application/json": {} }
          }
        }
      }
    },
    "/api/gemini": {
      post: {
        tags: ["Frontier LLM & Grounding"],
        summary: "Stream Frontier LLM with Thinking & GraphRAG Grounding",
        description: "Dispatches inference request to Frontier LLM provider via secure server-side vault with real-time SSE token streaming.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prompt"],
                properties: {
                  prompt: { type: "string" },
                  systemPrompt: { type: "string" },
                  temperature: { type: "number", default: 0.7 }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Server-Sent Events stream containing thinking tokens and synthesized answer.",
            content: { "text/event-stream": {} }
          }
        }
      }
    },
    "/api/agents/run": {
      post: {
        tags: ["Multi-Agent Consensus (DAG)"],
        summary: "Execute Multi-Agent DAG Consensus Cycle",
        description: "Orchestrates Planner, Critic, Executor, and Verifier autonomous agents with SHA-256 consensus hashing.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["task"],
                properties: {
                  task: { type: "string" },
                  maxSteps: { type: "integer", default: 5 }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "DAG execution completed with verifiable consensus artifact.",
            content: { "application/json": {} }
          }
        }
      }
    },
    "/api/agents/dashboard": {
      get: {
        tags: ["Multi-Agent Consensus (DAG)"],
        summary: "Autonomous Agents Dashboard & Isolation Metrics",
        description: "Returns the status, role, cognitive patterns, and isolated vector memory counts for all platform agents.",
        responses: {
          "200": {
            description: "Agent registry and isolation telemetry.",
            content: { "application/json": {} }
          }
        }
      }
    },
    "/api/agents/converse": {
      post: {
        tags: ["Multi-Agent Consensus (DAG)"],
        summary: "Converse with a Targeted Autonomous Agent",
        description: "Sends a multimodal prompt to a specific agent with localized vector recall and pattern adaptation.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["agentId", "message"],
                properties: {
                  agentId: { type: "string" },
                  message: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Agent conversational response with vector citations.",
            content: { "application/json": {} }
          }
        }
      }
    },
    "/api/tensor": {
      post: {
        tags: ["Mechanistic Interpretability"],
        summary: "Tensor Forward & Backward Execution",
        description: "Computes synthetic forward-pass activation tensors, calculates attention entropy, and executes backpropagation gradient step.",
        responses: {
          "200": {
            description: "Tensor step metrics, entropy, and gradient norm.",
            content: { "application/json": {} }
          }
        }
      }
    },
    "/api/neural/hooks": {
      get: {
        tags: ["Mechanistic Interpretability"],
        summary: "Probe Real-Time Neural Activation Hooks",
        description: "Reads live activation hooks across transformer layers (Q, K, V projections, MLP residual streams, attention head patterns).",
        responses: {
          "200": {
            description: "Active hook points and tensor matrices.",
            content: { "application/json": {} }
          }
        }
      }
    },
    "/api/graph": {
      get: {
        tags: ["Knowledge Graph & GraphRAG"],
        summary: "Query Sovereign Knowledge Graph & GraphRAG",
        description: "Searches the persistent semantic graph with 1-hop traversal and vector similarity scoring.",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Semantic search query" },
          { name: "topK", in: "query", schema: { type: "integer", default: 5 } }
        ],
        responses: {
          "200": {
            description: "Graph nodes, edges, and contextual text snippets.",
            content: { "application/json": {} }
          }
        }
      }
    },
    "/api/explainability/overview": {
      get: {
        tags: ["Regulatory Explainability (XAI)"],
        summary: "Sovereign Regulatory & XAI Overview",
        description: "Provides compliance metrics under EU AI Act Level 4, NIST AI RMF, ISO 42001, and Merkle ledger integrity.",
        responses: {
          "200": {
            description: "Regulatory status and recent decision passports.",
            content: { "application/json": {} }
          }
        }
      }
    },
    "/api/geo/analyze": {
      post: {
        tags: ["Geospatial Intelligence"],
        summary: "Geospatial & Solar Photovoltaic Analytics",
        description: "Calculates surface area, perimeter, and annual solar irradiation potential for arbitrary polygon boundaries.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["coordinates"],
                properties: {
                  coordinates: { type: "array", items: { type: "array", items: { type: "number" } } }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Area, perimeter, and estimated annual solar yield in kWh.",
            content: { "application/json": {} }
          }
        }
      }
    }
  }
};
