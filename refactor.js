const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

// 1. Make functions async
code = code.replace(/function cargarTablaAdmin/g, 'async function cargarTablaAdmin');
code = code.replace(/function consultarCaso/g, 'async function consultarCaso');
code = code.replace(/function verDetalleAdmin/g, 'async function verDetalleAdmin');
code = code.replace(/function enviarMensajeDenunciante/g, 'async function enviarMensajeDenunciante');
code = code.replace(/function enviarMensajeAdmin/g, 'async function enviarMensajeAdmin');
code = code.replace(/function cambiarEstado/g, 'async function cambiarEstado');
code = code.replace(/function exportarExcel/g, 'async function exportarExcel');

// 2. Await obtenerDenuncias
code = code.replace(/const denuncias = obtenerDenuncias\(\);/g, 'const denuncias = await obtenerDenuncias();');
code = code.replace(/let denuncias = obtenerDenuncias\(\);/g, 'let denuncias = await obtenerDenuncias();');
code = code.replace(/if \(!denuncias\) denuncias = obtenerDenuncias\(\);/g, 'if (!denuncias) denuncias = await obtenerDenuncias();');

// 3. Update Supabase logic for state and messages
// In enviarMensajeDenunciante
code = code.replace(
    /guardarDenuncias\(denuncias\);\s+mostrarToast\("Mensaje enviado correctamente.", "success"\);\s+consultarCaso\(\);/g,
    `if(supabase) await supabase.from('denuncias').update({ mensajesAnonimos: denuncias[index].mensajesAnonimos }).eq('id', denuncias[index].id);\n    mostrarToast("Mensaje enviado correctamente.", "success");\n    await consultarCaso();`
);

// In enviarMensajeAdmin
code = code.replace(
    /guardarDenuncias\(denuncias\);\s+mostrarToast\("Mensaje enviado correctamente.", "success"\);\s+verDetalleAdmin\(id\);/g,
    `if(supabase) await supabase.from('denuncias').update({ mensajesAnonimos: denuncias[index].mensajesAnonimos, historial: denuncias[index].historial }).eq('id', id);\n    mostrarToast("Mensaje enviado correctamente.", "success");\n    await verDetalleAdmin(id);`
);

// In cambiarEstado
code = code.replace(
    /guardarDenuncias\(denuncias\);\s+mostrarToast\("Estado actualizado exitosamente.", "success"\);\s+verDetalleAdmin\(id\);/g,
    `if(supabase) await supabase.from('denuncias').update({ estado: nuevoEstado, historial: caso.historial }).eq('id', id);\n    mostrarToast("Estado actualizado exitosamente.", "success");\n    await verDetalleAdmin(id);`
);

// Fix onClick handlers in HTML strings if needed. 
// "irDetalleAdmin(d.id)" is fine, but it redirects, so no await needed.

fs.writeFileSync('app.js', code);
console.log("Refactoring complete");
