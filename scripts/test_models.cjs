const { Client } = require('ssh2');

const script = `
const key = process.env.GEMINI_API_KEY;
const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-exp'];

async function run() {
  for (const m of models) {
    try {
      const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'preco kindle brasil' }] }],
          tools: [{ google_search: {} }]
        })
      });
      const t = await resp.text();
      console.log(m, resp.status, t.slice(0, 150));
    } catch (e) {
      console.log(m, 'Error:', e.message);
    }
  }
}
run();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`node -e "${script.replace(/\n/g, ' ')}"`, (err, stream) => {
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
