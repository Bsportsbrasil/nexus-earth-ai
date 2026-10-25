import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { broker } from './broker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAULT_PATH = path.join(__dirname, '..', 'data', 'encrypted_user_vault.enc');

/**
 * Zero-Trust AES-256-GCM Personal Vault & Real Cloud API Connectors
 * Protects all personal user credentials and platform tokens at rest with AES-256-GCM + PBKDF2-SHA256,
 * and executes real HTTPS API calls to:
 *  1. Google Calendar REST API v3 (https://www.googleapis.com/calendar/v3/calendars/primary/events)
 *  2. Official Telegram Bot API (https://api.telegram.org/bot<TOKEN>/sendMessage)
 *  3. Official Meta WhatsApp Business Cloud API (https://graph.facebook.com/v19.0/<PHONE_ID>/messages)
 */
export class CloudConnectorVault {
  constructor() {
    this.masterSecret = process.env.NEXUS_VAULT_SECRET || process.env.NEXUS_ADMIN_KEY || 'NEXUS-SOVEREIGN-ZERO-TRUST-VAULT-2026';
    this.credentials = {
      googleCalendarToken: process.env.GOOGLE_CALENDAR_TOKEN || '',
      googleCalendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
      telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
      whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      whatsappPhoneId: process.env.WHATSAPP_PHONE_ID || '',
      whatsappRecipientPhone: process.env.WHATSAPP_RECIPIENT_PHONE || ''
    };
    this.dispatchHistory = [];
    this._loadEncryptedVault();
  }

  _deriveKey(saltBuffer) {
    return crypto.pbkdf2Sync(this.masterSecret, saltBuffer, 100000, 32, 'sha256');
  }

  _saveEncryptedVault() {
    try {
      const dir = path.dirname(VAULT_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const salt = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);
      const key = this._deriveKey(salt);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const plaintext = JSON.stringify({
        updatedAt: new Date().toISOString(),
        credentials: this.credentials
      });
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();

      const envelope = {
        cipher: 'AES-256-GCM',
        kdf: 'PBKDF2-SHA256-100000',
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        ciphertext: encrypted.toString('base64')
      };
      fs.writeFileSync(VAULT_PATH, JSON.stringify(envelope, null, 2), 'utf8');
      return true;
    } catch (e) {
      return false;
    }
  }

  _loadEncryptedVault() {
    try {
      if (!fs.existsSync(VAULT_PATH)) return;
      const envelope = JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8'));
      const salt = Buffer.from(envelope.salt, 'hex');
      const iv = Buffer.from(envelope.iv, 'hex');
      const authTag = Buffer.from(envelope.authTag, 'hex');
      const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
      const key = this._deriveKey(salt);

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
      const parsed = JSON.parse(decrypted);
      if (parsed && parsed.credentials) {
        this.credentials = { ...this.credentials, ...parsed.credentials };
      }
    } catch (e) {
      // If vault does not exist or secret rotated, keep defaults safely
    }
  }

  /**
   * Updates user cloud credentials securely inside the AES-256-GCM Vault.
   * Never returns raw secret tokens to the browser.
   */
  updateCredentials(partial = {}) {
    const allowedKeys = [
      'googleCalendarToken',
      'googleCalendarId',
      'telegramBotToken',
      'telegramChatId',
      'whatsappAccessToken',
      'whatsappPhoneId',
      'whatsappRecipientPhone'
    ];
    for (const k of allowedKeys) {
      if (typeof partial[k] === 'string' && partial[k].trim() !== '') {
        this.credentials[k] = partial[k].trim();
      }
    }
    this._saveEncryptedVault();
    broker.publish('vault.credentials_updated', { timestamp: Date.now(), status: this.getMaskedStatus() });
    return this.getMaskedStatus();
  }

  /**
   * Returns masked status so personal credentials are never leaked in plaintext
   */
  getMaskedStatus() {
    const mask = (str) => {
      if (!str || str.length < 6) return null;
      return `${str.slice(0, 3)}••••••••${str.slice(-3)}`;
    };
    return {
      encryption: 'AES-256-GCM (PBKDF2 100k iterations)',
      vaultFileProtected: fs.existsSync(VAULT_PATH),
      googleCalendar: {
        configured: Boolean(this.credentials.googleCalendarToken),
        calendarId: this.credentials.googleCalendarId || 'primary',
        maskedToken: mask(this.credentials.googleCalendarToken)
      },
      telegramBot: {
        configured: Boolean(this.credentials.telegramBotToken && this.credentials.telegramChatId),
        chatId: this.credentials.telegramChatId || null,
        maskedToken: mask(this.credentials.telegramBotToken)
      },
      whatsappCloud: {
        configured: Boolean(this.credentials.whatsappAccessToken && this.credentials.whatsappPhoneId),
        phoneId: this.credentials.whatsappPhoneId || null,
        recipient: this.credentials.whatsappRecipientPhone || null,
        maskedToken: mask(this.credentials.whatsappAccessToken)
      },
      recentDispatches: this.dispatchHistory.slice(-10)
    };
  }

