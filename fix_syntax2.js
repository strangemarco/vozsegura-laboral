const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(/function enviarMensajeComite/g, 'async function enviarMensajeComite');

fs.writeFileSync('app.js', code);
console.log("Syntax fixes applied");
