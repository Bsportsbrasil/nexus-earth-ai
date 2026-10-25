import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { graphDB } from './graph_db.js';
import { streamWithThinking } from './llm.js';
import { broker } from './broker.js';
import { cloudVault } from './cloud_connectors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASKS_PATH = path.join(__dirname, '..', 'data', 'tasks_calendar.json');

/**
 * Actionable Task, Calendar, Daily Briefing & Real-Time Web Search Engine
 */
class TaskAutomationEngine {
  constructor() {
    this.items = []; // [{ id, title, date, time, category, priority, status, notes, createdAt }]
    this._load();
    if (this.items.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      this.addItem({
        title: 'Revisão de Arquitetura Multi-Agente DAG & GraphRAG',
        date: today,
        time: '09:00',
        category: 'Engineering',
        priority: 'HIGH',
        notes: 'Auditar latência de inferência e métricas Prometheus (/metrics)'
      });
      this.addItem({
        title: 'Deep-Work: Benchmark de Modelos e Alinhamento',
        date: today,
        time: '14:00',
        category: 'Research',
        priority: 'HIGH',
        notes: 'Comparar qualidade de consenso com referências DOI'
      });
    }
  }

  _load() {
    try {
      if (fs.existsSync(TASKS_PATH)) {
        this.items = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
      }
    } catch (e) {
      this.items = [];
    }
  }

  _save() {
    try {
      const dir = path.dirname(TASKS_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(TASKS_PATH, JSON.stringify(this.items, null, 2), 'utf8');
    } catch (e) {}
  }

  listItems() {
    return this.items;
  }

  addItem({ title, date, time = '10:00', category = 'General', priority = 'MEDIUM', notes = '', syncCloud = false }) {
    const item = {
      id: crypto.randomUUID(),
      title: (title || 'Nova Tarefa').trim(),
      date: date || new Date().toISOString().slice(0, 10),
      time,
      category,
      priority,
      status: 'SCHEDULED',
      notes,
      googleCalendarUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`[NEXUS ${category}] ${(title || 'Nova Tarefa').trim()}`)}&details=${encodeURIComponent(notes || 'Gerado pelo NEXUS AI')}`,
      createdAt: Date.now()
    };
    this.items.push(item);
    this._save();
    broker.publish('tasks.created', item);
    if (syncCloud) {
      cloudVault.syncEventToGoogleCalendar(item).catch(() => {});
    }
    return item;
  }

  toggleItem(id) {
    const it = this.items.find(x => x.id === id);
    if (it) {
      it.status = it.status === 'COMPLETED' ? 'SCHEDULED' : 'COMPLETED';
      this._save();
      broker.publish('tasks.updated', it);
    }
    return it;
  }

  deleteItem(id) {
    const idx = this.items.findIndex(x => x.id === id);
    if (idx !== -1) {
      const removed = this.items.splice(idx, 1)[0];
      this._save();
      broker.publish('tasks.deleted', { id: removed.id });
      return true;
    }
    return false;
  }

  /**
   * Generates a real, downloadable RFC 5545 .ics iCalendar file compatible with Google/Apple/Outlook Calendar
   */
  exportToICS() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NEXUS Superintelligence Platform//Task Automation//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    for (const it of this.items) {
      const cleanDate = (it.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
      const cleanTime = (it.time || '09:00').replace(':', '') + '00';
      const dtStart = `${cleanDate}T${cleanTime}`;
      const endHour = String(Math.min(23, parseInt((it.time || '09:00').slice(0, 2), 10) + 1)).padStart(2, '0');
      const dtEnd = `${cleanDate}T${endHour}${(it.time || '09:00').slice(3, 5)}00`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${it.id}@nexus.ai`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:[NEXUS ${it.category}] ${it.title}`,
        `DESCRIPTION:${(it.notes || '').replace(/\n/g, '\\n')} (Status: ${it.status})`,
        `STATUS:${it.status === 'COMPLETED' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT'
      );
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Generates an AI-planned schedule/routine or daily executive briefing grounded on live web research
   */
  async generateSmartPlan({ goal, type = 'routine', apiKey }) {
    const rag = await graphDB.queryGraphRAG(goal || 'Productivity and scientific research', 4);
    const hasKey = !!(apiKey || process.env.GEMINI_API_KEY);
    const today = new Date().toISOString().slice(0, 10);

    if (hasKey) {
      const sys = `Você é o Motor de Automação Executiva do NEXUS.
Crie um cronograma prático e detalhado para o objetivo do usuário.
Ao final da resposta, inclua um bloco JSON delimitado por <TASKS_JSON>...</TASKS_JSON> contendo um array de 3 a 5 tarefas estruturadas no formato:
[{"title": "...", "date": "${today}", "time": "08:00", "category": "Routine", "priority": "HIGH", "notes": "..."}]`;

      const res = await streamWithThinking({
        apiKey,
        contents: `Objetivo (${type}): ${goal}\n\nEvidências em Tempo Real:\n` +
          rag.seedNodes.map(n => `- ${n.label}: ${n.summary}`).join('\n'),
        systemInstruction: sys,
        thinkingLevel: 'LOW'
      });

      const match = res.answer.match(/<TASKS_JSON>([\s\S]*?)<\/TASKS_JSON>/);
      const created = [];
      if (match) {
        try {
          const parsed = JSON.parse(match[1].trim());
          for (const t of parsed) {
            created.push(this.addItem(t));
          }
        } catch (e) {}
      }
      const cleanBriefing = res.answer.replace(/<TASKS_JSON>[\s\S]*?<\/TASKS_JSON>/, '').trim();
      return { briefing: cleanBriefing, createdTasks: created, rag };
    }

    // Real deterministic schedule builder grounded on GraphRAG findings when no Gemini key is configured
    const primary = rag.seedNodes[0];
    const slots = [
      { time: '08:00', title: `Briefing & Leitura Técnica: ${primary?.label || goal}`, category: 'Briefing', priority: 'HIGH', notes: primary?.summary?.slice(0, 180) || `Revisar literatura sobre ${goal}` },
      { time: '10:30', title: `Bloco de Execução Prática: ${goal}`, category: 'Execution', priority: 'HIGH', notes: `Aplicar diretrizes extraídas de ${rag.papers.length} artigos científicos indexados.` },
      { time: '14:30', title: `Auditoria de Métricas & Revisão de Progresso`, category: 'Review', priority: 'MEDIUM', notes: `Verificar indicadores e consolidar entregáveis do dia.` }
    ];
    const created = slots.map(s => this.addItem({ ...s, date: today }));

    const briefing = `### 📋 Plano Executivo & Briefing Diário: ${goal}\n\n` +
      `**Base de Conhecimento em Tempo Real (${primary?.label || goal}):**\n` +
      `${primary?.summary || 'Plano estruturado com base nas melhores práticas de engenharia e ciência.'}\n\n` +
      (rag.papers.length
        ? `**Artigos Revisados por Pares Consultados (Crossref DOI):**\n` +
          rag.papers.map(p => `- *${p.title}* (${p.year}) — ${p.doi}`).join('\n') + '\n\n'
        : '') +
      `**3 Compromissos Adicionados Automaticamente ao seu Calendário (${today}):**\n` +
      created.map(c => `- **${c.time}** — [${c.category}] ${c.title}`).join('\n');

    return { briefing, createdTasks: created, rag };
  }
}

export const taskEngine = new TaskAutomationEngine();
