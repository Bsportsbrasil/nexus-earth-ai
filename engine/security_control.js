import crypto from 'node:crypto';
import { broker } from './broker.js';

/**
 * Sovereign Security & Kill-Switch Controller with Token-Based Admin Authentication
 * Separates public user experience from the Owner's Administrative Control Plane (/admin.html).
 * Only requests bearing a valid signed HMAC/Bearer session token can mutate security state.
 */
class SecurityGovernanceController {
  constructor() {
    this.emergencyLockdown = false;
    this.modules = {
      llm: true,       // Frontier Gemini LLM Inference
      agents: true,    // Multi-Agent DAG Orchestrator
      graphrag: true,  // External Wikipedia / Crossref GraphRAG Ingestion
      studio: true,    // Multimodal Image & Slide Synthesis
      tasks: true      // Task & Calendar Automation
    };
    this.blockedAttempts = 0;
    this.activeSessions = new Map(); // token -> expiresAt
    this.securityEvents = [
      { timestamp: Date.now(), event: 'SECURITY_GOVERNANCE_INITIALIZED', status: 'ARMED_SAFE' }
    ];
  }

  _getAdminSecret() {
    return (process.env.NEXUS_ADMIN_KEY || 'NEXUS-SOVEREIGN-2026').trim();
  }

  _log(event, details = '') {
    const entry = { timestamp: Date.now(), event, details };
    this.securityEvents.push(entry);
    if (this.securityEvents.length > 80) this.securityEvents.shift();
    broker.publish('security.governance', entry);
    return entry;
  }

  /**
   * Authenticates the Owner/Admin and issues a 12-hour cryptographic session token
   */
  login(passkey) {
    const expected = this._getAdminSecret();
    const provided = (passkey || '').trim();
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      this.blockedAttempts++;
      this._log('ADMIN_AUTH_FAILED', 'Invalid administrator passkey attempt blocked');
      return null;
    }
    const token = crypto.randomBytes(32).toString('hex');
    this.activeSessions.set(token, Date.now() + 12 * 3600 * 1000);
    this._log('ADMIN_SESSION_OPENED', 'Sovereign Administrator authenticated');
    return token;
  }

  verifyAdminToken(token) {
    if (!token) return false;
    const clean = token.replace(/^Bearer\s+/i, '').trim();
    const exp = this.activeSessions.get(clean);
    if (!exp) return false;
    if (Date.now() > exp) {
      this.activeSessions.delete(clean);
      return false;
    }
    return true;
  }

  getState() {
    return {
      emergencyLockdown: this.emergencyLockdown,
      modules: { ...this.modules },
      blockedAttempts: this.blockedAttempts,
      recentEvents: this.securityEvents.slice(-20).reverse()
    };
  }

  /**
   * Hard check before any AI subsystem executes. Throws if locked down.
   */
  assertAllowed(moduleName = 'llm') {
    if (this.emergencyLockdown) {
      this.blockedAttempts++;
      this._log('BLOCKED_BY_KILL_SWITCH', `Attempted access to [${moduleName}] during TOTAL LOCKDOWN`);
      throw new Error('SECURITY_LOCKDOWN_ACTIVE: O sistema de IA está temporariamente pausado pela administradora.');
    }
    if (moduleName in this.modules && !this.modules[moduleName]) {
      this.blockedAttempts++;
      this._log('BLOCKED_BY_MODULE_BREAKER', `Subsystem [${moduleName}] is disabled by administrator`);
      throw new Error(`SUBSYSTEM_DISABLED: O módulo [${moduleName.toUpperCase()}] foi pausado pela administradora.`);
    }
    return true;
  }

  engageKillSwitch(reason = 'Manual Administrator Kill-Switch') {
    this.emergencyLockdown = true;
    for (const k of Object.keys(this.modules)) {
      this.modules[k] = false;
    }
    this._log('KILL_SWITCH_ENGAGED', reason);
    return this.getState();
  }

  disengageKillSwitch() {
    this.emergencyLockdown = false;
    for (const k of Object.keys(this.modules)) {
      this.modules[k] = true;
    }
    this._log('SYSTEM_RESTORED_BY_OPERATOR', 'All AI subsystems re-authorized');
    return this.getState();
  }

  setModuleState(moduleName, enabled) {
    if (moduleName in this.modules) {
      this.modules[moduleName] = !!enabled;
      if (enabled && this.emergencyLockdown) {
        this.emergencyLockdown = false;
      }
      this._log('MODULE_BREAKER_UPDATED', `${moduleName.toUpperCase()} -> ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
    return this.getState();
  }

  purgeRuntimeSecrets() {
    delete process.env.GEMINI_API_KEY;
    this._log('RUNTIME_CREDENTIALS_PURGED', 'In-memory GEMINI_API_KEY cleared by administrator');
    return this.getState();
  }
}

export const securityController = new SecurityGovernanceController();
