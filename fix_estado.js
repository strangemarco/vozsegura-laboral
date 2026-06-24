const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const target = 'guardarDenuncias(denuncias);';
const replacement = `if (supabaseClient) {
        await supabaseClient.from('denuncias').update({
            estado: nuevoEstado,
            historial: denuncias[index].historial
        }).eq('id', id);
    }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('app.js', code);
    console.log('Fixed actualizarEstadoCaso in app.js');
} else {
    console.log('Target not found');
}
