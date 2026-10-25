import { broker } from './broker.js';

/**
 * Sovereign Security & Kill-Switch Controller (Hard Circuit Breaker)
 * Allows the human operator to freeze/unfreeze specific AI subsystems or engage
 * an immediate Total Emergency Stop (Kill-Switch) across all LLM, Agent DAG,
 * GraphRAG, and Studio endpoints, as well as purge ephemeral keys/memory.
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
    this.securityEvents = [
      { timestamp: Date.now(), event: 'SECURITY_GOVERNANCE_INITIALIZED', status: 'ARMED_SAFE' }
    ];
  }

  _log(event, details = '') {
    const entry = { timestamp: Date.now(), event, details };
    this.securityEvents.push(entry);
    if (this.securityEvents.length > 80) this.securityEvents.shift();
    broker.publish('security.governance', entry);
    return entry;
  }

  getState() {
    return {
      emergencyLockdown: this.emergencyLockdown,
      modules: { ...this.modules },
      blockedAttempts: this.blockedAttempts,
      recentEvents: this.securityEvents.slice(-15).reverse()
    };
  }

  /**
   * Hard check before any AI subsystem executes. Throws if locked down.
   */
  assertAllowed(moduleName = 'llm') {
    if (this.emergencyLockdown) {
      this.blockedAttempts++;
      this._log('BLOCKED_BY_KILL_SWITCH', `Attempted access to [${moduleName}] during TOTAL LOCKDOWN`);
      throw new Error('SECURITY_LOCKDOWN_ACTIVE: Todo o acesso da IA foi interrompido pelo operador humano (Kill-Switch Ativo).');
    }
    if (moduleName in this.modules && !this.modules[moduleName]) {
      this.blockedAttempts++;
      this._log('BLOCKED_BY_MODULE_BREAKER', `Subsystem [${moduleName}] is disabled by operator`);
      throw new Error(`SUBSYSTEM_DISABLED: O módulo [${moduleName.toUpperCase()}] foi desativado no Dashboard de Segurança.`);
    }
    return true;
  }

  engageKillSwitch(reason = 'Manual Human Operator Kill-Switch') {
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
    this._log('RUNTIME_CREDENTIALS_PURGED', 'In-memory GEMINI_API_KEY cleared by operator');
    return this.getState();
  }
}

export const securityController = new SecurityGovernanceController();
