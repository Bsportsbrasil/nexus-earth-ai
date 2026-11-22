/**
 * engine/ml_offers_manager.js
 *
 * GERENCIADOR REAL DE OFERTAS MERCADO LIVRE (CASTILLOOFFICIAL) + BOT TELEGRAM AUTOMÁTICO
 * - Permite cadastrar/editar/remover ofertas com links oficiais reais (meli.la / mercadolivre.com/sec/...)
 * - Separa claramente links oficiais verificados de itens que ainda precisam do link encurtado meli.la
 * - Suporta disparo automático para Canal/Grupo Telegram via Bot API oficial (R$ 0)
 */

import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { REAL_ML_PRODUCTS } from './ml_active_products_catalog.js';
import { writeJsonAtomic, readJsonSafe } from './storage_adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OFFERS_FILE = path.join(__dirname, '..', 'data', 'ml_verified_offers.json');

export function isVerifiedAffiliateUrl(url = '') {
  const s = String(url || '').trim();
  if (!s.startsWith('http')) return false;
  if (s.includes('/afiliados/link-builder')) return false;
  return /meli\.la|mercadolivre\.com\/sec\/|mercadolivre\.com\.br\/.*\b(matt_tool|matt_word)\b/i.test(s);
}

export class MlOffersManager {
  constructor() {
    this.customOffers = [];
    this.telegramLog = [];
    this._load();
  }

  _load() {
    const saved = readJsonSafe(OFFERS_FILE, null);
    if (saved && Array.isArray(saved.offers)) {
      this.customOffers = saved.offers;
    }
    if (saved && Array.isArray(saved.telegramLog)) {
      this.telegramLog = saved.telegramLog.slice(-50);
    }
  }

  _save() {
    writeJsonAtomic(OFFERS_FILE, {
      updatedAt: new Date().toISOString(),
      offers: this.customOffers,
      telegramLog: this.telegramLog.slice(-50)
    });
  }

  /**
   * Retorna todas as ofertas: primeiro as ofertas verificadas cadastradas pela proprietária (meli.la reais),
   * seguidas do catálogo base (sinalizando corretamente se o link ainda precisa ser encurtado).
   */
  getAllOffers() {
    const customMapped = this.customOffers.map(o => ({
      ...o,
      verifiedLink: isVerifiedAffiliateUrl(o.affiliateUrl),
      source: 'ADMIN_VERIFIED'
    }));

    const baseMapped = REAL_ML_PRODUCTS.map((p, idx) => ({
      id: p.tag || `base_${idx + 1}`,
      title: p.title,
      category: p.category || 'Ofertas',
      oldPrice: p.oldPrice || '',
      currentPrice: p.currentPrice || '',
      discount: p.discount || '',
      installments: p.installments || '',
      badge: p.badge || 'MERCADO LIVRE',
      imageUrl: p.imageUrl || '',
      affiliateUrl: p.directHubUrl || '',
      commissionRate: p.commissionRate || '5%',
      verifiedLink: isVerifiedAffiliateUrl(p.directHubUrl),
      source: 'CATALOG_BASE'
    }));

    // Custom offers override matching id/tag
    const customIds = new Set(customMapped.map(c => c.id));
    return [...customMapped, ...baseMapped.filter(b => !customIds.has(b.id))];
  }