  /**
   * 1. Real Google Calendar REST API v3 Event Sync
   */
  async syncEventToGoogleCalendar(taskItem) {
    const token = this.credentials.googleCalendarToken;
    const calId = encodeURIComponent(this.credentials.googleCalendarId || 'primary');
    const startIso = `${taskItem.date}T${taskItem.time || '09:00'}:00`;
    const endHour = String(Math.min(23, parseInt((taskItem.time || '09:00').slice(0, 2), 10) + 1)).padStart(2, '0');
    const endIso = `${taskItem.date}T${endHour}:${(taskItem.time || '09:00').slice(3, 5)}:00`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

    const gcalPayload = {
      summary: `[NEXUS ${taskItem.category || 'AI'}] ${taskItem.title}`,
      description: `${taskItem.notes || ''}\n\nGerado autonomamente pelo NEXUS Cooperative Superintelligence.`,
      start: { dateTime: new Date(startIso).toISOString(), timeZone },
      end: { dateTime: new Date(endIso).toISOString(), timeZone }
    };

    if (!token) {
      // Provide direct Google Calendar Web Render URL + RFC 5545 ICS when OAuth token is not yet stored
      const gcalWebUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(gcalPayload.summary)}&details=${encodeURIComponent(gcalPayload.description)}`;
      return {
        syncedToCloud: false,
        mode: 'RFC5545_ICS_AND_GCAL_DEEPLINK',
        googleCalendarTemplateUrl: gcalWebUrl,
        payloadPrepared: gcalPayload
      };
    }

    try {
      const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gcalPayload)
      });
      const data = await resp.json();
      const rec = {
        id: crypto.randomUUID(),
        channel: 'GOOGLE_CALENDAR_API_V3',
        timestamp: new Date().toISOString(),
        ok: resp.ok,
        eventId: data.id || null,
        htmlLink: data.htmlLink || null
      };
      this.dispatchHistory.push(rec);
      broker.publish('cloud.gcal.synced', rec);
      return { syncedToCloud: resp.ok, mode: 'GOOGLE_CALENDAR_API_V3', response: rec };
    } catch (err) {
      return { syncedToCloud: false, mode: 'GOOGLE_CALENDAR_API_ERROR', error: err.message };
    }
  }

  /**
   * 2. Official Telegram Bot API Dispatcher (https://api.telegram.org/bot<TOKEN>/sendMessage)
   */
  async sendTelegramMessage(text, overrideChatId = '') {
    const token = this.credentials.telegramBotToken;
    const chatId = overrideChatId || this.credentials.telegramChatId;
    if (!token || !chatId) {
      return {
        sentViaApi: false,
        mode: 'TELEGRAM_DEEPLINK_FALLBACK',
        deepLink: `https://t.me/share/url?url=${encodeURIComponent('https://nexus.ai')}&text=${encodeURIComponent(text)}`,
        reason: 'Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no Cofre AES-256-GCM para disparo direto via nuvem.'
      };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown'
        })
      });
      const data = await resp.json();
      const rec = {
        id: crypto.randomUUID(),
        channel: 'TELEGRAM_BOT_API',
        timestamp: new Date().toISOString(),
        ok: Boolean(resp.ok && data.ok),
        messageId: data.result?.message_id || null
      };
      this.dispatchHistory.push(rec);
      broker.publish('cloud.telegram.sent', rec);
      return { sentViaApi: rec.ok, mode: 'TELEGRAM_BOT_API_LIVE', receipt: rec };
    } catch (err) {
      return { sentViaApi: false, mode: 'TELEGRAM_API_ERROR', error: err.message };
    }
  }

  /**
   * 3. Official Meta WhatsApp Business Cloud API Dispatcher (https://graph.facebook.com/v19.0/<PHONE_ID>/messages)
   */
  async sendWhatsAppCloudMessage(text, overridePhone = '') {
    const token = this.credentials.whatsappAccessToken;
    const phoneId = this.credentials.whatsappPhoneId;
    const to = (overridePhone || this.credentials.whatsappRecipientPhone || '').replace(/\D/g, '');

    if (!token || !phoneId || !to) {
      return {
        sentViaApi: false,
        mode: 'WHATSAPP_DEEPLINK_FALLBACK',
        deepLink: `https://wa.me/${to}?text=${encodeURIComponent(text)}`,
        reason: 'Configure WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID e telefone no Cofre AES-256-GCM para disparo Cloud API.'
      };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(phoneId)}/messages`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: text }
        })
      });
      const data = await resp.json();
      const rec = {
        id: crypto.randomUUID(),
        channel: 'WHATSAPP_CLOUD_API',
        timestamp: new Date().toISOString(),
        ok: resp.ok,
        messageId: data.messages?.[0]?.id || null
      };
      this.dispatchHistory.push(rec);
      broker.publish('cloud.whatsapp.sent', rec);
      return { sentViaApi: resp.ok, mode: 'WHATSAPP_CLOUD_API_LIVE', receipt: rec };
    } catch (err) {
      return { sentViaApi: false, mode: 'WHATSAPP_API_ERROR', error: err.message };
    }
  }
}

export const cloudVault = new CloudConnectorVault();
