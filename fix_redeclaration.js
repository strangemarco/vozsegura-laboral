const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

// Replace "const supabase =" with "const supabaseClient ="
code = code.replace(/const supabase = window\.supabase/g, 'const supabaseClient = window.supabase');

// Replace all usages of "supabase" with "supabaseClient" except when it's "window.supabase"
// Actually, it's safer to just replace "supabase.from" with "supabaseClient.from" and "supabase.storage" with "supabaseClient.storage"
// And replace "if(supabase)" with "if(supabaseClient)"
code = code.replace(/if \(!supabase\)/g, 'if (!supabaseClient)');
code = code.replace(/if \(supabase\)/g, 'if (supabaseClient)');
code = code.replace(/supabase\.from/g, 'supabaseClient.from');
code = code.replace(/supabase\.storage/g, 'supabaseClient.storage');

fs.writeFileSync('app.js', code);
console.log("Fixed supabase redeclaration error");