  upsertOffer({ id, title, category, oldPrice, currentPrice, discount, installments, badge, imageUrl, affiliateUrl, commissionRate }) {
    if (!title || !affiliateUrl) {
      return { success: false, error: 'Título e link oficial de afiliado (meli.la ou /sec/) são obrigatórios.' };
    }
    const cleanUrl = String(affiliateUrl).trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return { success: false, error: 'Link inválido: deve começar com https://' };
    }
    const offerId = (id || `ml_${crypto.randomBytes(4).toString('hex')}`).trim();
    const record = {
      id: offerId,
      title: String(title).trim().slice(0, 180),
      category: String(category || 'Ofertas').trim().slice(0, 60),
      oldPrice: String(oldPrice || '').trim().slice(0, 30),
      currentPrice: String(currentPrice || '').trim().slice(0, 30),
      discount: String(discount || 'OFERTA').trim().slice(0, 30),
      installments: String(installments || 'Entrega FULL Mercado Livre').trim().slice(0, 80),
      badge: String(badge || 'VERIFICADO • FULL').trim().slice(0, 50),
      imageUrl: String(imageUrl || '').trim().slice(0, 500),
      affiliateUrl: cleanUrl,
      commissionRate: String(commissionRate || '12%').trim().slice(0, 15),
      verifiedLink: isVerifiedAffiliateUrl(cleanUrl),
      updatedAt: new Date().toISOString()
    };

    const existingIdx = this.customOffers.findIndex(o => o.id === offerId);
    if (existingIdx >= 0) this.customOffers[existingIdx] = record;
    else this.customOffers.unshift(record);

    this._save();
    return { success: true, offer: record };
  }

  deleteOffer(id) {
    const before = this.customOffers.length;
    this.customOffers = this.customOffers.filter(o => o.id !== id);
    if (this.customOffers.length === before) {
      return { success: false, error: 'Oferta customizada não encontrada.' };
    }
    this._save();
    return { success: true, deletedId: id };
  }

  /**
   * Publica uma oferta real verificada no Canal do Telegram via Bot API oficial
   */
  async broadcastToTelegram(offerId = null) {
    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const channelId = (process.env.TELEGRAM_CHANNEL_ID || '').trim();
    if (!botToken || !channelId) {
      return {
        success: false,
        configured: false,
        error: 'TELEGRAM_NOT_CONFIGURED',
        message: 'Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHANNEL_ID no .env da VPS para ativar postagens automáticas gratuitas no Telegram.'
      };
    }

    const all = this.getAllOffers();
    const verifiedOnly = all.filter(o => o.verifiedLink);
    const offer = offerId
      ? all.find(o => o.id === offerId)
      : (verifiedOnly[Math.floor(Math.random() * verifiedOnly.length)] || null);

    if (!offer) {
      return {
        success: false,
        configured: true,
        error: 'NO_VERIFIED_MELI_LINK',
        message: 'Cadastre pelo menos 1 oferta com link oficial meli.la ou mercadolivre.com/sec/ antes de disparar para o Telegram.'
      };
    }

    const caption = [
      `🚨 <b>OFERTA VERIFICADA • ${offer.discount || 'DESTAQUE'}</b>`,
      ``,
      `<b>${offer.title}</b>`,
      offer.oldPrice ? `❌ De: <s>${offer.oldPrice}</s>` : '',
      `✅ Por apenas: <b>${offer.currentPrice}</b>`,
      offer.installments ? `💳 ${offer.installments}` : '',
      ``,
      `🛒 <a href="${offer.affiliateUrl}">COMPRAR NO MERCADO LIVRE OFICIAL</a>`
    ].filter(Boolean).join('\n');

    try {
      const endpoint = offer.imageUrl
        ? `https://api.telegram.org/bot${botToken}/sendPhoto`
        : `https://api.telegram.org/bot${botToken}/sendMessage`;

      const payload = offer.imageUrl
        ? { chat_id: channelId, photo: offer.imageUrl, caption, parse_mode: 'HTML' }
        : { chat_id: channelId, text: caption, parse_mode: 'HTML', disable_web_page_preview: false };

      const resp = await fetch(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(12000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      const logEntry = {
        offerId: offer.id,
        title: offer.title,
        ok: Boolean(resp.ok && data.ok),
        timestamp: new Date().toISOString(),
        error: data?.description || null
      };
      this.telegramLog.unshift(logEntry);
      this._save();
      return { success: logEntry.ok, telegramResponse: data, offer };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export const mlOffersManager = new MlOffersManager();
export default mlOffersManager;
