const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

// Update badges for state and urgency
const badgesNew = `
function obtenerBadgeEstadoNew(estado) {
    if (estado === "En revisión") return '<span class="stat-pill pill-blue">En revisión</span>';
    if (estado === "Cerrado") return '<span class="stat-pill pill-green">Cerrado</span>';
    return '<span class="stat-pill pill-yellow">Recibido</span>';
}

function obtenerBadgeUrgenciaNew(urgencia) {
    if (urgencia === "Alto") return '<span class="stat-pill pill-red">Alto</span>';
    if (urgencia === "Medio") return '<span class="stat-pill pill-yellow">Medio</span>';
    return '<span class="stat-pill pill-green">Bajo</span>';
}
`;

if (!code.includes('obtenerBadgeEstadoNew')) {
    code += badgesNew;
}

// Replace the table row mapping logic
const oldRowStr = `
    tbody.innerHTML = casosPaginados.map(d => \`
        <tr>
            <td>\${d.codigo}</td>
            <td>\${d.tipoDenuncia}</td>
            <td>\${d.area}</td>
            <td>\${d.urgencia}</td>
            <td>\${obtenerBadgeEstado(d.estado)}</td>
            <td>\${d.fechaRegistro}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="irDetalleAdmin('\${d.id}')" title="Ver detalle">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    \`).join("");`;

const newRowStr = `
    tbody.innerHTML = casosPaginados.map(d => \`
        <tr>
            <td class="fw-bold align-middle">\${d.codigo}</td>
            <td class="align-middle">
                <span class="badge-tipo">Decisión</span><br>
                <span class="fw-bold">\${d.tipoDenuncia}</span>
            </td>
            <td class="align-middle">
                <span class="fw-bold">\${d.area}</span><br>
                <small class="text-muted"><i class="bi bi-person"></i> \${d.cargoInvolucrado}</small>
            </td>
            <td class="align-middle">
                <i class="bi bi-calendar3"></i> \${d.fechaRegistro.split(',')[0]}
            </td>
            <td class="align-middle">
                \${obtenerBadgeUrgenciaNew(d.urgencia)}
            </td>
            <td class="align-middle text-center">
                \${obtenerBadgeEstadoNew(d.estado)}<br>
                <small class="text-muted" style="font-size: 0.7rem;">\${d.fechaRegistro.split(',')[1] || ''}</small>
            </td>
            <td class="align-middle text-center">
                <button class="btn-eye" onclick="irDetalleAdmin('\${d.id}')" title="Ver detalle">
                    <i class="bi bi-eye-fill"></i>
                </button>
            </td>
        </tr>
    \`).join("");`;

code = code.replace(oldRowStr, newRowStr);

// Now update the dashboard stats calculation to fill the detailed cards
const oldDash = `function cargarDashboard(denuncias) {
    document.getElementById("totalCasos").textContent = denuncias.length;
    document.getElementById("casosNuevos").textContent = denuncias.filter(d => d.estado === "Recibido").length;
    document.getElementById("casosRevision").textContent = denuncias.filter(d => d.estado === "En revisión").length;
    document.getElementById("casosCerrados").textContent = denuncias.filter(d => d.estado === "Cerrado").length;
    document.getElementById("casosUrgentes").textContent = denuncias.filter(d => d.urgencia === "Alto").length;
}`;

const newDash = `function cargarDashboard(denuncias) {
    const total = denuncias.length;
    const recibidos = denuncias.filter(d => d.estado === "Recibido").length;
    const revision = denuncias.filter(d => d.estado === "En revisión").length;
    const cerrados = denuncias.filter(d => d.estado === "Cerrado").length;
    const urgAlto = denuncias.filter(d => d.urgencia === "Alto").length;
    const urgMedio = denuncias.filter(d => d.urgencia === "Medio").length;
    const urgBajo = denuncias.filter(d => d.urgencia === "Bajo").length;

    // Actualizar números grandes
    const elTotal = document.getElementById("totalCasos");
    if(elTotal) elTotal.textContent = total;
    
    const elCerrados = document.getElementById("casosCerrados");
    if(elCerrados) elCerrados.textContent = cerrados;

    const elUrgentes = document.getElementById("casosUrgentes");
    if(elUrgentes) elUrgentes.textContent = urgAlto;

    const elRevision = document.getElementById("casosRevision");
    if(elRevision) elRevision.textContent = revision;

    // Actualizar pills dinámicos (se asume que se van a insertar en el HTML)
    const cards = document.querySelectorAll('.stat-card-new');
    if (cards.length >= 3) {
        // Tarjeta Atendidas (Cerrados) -> Pill por urgencias de esos cerrados (para imitar el diseño)
        const cerradosAlto = denuncias.filter(d => d.estado === "Cerrado" && d.urgencia === "Alto").length;
        const cerradosMedio = denuncias.filter(d => d.estado === "Cerrado" && d.urgencia === "Medio").length;
        const cerradosBajo = denuncias.filter(d => d.estado === "Cerrado" && d.urgencia === "Bajo").length;
        
        const right1 = cards[1].querySelector('.stat-card-right');
        if (right1) {
            right1.innerHTML = \`
                <span class="stat-pill pill-filled-red">\${cerradosAlto} Urgencia Alta</span>
                <span class="stat-pill pill-filled-blue">\${cerradosMedio} Urgencia Media</span>
                <span class="stat-pill pill-filled-green">\${cerradosBajo} Urgencia Baja</span>
            \`;
        }

        // Tarjeta Urgentes (Alto) -> Pill por estado de esos urgentes
        const altoRecibido = denuncias.filter(d => d.urgencia === "Alto" && d.estado === "Recibido").length;
        const altoRevision = denuncias.filter(d => d.urgencia === "Alto" && d.estado === "En revisión").length;
        const altoCerrado = denuncias.filter(d => d.urgencia === "Alto" && d.estado === "Cerrado").length;
        
        const right2 = cards[2].querySelector('.stat-card-right');
        if (right2) {
            right2.innerHTML = \`
                <span class="stat-pill pill-red">\${altoRecibido} Recibido</span>
                <span class="stat-pill pill-blue">\${altoRevision} En revisión</span>
                <span class="stat-pill pill-green">\${altoCerrado} Cerrado</span>
            \`;
        }
    }
}`;

code = code.replace(oldDash, newDash);

fs.writeFileSync('app.js', code);
console.log('Fixed app.js table rendering and dashboard stats logic');
