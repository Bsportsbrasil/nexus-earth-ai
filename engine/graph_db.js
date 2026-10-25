import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'knowledge_graph.json');

/**
 * Persistent Property Graph + Vector Hybrid Database (GraphRAG Engine)
 * Stores entities (nodes), typed directed relationships (edges), and sparse TF-IDF vector embeddings
 * for real cosine-similarity + multi-hop graph traversal queries.
 */
export class GraphDatabase {
  constructor() {
    this.nodes = new Map(); // id -> { id, label, category, summary, url, vector, updatedAt }
    this.edges = [];        // [{ source, target, type, weight }]
    this.idf = new Map();   // token -> idf weight
    this._load();
  }

  _tokenize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  _computeVector(text) {
    const tokens = this._tokenize(text);
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const vec = {};
    let norm = 0;
    const len = tokens.length || 1;
    for (const [t, count] of Object.entries(tf)) {
      const w = (count / len) * (this.idf.get(t) || 1.5);
      vec[t] = w;
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const t of Object.keys(vec)) vec[t] /= norm;
    return vec;
  }

  _cosineSim(vecA, vecB) {
    let dot = 0;
    for (const [k, v] of Object.entries(vecA)) {
      if (vecB[k]) dot += v * vecB[k];
    }
    return dot;
  }

