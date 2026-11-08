const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== AUDITORIA CIRÚRGICA DE SINTAXE JS (WORKSPACE COMPLETO) ===');
const allJsFiles = [];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'scratch') continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walkDir(full);
    } else if (f.endsWith('.js') || f.endsWith('.cjs')) {
      allJsFiles.push(full);
    }
  }
}

walkDir('.');

let syntaxErrorsCount = 0;
for (const file of allJsFiles) {
  try {
    execSync(`node -c "${file}"`, { stdio: 'pipe' });
  } catch (err) {
    syntaxErrorsCount++;
    console.error(`❌ ERRO DE SINTAXE EM: ${file}`);
    console.error(err.stderr.toString());
  }
}

if (syntaxErrorsCount === 0) {
  console.log(`✅ Nenhum erro de sintaxe encontrado em ${allJsFiles.length} arquivos JavaScript!`);
} else {
  console.log(`⚠️ Encontrados ${syntaxErrorsCount} arquivos com erro de sintaxe.`);
}
