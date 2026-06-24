const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

if(!code.includes('const MAX_FILE_MB = 10;')) {
    code = code.replace(/const SUPABASE_URL/g, 'const MAX_FILE_MB = 10;\nconst SUPABASE_URL');
    fs.writeFileSync('app.js', code);
    console.log('Added MAX_FILE_MB');
}