  _load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        for (const n of raw.nodes || []) this.nodes.set(n.id.toLowerCase(), n);
        this.edges = raw.edges || [];
      }
    } catch (e) {
      console.error('GraphDB load error:', e.message);
    }
  }

  _save() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        DB_PATH,
        JSON.stringify({ nodes: Array.from(this.nodes.values()), edges: this.edges }, null, 2),
        'utf8'
      );
    } catch (e) {
      // Ignore write errors in read-only serverless environments (e.g. Vercel Lambda)
    }
  }

  upsertNode({ id, label, category = 'Concept', summary = '', url = '' }) {
    const key = (id || label).toLowerCase().trim();
    const existing = this.nodes.get(key) || {};
    const mergedSummary = summary || existing.summary || '';
    const node = {
      id: key,
      label: label || existing.label || id,
      category: category || existing.category || 'Concept',
      summary: mergedSummary,
      url: url || existing.url || '',
      vector: this._computeVector(`${label} ${mergedSummary}`),
      updatedAt: Date.now()
    };
    this.nodes.set(key, node);
    return node;
  }

  upsertEdge(sourceId, targetId, type = 'RELATED_TO', weight = 1.0) {
    const s = sourceId.toLowerCase().trim();
    const t = targetId.toLowerCase().trim();
    if (s === t) return;
    const exists = this.edges.find(e => (e.source === s && e.target === t) || (e.source === t && e.target === s));
    if (!exists) {
      this.edges.push({ source: s, target: t, type, weight });
    }
  }

  _extractSubjectQuery(rawQuery) {
    const cleaned = (rawQuery || '')
      .replace(/[?!.,;:"']/g, ' ')
      .replace(/\b(me\s+ensine(\s+algo(\s+fascinante)?)?(\s+sobre)?|o\s+que\s+(é|são|significa)|como\s+funciona(m)?|quem\s+(foi|é|descobriu|inventou)|fale\s+sobre|explique(\s+sobre)?|qual\s+(é|a|o)|por\s+que|de\s+um\s+jeito\s+divertido(\s+e\s+visual)?|para\s+mim|por\s+favor|hoje|agora)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.length >= 2 ? cleaned : (rawQuery || '').trim();
  }

  /**
   * Live ingestion from Wikipedia REST + MediaWiki Action API + Crossref Academic DOI Registry
   */
  async ingestTopic(query) {
    const clean = this._extractSubjectQuery(query);
    if (!clean) return null;

    let ingestedRoot = null;

    // 1. Wikipedia REST & Links ingestion (Portuguese first for PT-BR precision, then English)
    for (const lang of ['pt', 'en']) {
      try {
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(clean)}&utf8=&format=json&origin=*&srlimit=2`;
        const sr = await fetch(searchUrl);
        if (!sr.ok) continue;
        const sdata = await sr.json();
        const topTitle = sdata?.query?.search?.[0]?.title;
        if (!topTitle) continue;

        const sumUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
        const sumRes = await fetch(sumUrl);
        if (!sumRes.ok) continue;
        const summary = await sumRes.json();
        if (!summary.extract) continue;

        const pageUrl = summary.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`;
        ingestedRoot = this.upsertNode({
          id: summary.title,
          label: summary.title,
          category: 'Root',
          summary: summary.extract,
          url: pageUrl
        });

        const linksUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(summary.title)}&prop=links&plnamespace=0&pllimit=14&format=json&origin=*`;
        const lr = await fetch(linksUrl);
        const ldata = await lr.json();
        const firstPage = Object.values(ldata?.query?.pages || {})[0] || {};
        const related = (firstPage.links || [])
          .map(l => l.title)
          .filter(t => t && !t.includes(':') && t.length < 38)
          .slice(0, 10);

        for (const rel of related) {
          this.upsertNode({ id: rel, label: rel, category: 'Linked' });
          this.upsertEdge(summary.title, rel, 'WIKI_LINK', 0.9);
        }
        break;
      } catch (e) {
        // continue
      }
    }

    // 2. Crossref Peer-Reviewed Literature Ingestion
    const papers = [];
    try {
      const crUrl = `https://api.crossref.org/works?query=${encodeURIComponent(clean)}&rows=3&select=DOI,title,issued,container-title`;
      const r = await fetch(crUrl);
      if (r.ok) {
        const data = await r.json();
        for (const it of data?.message?.items || []) {
          const title = Array.isArray(it.title) ? it.title[0] : (it.title || 'Academic Study');
          const year = it.issued?.['date-parts']?.[0]?.[0] || 'n.d.';
          const doiUrl = it.DOI ? `https://doi.org/${it.DOI}` : '';
          const journal = Array.isArray(it['container-title']) ? it['container-title'][0] : 'Peer-Reviewed Journal';
          papers.push({ title, year, journal, doi: doiUrl });
          const paperId = `paper:${it.DOI || title.slice(0, 30)}`;
          this.upsertNode({
            id: paperId,
            label: `${title.slice(0, 42)} (${year})`,
            category: 'Paper',
            summary: `Peer-reviewed study published in ${journal} (${year}). DOI: ${doiUrl}`,
            url: doiUrl
          });
          if (ingestedRoot) {
            this.upsertEdge(ingestedRoot.id, paperId, 'CITED_IN_LITERATURE', 0.95);
          }
        }
      }
    } catch (e) {}

    this._save();
    return { root: ingestedRoot, papers };
  }

  /**
   * Hybrid Vector + Multi-Hop GraphRAG Retrieval
   */
  async queryGraphRAG(query, topK = 6) {
    // First ingest live if graph has low coverage for this query
    const qVec = this._computeVector(query);
    let scored = [];
    for (const node of this.nodes.values()) {
      const sim = this._cosineSim(qVec, node.vector || {});
      if (sim > 0.05 || node.label.toLowerCase().includes(query.toLowerCase())) {
        scored.push({ node, score: sim + (node.summary ? 0.25 : 0) });
      }
    }
    scored.sort((a, b) => b.score - a.score);

    let liveIngestion = null;
    if (scored.length === 0 || scored[0].score < 0.35) {
      liveIngestion = await this.ingestTopic(query);
      scored = [];
      for (const node of this.nodes.values()) {
        const sim = this._cosineSim(qVec, node.vector || {});
        scored.push({ node, score: sim + (node.summary ? 0.25 : 0) });
      }
      scored.sort((a, b) => b.score - a.score);
    }

    const seedNodes = scored.slice(0, topK).map(s => s.node);
    const seedIds = new Set(seedNodes.map(n => n.id));

    // 1-hop neighborhood expansion
    const subgraphEdges = [];
    for (const e of this.edges) {
      if (seedIds.has(e.source) || seedIds.has(e.target)) {
        subgraphEdges.push(e);
        seedIds.add(e.source);
        seedIds.add(e.target);
      }
    }

    const subgraphNodes = Array.from(seedIds)
      .map(id => this.nodes.get(id))
      .filter(Boolean)
      .slice(0, 28)
      .map(({ vector, ...rest }) => rest);

    return {
      seedNodes: seedNodes.map(({ vector, ...rest }) => rest),
      subgraph: { nodes: subgraphNodes, edges: subgraphEdges.slice(0, 45) },
      papers: liveIngestion?.papers || [],
      totalIndexedNodes: this.nodes.size,
      totalIndexedEdges: this.edges.length
    };
  }

  getFullGraph(limit = 50) {
    const nodes = Array.from(this.nodes.values())
      .slice(-limit)
      .map(({ vector, ...rest }) => rest);
    const ids = new Set(nodes.map(n => n.id));
    const edges = this.edges.filter(e => ids.has(e.source) && ids.has(e.target));
    return { nodes, edges, totalNodes: this.nodes.size, totalEdges: this.edges.length };
  }
}

export const graphDB = new GraphDatabase();
