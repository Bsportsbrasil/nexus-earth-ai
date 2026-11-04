const { Client } = require('ssh2');

const cmd = process.argv[2] || 'git status';
const conn = new Client();

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      process.exit(1);
    }
    stream
      .on('close', (code) => {
        conn.end();
        process.exit(code || 0);
      })
      .on('data', d => process.stdout.write(d))
      .stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', (err) => {
  console.error('SSH Connection error:', err.message);
  process.exit(1);
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
