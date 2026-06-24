const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Fix onclick UUIDs missing quotes
code = code.replace(/onclick="irDetalleAdmin\(\$\{d\.id\}\)"/g, 'onclick="irDetalleAdmin(\'${d.id}\')"');
code = code.replace(/onclick="actualizarEstadoCaso\(\$\{caso\.id\}\)"/g, 'onclick="actualizarEstadoCaso(\'${caso.id}\')"');
code = code.replace(/onclick="enviarMensajeComite\(\$\{caso\.id\}\)"/g, 'onclick="enviarMensajeComite(\'${caso.id}\')"');
code = code.replace(/onclick="abrirEvidenciaAdmin\(\$\{idCaso\}, \$\{index\}\)"/g, 'onclick="abrirEvidenciaAdmin(\'${idCaso}\', ${index})"');

// Fix dataUrl issue for Supabase public URLs
code = code.replace(/evidencia\.dataUrl/g, '(evidencia.url || evidencia.dataUrl)');

fs.writeFileSync('app.js', code);
console.log('Fixed app.js bugs');
