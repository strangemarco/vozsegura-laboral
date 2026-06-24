const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const target = 'mostrarToast("Denuncia registrada exitosamente.", "success");';
const replacement = `btnSubmit.innerHTML = originalBtnHtml;
    btnSubmit.disabled = false;
    mostrarToast("Denuncia registrada exitosamente.", "success");`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('app.js', code);
    console.log('Fixed button state in app.js');
} else {
    console.log('Target not found');
}
