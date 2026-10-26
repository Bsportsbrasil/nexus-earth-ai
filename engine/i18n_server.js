/**
 * NEXUS Server-Side Internationalization & Localization Engine
 * Supports structured JSON locales: pt.json, en.json, es.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.join(__dirname, '..', 'locales');

export class ServerI18n {
  constructor() {
    this.locales = {};
    this.defaultLang = 'pt';
    this.supportedLangs = ['pt', 'en', 'es'];
    this._loadLocales();
  }

  _loadLocales() {
    for (const lang of this.supportedLangs) {
      try {
        const filePath = path.join(LOCALES_DIR, `${lang}.json`);
        if (fs.existsSync(filePath)) {
          this.locales[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      } catch (err) {
        console.warn(`[ServerI18n] Failed to load ${lang}.json:`, err.message);
      }
    }
  }

  detectLang(req) {
    if (!req) return this.defaultLang;

    // 1. Query parameter ?lang=
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      const qLang = url.searchParams.get('lang')?.toLowerCase();
      if (qLang && this.supportedLangs.includes(qLang)) return qLang;
    } catch (_) {}

    // 2. Cookie nexus_lang
    try {
      const cookie = req.headers['cookie'] || '';
      const m = cookie.match(/nexus_lang=([a-z]{2})/i);
      if (m && this.supportedLangs.includes(m[1].toLowerCase())) return m[1].toLowerCase();
    } catch (_) {}

    // 3. Accept-Language header
    const accept = req.headers['accept-language'] || '';
    if (accept.includes('en')) return 'en';
    if (accept.includes('es')) return 'es';
    if (accept.includes('pt')) return 'pt';

    return this.defaultLang;
  }

  t(lang, keyPath, fallback = '') {
    const l = this.supportedLangs.includes(lang) ? lang : this.defaultLang;
    const dict = this.locales[l] || this.locales[this.defaultLang] || {};
    
    const parts = keyPath.split('.');
    let cur = dict;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = cur[p];
      } else {
        return fallback || keyPath;
      }
    }
    return typeof cur === 'string' ? cur : (fallback || keyPath);
  }

  getLocaleDict(lang) {
    const l = this.supportedLangs.includes(lang) ? lang : this.defaultLang;
    return this.locales[l] || this.locales[this.defaultLang] || {};
  }
}

export const serverI18n = new ServerI18n();
