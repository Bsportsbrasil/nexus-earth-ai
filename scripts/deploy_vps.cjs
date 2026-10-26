const { Client } = require('ssh2');

const conn = new Client();
const commands = `
cd /var/www/nexus-earth-ai
git fetch origin main
git reset --hard origin/main
pm2 reload nexus-earth-ai --update-env
pm2 save
echo "=== VPS FULL MOBILE UPGRADE DEPLOYED ==="
`;

conn.on('ready', () => {
    conn.exec(commands, (err, stream) => {
        if (err) { console.error('Exec error:', err); conn.end(); process.exit(1); }
        stream.on('close', () => { conn.end(); process.exit(0); })
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
