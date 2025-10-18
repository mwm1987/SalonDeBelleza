const fs = require('fs');
const path = require('path');

const distPath = path.resolve(__dirname, '../dist/version.json');
const version = { version: Date.now() };
fs.writeFileSync(distPath, JSON.stringify(version, null, 2));

console.log('Archivo version.json generado:', version.version);
