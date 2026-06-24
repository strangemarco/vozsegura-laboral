const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const target = `async function obtenerDenuncias() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('denuncias').select('*');
    if (error) {
        console.error("Error al obtener denuncias:", error);
        return [];
    }
    // Ordenar por fechaRegistro desc
    data.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
    return data || [];
}`;

const replacement = `async function obtenerDenuncias() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('denuncias').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Error al obtener denuncias:", error);
        return [];
    }
    return data || [];
}`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('app.js', code);
    console.log('Fixed sort order in app.js');
} else {
    console.log('Target not found');
}
