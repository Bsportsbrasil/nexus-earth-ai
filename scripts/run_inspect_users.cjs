const { Client } = require('ssh2');

const scriptContent = `
import { authEngine } from '../engine/auth_identity.js';
import { c2Engine } from '../engine/c2_sovereign.js';

console.log('=== C2 ENGINE ACCOUNTS (' + c2Engine.accounts.size + ') ===');
for (const [id, a] of c2Engine.accounts.entries()) {
  console.log(id, '|', a.name, '|', a.email, '|', a.role, '| status:', a.status);
}

console.log('\\n=== AUTH ENGINE USERS (' + authEngine.usersById.size + ') ===');
for (const [id, u] of authEngine.usersById.entries()) {
  console.log(id, '|', u.name, '|', u.email, '|', u.role, '| created:', u.createdAt);
}
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cat << 'EOF' > /var/www/nexus-earth-ai/scripts/inspect_users.mjs
${scriptContent}
EOF
node /var/www/nexus-earth-ai/scripts/inspect_users.mjs
`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
  });
}).connect({
  host: '177.7.63.135',
  port: 22,
  username: 'root',
  password: '4,kkguMpHf49)M7o',
  readyTimeout: 20000,
  algorithms: {
    serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa']
  }
});
