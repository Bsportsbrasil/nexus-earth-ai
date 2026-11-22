import assert from 'node:assert/strict';
process.env.NEXUS_TEST_MODE = '1';
import { adminVaultConfig } from '../engine/admin_vault_config.js';

const st = adminVaultConfig.getMaskedStatus();
assert.equal(st.success, true);
assert.equal(st.storagePermissions, '0600 (Owner-Only)');
assert.ok(st.keys.MP_ACCESS_TOKEN && st.keys.TELEGRAM_BOT_TOKEN && st.keys.NEXUS_ENFORCE_PAYWALL);
// Ensure no plaintext secrets leak even if configured
for (const secretKey of ['MP_ACCESS_TOKEN', 'ASAAS_API_KEY', 'TELEGRAM_BOT_TOKEN', 'OPENAI_API_KEY']) {
  const disp = st.keys[secretKey].display;
  if (st.keys[secretKey].configured) {
    assert.ok(disp.includes('••••'), `${secretKey} must be masked`);
  }
}
// Ensure disallowed key injection is ignored (never applied)
const beforeMap = adminVaultConfig._readEnvMap();
const saveRes = adminVaultConfig.saveConfig({ EVIL_INJECTED_KEY: 'hacked', NEXUS_ADMIN_KEY: 'override' });
assert.deepEqual(saveRes.applied, [], 'Disallowed keys must be strictly rejected by whitelist');
assert.equal(process.env.EVIL_INJECTED_KEY, undefined);
console.log('✓ AdminVaultConfig masking & strict whitelist verified 100%');
