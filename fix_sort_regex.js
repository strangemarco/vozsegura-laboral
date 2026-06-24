const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Replace the select query
code = code.replace(
    /supabaseClient\.from\('denuncias'\)\.select\('\*'\)/g,
    "supabaseClient.from('denuncias').select('*').order('created_at', { ascending: false })"
);

// Remove the client-side sorting line
code = code.replace(
    /data\.sort\(\(a, b\) => new Date\(b\.fechaRegistro\) - new Date\(a\.fechaRegistro\)\);/g,
    "// Sorting is now handled by Supabase"
);

fs.writeFileSync('app.js', code);
console.log('Fixed sort order in app.js via regex');
