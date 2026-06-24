const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

// Fix syntax errors identified previously
code = code.replace(/function cargarDashboard/g, 'async function cargarDashboard');
code = code.replace(/function abrirEvidenciaAdmin/g, 'async function abrirEvidenciaAdmin');
code = code.replace(/function actualizarEstadoCaso/g, 'async function actualizarEstadoCaso');
code = code.replace(/function enviarMensajeAdmin/g, 'async function enviarMensajeAdmin');

// Fix double async
code = code.replace(/async async function exportarExcel/g, 'async function exportarExcel');

fs.writeFileSync('app.js', code);
console.log("Syntax fixes applied");
