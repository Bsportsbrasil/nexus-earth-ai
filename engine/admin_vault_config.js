/**
 * engine/admin_vault_config.js
 *
 * COFRE ADMINISTRATIVO DE CREDENCIAIS COMERCIAIS (.env.local com chmod 600)
 * - Exclusivo da proprietária autenticada no Master C2 (nunca exposto publicamente)
 * - Lista estrita de variáveis permitidas (impede injeção arbitrária de env)
 * - Aplica em process.env em tempo real (ativação imediata sem derrubar o servidor)
 * - Nunca retorna segredos em texto puro na API (apenas máscaras seguras)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');

const ALLOWED_KEYS = new Set([
  'MP_ACCESS_TOKEN',
  'ASAAS_API_KEY',
  'ASAAS_WEBHOOK_TOKEN',
  'NEXUS_ENFORCE_PAYWALL',
  'NEXUS_FREE_DAILY_LIMIT',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHANNEL_ID',
  'TELEGRAM_AUTO_INTERVAL_MIN',
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY'
]);

const SECRET_KEYS = new Set([
  'MP_ACCESS_TOKEN',
  'ASAAS_API_KEY',
  'ASAAS_WEBHOOK_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'OPENAI_API_KEY',
  'SUPABASE_SERVICE_KEY'
]);

function maskValue(val) {
  const s = String(val || '').trim();
  if (!s) return '';
  if (s.length <= 8) return '••••••••';
  return `${s.slice(0, 4)}••••••••${s.slice(-4)}`;
}

export class AdminVaultConfig {
  constructor() {
    this._ensureAuthSecret();
  }

  _readEnvMap() {
    const map = new Map();
    try {
      if (fs.existsSync(ENV_LOCAL_PATH)) {
        const lines = fs.readFileSync(ENV_LOCAL_PATH, 'utf8').split(/\r?\n/);
        for (const line of lines) {
          const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
          if (m) map.set(m[1], m[2]);
        }
      }
    } catch (_) {}
    return map;
  }

  _writeEnvMap(map) {
    const lines = [];
    for (const [k, v] of map.entries()) {
      const cleanVal = String(v ?? '').replace(/[\r\n]/g, '').trim();
      if (cleanVal !== '') {
        lines.push(`${k}=${cleanVal}`);
      }
    }
    const content = lines.join('\n') + '\n';
    const tmp = `${ENV_LOCAL_PATH}.${process.pid}.${crypto.randomBytes(3).toString('hex')}.tmp`;
    fs.writeFileSync(tmp, content, { encoding: 'utf8', mode: 0o600 });
    try {
      fs.renameSync(tmp, ENV_LOCAL_PATH);
    } catch (_) {
      fs.writeFileSync(ENV_LOCAL_PATH, content, { encoding: 'utf8', mode: 0o600 });
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (__) {}
    }
    try { fs.chmodSync(ENV_LOCAL_PATH, 0o600); } catch (_) {}
  }

  _ensureAuthSecret() {
    if (process.env.NEXUS_TEST_MODE) return;
    try {
      const map = this._readEnvMap();
      if (!map.get('NEXUS_AUTH_SECRET') && !process.env.NEXUS_AUTH_SECRET) {
        const strongSecret = crypto.randomBytes(48).toString('hex');
        map.set('NEXUS_AUTH_SECRET', strongSecret);
        process.env.NEXUS_AUTH_SECRET = strongSecret;
        this._writeEnvMap(map);
      }
    } catch (_) {}
  }

  /**
   * Retorna status seguro e mascarado de todas as integrações comerciais
   */
  getMaskedStatus() {
    const map = this._readEnvMap();
    const out = {};
    for (const key of ALLOWED_KEYS) {
      const raw = (process.env[key] || map.get(key) || '').trim();
      out[key] = {
        configured: Boolean(raw),
        display: SECRET_KEYS.has(key) ? maskValue(raw) : raw
      };
    }
    return {
      success: true,
      storagePermissions: '0600 (Owner-Only)',
      authSecretHardened: Boolean(process.env.NEXUS_AUTH_SECRET || map.get('NEXUS_AUTH_SECRET')),
      keys: out
    };
  }

  /**
   * Atualiza chaves permitidas no .env.local (chmod 600) e aplica ao vivo em process.env
   */
  saveConfig(updates = {}) {
    const map = this._readEnvMap();
    const applied = [];

    for (const [k, rawVal] of Object.entries(updates || {})) {
      if (!ALLOWED_KEYS.has(k)) continue;
      if (rawVal === undefined || rawVal === null) continue;
      const val = String(rawVal).trim();
      // Ignore masked placeholders so untouched secret inputs are never overwritten by bullets
      if (val.includes('••••')) continue;

      if (val === '__CLEAR__') {
        map.delete(k);
        delete process.env[k];
        applied.push(`${k} (removido)`);
      } else if (val !== '') {
        if (k === 'NEXUS_ENFORCE_PAYWALL') {
          const norm = (val === '1' || val === 'true') ? '1' : '0';
          map.set(k, norm);
          process.env[k] = norm;
        } else if (k === 'NEXUS_FREE_DAILY_LIMIT' || k === 'TELEGRAM_AUTO_INTERVAL_MIN') {
          const num = Math.max(0, parseInt(val, 10) || 0);
          map.set(k, String(num));
          process.env[k] = String(num);
        } else {
          map.set(k, val);
          process.env[k] = val;
        }
        applied.push(k);
      }
    }

    this._writeEnvMap(map);
    return {
      success: true,
      applied,
      status: this.getMaskedStatus()
    };
  }

  /**
   * Testa conexão real com Mercado Pago / Asaas / Telegram usando as credenciais ativas
   */
  async testIntegrations() {
    const results = {
      mercadoPago: { tested: false, ok: false, message: 'Não configurado' },
      asaas: { tested: false, ok: false, message: 'Não configurado' },
      telegram: { tested: false, ok: false, message: 'Não configurado' }
    };

    const mpToken = (process.env.MP_ACCESS_TOKEN || '').trim();
    if (mpToken) {
      results.mercadoPago.tested = true;
      try {
        const r = await fetch('https://api.mercadopago.com/users/me', {
          signal: AbortSignal.timeout(10000),
          headers: { 'Authorization': `Bearer ${mpToken}` }
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.id) {
          results.mercadoPago = { tested: true, ok: true, message: `Conectado com sucesso (Conta ID #${d.id} • ${d.nickname || d.site_id || 'MP'})` };
        } else {
          results.mercadoPago = { tested: true, ok: false, message: d.message || `Token recusado (HTTP ${r.status})` };
        }
      } catch (e) {
        results.mercadoPago = { tested: true, ok: false, message: e.message };
      }
    }

    const asaasKey = (process.env.ASAAS_API_KEY || '').trim();
    if (asaasKey) {
      results.asaas.tested = true;
      const baseUrl = (process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3').replace(/\/+$/, '');
      try {
        const r = await fetch(`${baseUrl}/myAccount`, {
          signal: AbortSignal.timeout(10000),
          headers: { 'access_token': asaasKey }
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok) {
          results.asaas = { tested: true, ok: true, message: `Conectado com sucesso (${d.tradingName || d.name || 'Conta Asaas Ativa'})` };
        } else {
          results.asaas = { tested: true, ok: false, message: d?.errors?.[0]?.description || `Chave recusada (HTTP ${r.status})` };
        }
      } catch (e) {
        results.asaas = { tested: true, ok: false, message: e.message };
      }
    }

    const tgToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    if (tgToken) {
      results.telegram.tested = true;
      try {
        const r = await fetch(`https://api.telegram.org/bot${tgToken}/getMe`, { signal: AbortSignal.timeout(10000) });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok && d.result) {
          results.telegram = { tested: true, ok: true, message: `Bot ativo: @${d.result.username} (${d.result.first_name})` };
        } else {
          results.telegram = { tested: true, ok: false, message: d.description || `Token Telegram inválido (HTTP ${r.status})` };
        }
      } catch (e) {
        results.telegram = { tested: true, ok: false, message: e.message };
      }
    }

    return { success: true, results };
  }
}

export const adminVaultConfig = new AdminVaultConfig();
export default adminVaultConfig;
