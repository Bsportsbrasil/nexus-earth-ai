const { Client } = require('ssh2');

const remoteScript = `
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.log('NO_KEY');
  process.exit(0);
}
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key)
  .then(r => r.json())
  .then(d => {
    if (d.models) {
      const names = d.models.map(m => m.name.replace('models/', '') + ' (' + (m.supportedGenerationMethods || []).join(',') + ')');
      console.log('Available models:', names);
    } else {
      console.log('Result:', d);
    }
  })
  .catch(e => console.error(e));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`node -e ${JSON.stringify(remoteScript)}`, (err, stream) => {
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
