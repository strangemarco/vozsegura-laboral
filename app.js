const MAX_FILE_MB = 10;
const SUPABASE_URL = 'https://dypjzfkdlcpdnuveylwj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cGp6ZmtkbGNwZG51dmV5bHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTU1NTksImV4cCI6MjA5Nzg3MTU1OX0.aoyeufcSIRVH-bSRALBC3XaQJle2jmojqOpj5OOfra0';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

document.addEventListener("DOMContentLoaded", async () => {
    if (document.getElementById("inicio")) {
        mostrarSeccion("inicio");
    }

    if (document.getElementById("panelAdmin")) {
        if (sessionStorage.getItem("adminAuth") !== "true") {
            window.location.href = "login.html";
            return;
        }
        await cargarTablaAdmin();
    }

    if (document.getElementById("detalleCasoAdmin")) {
        if (sessionStorage.getItem("adminAuth") !== "true") {
            window.location.href = "login.html";
            return;
        }
        const idActual = sessionStorage.getItem("casoAdminActual");
        if (idActual) {
            await verDetalleAdmin(idActual);
        } else {
            window.location.href = "admin.html";
        }
    }

    const formDenuncia = document.getElementById("formDenuncia");
    const inputEvidencias = document.getElementById("evidencias");

    if (formDenuncia) {
        formDenuncia.addEventListener("submit", function (e) {
            e.preventDefault();
            registrarDenuncia();
        });
    }

    if (inputEvidencias) {
        inputEvidencias.addEventListener("change", mostrarPreviewEvidencias);
    }
});

function mostrarSeccion(id) {
    const secciones = document.querySelectorAll(".seccion");

    secciones.forEach(seccion => {
        seccion.classList.add("d-none");
    });

    const target = document.getElementById(id);
    if (target) {
        target.classList.remove("d-none");
    }
}

async function obtenerDenuncias() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('denuncias').select('*');
    if (error) {
        console.error("Error al obtener denuncias:", error);
        return [];
    }
    
    // Supabase retorna los registros cronológicamente por defecto
    // Invertimos el arreglo para que los últimos registros creados aparezcan primero
    data.reverse();
    return data || [];
}

function generarCodigo() {
    const year = new Date().getFullYear();
    const numero = Math.floor(Math.random() * 9000) + 1000;
    return `CASO-${year}-${numero}`;
}

function generarPin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

async function registrarDenuncia() {
    const tipoDenuncia = document.getElementById("tipoDenuncia").value;
    const area = document.getElementById("area").value.trim();
    const cargoInvolucrado = document.getElementById("cargoInvolucrado").value;
    const fechaHecho = document.getElementById("fechaHecho").value;
    const urgencia = document.getElementById("urgencia").value;
    const descripcion = document.getElementById("descripcion").value.trim();
    const testigos = document.getElementById("testigos") ? document.getElementById("testigos").value.trim() : "";
    const contacto = document.getElementById("contacto").value.trim();

    if (!tipoDenuncia || !area || !cargoInvolucrado || !urgencia || !descripcion) {
        mostrarToast("Por favor, complete los campos obligatorios.", "warning");
        return;
    }

    const btnSubmit = document.querySelector("#formDenuncia button[type='submit']");
    const originalBtnHtml = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...`;
    btnSubmit.disabled = true;

    let evidenciasProcesadas = [];
    try {
        evidenciasProcesadas = await procesarEvidencias();
    } catch (error) {
        mostrarToast(error.message, "error");
        btnSubmit.innerHTML = originalBtnHtml;
        btnSubmit.disabled = false;
        return;
    }

    const codigo = generarCodigo();
    const pin = generarPin();

    const nuevaDenuncia = {
        codigo: codigo,
        pin: pin,
        tipoDenuncia: tipoDenuncia,
        area: area,
        cargoInvolucrado: cargoInvolucrado,
        fechaHecho: fechaHecho,
        urgencia: urgencia,
        descripcion: descripcion,
        testigos: testigos,
        contacto: contacto,
        evidencias: evidenciasProcesadas,
        estado: "Recibido",
        fechaRegistro: new Date().toLocaleString(),
        historial: [
            {
                fecha: new Date().toLocaleString(),
                estado: "Recibido",
                comentario: "La denuncia fue registrada en el sistema."
            }
        ]
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.from('denuncias').insert([nuevaDenuncia]);
        if (error) {
            console.error("Error al guardar en Supabase:", error);
            mostrarToast("Hubo un error al guardar la denuncia.", "error");
            btnSubmit.innerHTML = originalBtnHtml;
            btnSubmit.disabled = false;
            return;
        }
    }

    btnSubmit.innerHTML = originalBtnHtml;
    btnSubmit.disabled = false;
    mostrarToast("Denuncia registrada exitosamente.", "success");
    document.getElementById("codigoGenerado").textContent = codigo;
    document.getElementById("pinGenerado").textContent = pin;

    const modal = new bootstrap.Modal(document.getElementById("modalCodigo"));
    modal.show();

    document.getElementById("formDenuncia").reset();

    const preview = document.getElementById("previewEvidencias");
    if (preview) {
        preview.innerHTML = "";
    }
}

function mostrarPreviewEvidencias() {
    const input = document.getElementById("evidencias");
    const preview = document.getElementById("previewEvidencias");

    preview.innerHTML = "";

    const archivos = Array.from(input.files);

    if (archivos.length === 0) {
        return;
    }

    archivos.forEach((archivo, index) => {
        const sizeMB = archivo.size / (1024 * 1024);

        const col = document.createElement("div");
        col.className = "col-md-4 mb-3";

        let contenidoPreview = "";

        if (archivo.type.startsWith("image/")) {
            const url = URL.createObjectURL(archivo);
            contenidoPreview = `
                <div class="preview-media">
                    <img src="${url}" alt="Evidencia ${index + 1}">
                </div>
            `;
        } else if (archivo.type.startsWith("video/")) {
            const url = URL.createObjectURL(archivo);
            contenidoPreview = `
                <div class="preview-media">
                    <video src="${url}" controls></video>
                </div>
            `;
        } else if (archivo.type.startsWith("audio/")) {
            contenidoPreview = `
                <div class="preview-media">
                    <i class="bi bi-mic-fill"></i>
                </div>
            `;
        } else {
            contenidoPreview = `
                <div class="preview-media">
                    <i class="${obtenerIconoArchivo(archivo.type, archivo.name)}"></i>
                </div>
            `;
        }

        col.innerHTML = `
            <div class="preview-card">
                ${contenidoPreview}

                <div class="preview-info">
                    <strong>${archivo.name}</strong>
                    <small>${formatearTamano(archivo.size)}</small>
                    ${sizeMB > MAX_FILE_MB
                ? `<small class="text-danger d-block">Archivo demasiado pesado para este prototipo.</small>`
                : ""
            }
                </div>
            </div>
        `;

        preview.appendChild(col);
    });
}

async function procesarEvidencias() {
    const input = document.getElementById("evidencias");
    if (!input || input.files.length === 0) return [];

    const archivos = Array.from(input.files);
    const evidenciasSubidas = [];

    for (let archivo of archivos) {
        const sizeMB = archivo.size / (1024 * 1024);
        if (sizeMB > 10) {
            throw new Error(`El archivo "${archivo.name}" supera el límite de 10 MB.`);
        }

        if (supabaseClient) {
            const fileExt = archivo.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { data, error } = await supabaseClient.storage.from('evidencias').upload(fileName, archivo);

            if (error) {
                console.error("Error subiendo evidencia:", error);
                throw new Error(`No se pudo subir el archivo "${archivo.name}".`);
            }

            const { data: publicUrlData } = supabaseClient.storage.from('evidencias').getPublicUrl(fileName);

            evidenciasSubidas.push({
                nombre: archivo.name,
                tipo: archivo.type || "application/octet-stream",
                tamano: archivo.size,
                url: publicUrlData.publicUrl,
                categoria: obtenerCategoriaArchivo(archivo.type, archivo.name)
            });
        }
    }

    return evidenciasSubidas;
}

function obtenerCategoriaArchivo(tipo, nombre) {
    const extension = nombre.split(".").pop().toLowerCase();

    if (tipo.startsWith("image/")) return "imagen";
    if (tipo.startsWith("video/")) return "video";
    if (tipo.startsWith("audio/")) return "audio";
    if (tipo.includes("pdf") || extension === "pdf") return "pdf";

    return "documento";
}

function obtenerIconoArchivo(tipo, nombre) {
    const extension = nombre.split(".").pop().toLowerCase();

    if (tipo.includes("pdf") || extension === "pdf") {
        return "bi bi-file-earmark-pdf-fill";
    }

    if (["doc", "docx"].includes(extension)) {
        return "bi bi-file-earmark-word-fill";
    }

    if (["xls", "xlsx"].includes(extension)) {
        return "bi bi-file-earmark-excel-fill";
    }

    if (["ppt", "pptx"].includes(extension)) {
        return "bi bi-file-earmark-ppt-fill";
    }

    if (["txt"].includes(extension)) {
        return "bi bi-file-earmark-text-fill";
    }

    return "bi bi-file-earmark-fill";
}

function formatearTamano(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderizarEvidencias(evidencias) {
    if (!evidencias || evidencias.length === 0) {
        return `
            <div class="alert alert-light border">
                No se adjuntaron evidencias.
            </div>
        `;
    }

    return `
        <div class="admin-evidence-grid">
            ${evidencias.map(evidencia => {
        if (typeof evidencia === "string") {
            return `
                        <div class="admin-evidence-card">
                            <div class="admin-evidence-preview">
                                <i class="bi bi-file-earmark-fill"></i>
                            </div>
                            <strong>${evidencia}</strong>
                            <small>Archivo registrado anteriormente.</small>
                        </div>
                    `;
        }

        let preview = "";

        if (evidencia.categoria === "imagen") {
            preview = `
                        <div class="admin-evidence-preview">
                            <img src="${(evidencia.url || evidencia.dataUrl)}" alt="${evidencia.nombre}">
                        </div>
                    `;
        } else if (evidencia.categoria === "video") {
            preview = `
                        <div class="admin-evidence-preview">
                            <video src="${(evidencia.url || evidencia.dataUrl)}" controls></video>
                        </div>
                    `;
        } else if (evidencia.categoria === "audio") {
            preview = `
                        <div class="admin-evidence-preview">
                            <audio src="${(evidencia.url || evidencia.dataUrl)}" controls></audio>
                        </div>
                    `;
        } else if (evidencia.categoria === "pdf") {
            preview = `
                        <div class="admin-evidence-preview">
                            <iframe src="${(evidencia.url || evidencia.dataUrl)}" width="100%" height="180"></iframe>
                        </div>
                    `;
        } else {
            preview = `
                        <div class="admin-evidence-preview">
                            <i class="${obtenerIconoArchivo(evidencia.tipo, evidencia.nombre)}"></i>
                        </div>
                    `;
        }

        return `
                    <div class="admin-evidence-card">
                        ${preview}
                        <strong>${evidencia.nombre}</strong>
                        <small>${formatearTamano(evidencia.tamano)}</small>

                        <a href="${(evidencia.url || evidencia.dataUrl)}"
                           target="_blank"
                           download="${evidencia.nombre}"
                           class="btn btn-sm btn-outline-primary w-100 mt-2">
                            <i class="bi bi-eye me-1"></i>
                            Ver / descargar
                        </a>
                    </div>
                `;
    }).join("")}
        </div>
    `;
}

async function consultarCaso() {
    const codigo = document.getElementById("codigoConsulta").value.trim();
    const pin = document.getElementById("pinConsulta").value.trim();
    const resultado = document.getElementById("resultadoSeguimiento");

    if (!codigo || !pin) {
        mostrarToast("Por favor, ingrese el código y el PIN.", "error");
        return;
    }

    const denuncias = await obtenerDenuncias();
    const caso = denuncias.find(d => d.codigo === codigo && d.pin === pin);

    if (!caso) {
        resultado.innerHTML = `
            <div class="alert alert-danger mt-3 d-flex align-items-center border-0 shadow-sm">
                <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                <div>
                    <strong>Denuncia no encontrada</strong><br>
                    Revise que el Código y el PIN ingresados sean correctos.
                </div>
            </div>
        `;
        return;
    }

    let evidenciasHTML = renderizarEvidenciasAdmin(caso.evidencias, caso.id);

    let historialHTML = caso.historial.map(h => `
        <div class="timeline-item mb-3 pb-3 border-bottom position-relative">
            <span class="badge ${h.estado === 'Cerrado' ? 'bg-success' : 'bg-primary'} mb-1">${h.estado}</span>
            <small class="text-muted d-block float-end">${h.fecha}</small>
            <p class="mb-0 mt-2 text-dark">${h.comentario}</p>
        </div>
    `).join("");

    let mensajesHTML = "";
    if (caso.mensajesAnonimos && caso.mensajesAnonimos.length > 0) {
        mensajesHTML = caso.mensajesAnonimos.map(m => `
            <div class="mb-2 p-2 rounded ${m.emisor === "Denunciante" ? "bg-light border text-end" : "bg-primary bg-opacity-10 text-start"}">
                <strong class="${m.emisor === "Denunciante" ? "text-dark" : "text-primary"}">${m.emisor}:</strong> 
                <span class="text-dark">${m.mensaje}</span>
                <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;">${m.fecha}</div>
            </div>
        `).join("");
    } else {
        mensajesHTML = `<div class="text-muted text-center py-4"><i class="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>No hay mensajes del comité aún.</div>`;
    }

    resultado.innerHTML = `
        <div class="card mt-4 shadow-sm border-0">
            <div class="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
                <h5 class="mb-0 fw-bold"><i class="bi bi-shield-check me-2"></i>Seguimiento de Caso: ${caso.codigo}</h5>
                ${obtenerBadgeEstado(caso.estado)}
            </div>

            <div class="card-body p-4">
                <div class="row g-3 mb-4 bg-light p-3 rounded">
                    <div class="col-md-4">
                        <span class="text-muted small d-block text-uppercase fw-bold">Tipo de Denuncia</span>
                        <span class="fs-6 fw-bold text-primary">${caso.tipoDenuncia}</span>
                    </div>
                    <div class="col-md-4">
                        <span class="text-muted small d-block text-uppercase fw-bold">Área Involucrada</span>
                        <span class="fs-6 text-dark">${caso.area}</span>
                    </div>
                    <div class="col-md-4">
                        <span class="text-muted small d-block text-uppercase fw-bold">Fecha Registro</span>
                        <span class="fs-6 text-dark">${caso.fechaRegistro}</span>
                    </div>
                </div>

                <div class="row g-4">
                    <div class="col-lg-6">
                        <h6 class="fw-bold text-dark border-bottom pb-2"><i class="bi bi-clock-history me-2 text-primary"></i>Historial de Estados</h6>
                        <div class="pe-2 mb-4" style="max-height: 250px; overflow-y: auto;">
                            ${historialHTML}
                        </div>

                        <h6 class="fw-bold text-dark border-bottom pb-2 mt-4"><i class="bi bi-paperclip me-2 text-primary"></i>Tus Evidencias</h6>
                        ${evidenciasHTML}
                    </div>

                    <div class="col-lg-6">
                        <h6 class="fw-bold text-dark border-bottom pb-2"><i class="bi bi-chat-dots-fill me-2 text-primary"></i>Buzón Anónimo con el Comité</h6>
                        <div class="card border-0 shadow-sm bg-white" style="border: 1px solid #e1ecf7 !important;">
                            <div class="card-body d-flex flex-column" style="height: 400px;">
                                <div class="chat-messages flex-grow-1 overflow-auto mb-3 pe-2">
                                    ${mensajesHTML}
                                </div>
                                <div class="border-top pt-3 mt-auto">
                                    <label class="form-label fw-bold text-secondary small">Responder al comité (Anónimo)</label>
                                    <textarea class="form-control mb-2" id="respuestaAnonima" rows="2" placeholder="Escriba aquí para aportar más datos..."></textarea>
                                    <button class="btn btn-primary w-100 fw-bold" onclick="enviarMensajeDenunciante('${caso.codigo}', '${caso.pin}')">
                                        <i class="bi bi-send-fill me-2"></i>Enviar Respuesta
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function enviarMensajeDenunciante(codigo, pin) {
    const mensaje = document.getElementById("respuestaAnonima").value.trim();

    if (!mensaje) {
        mostrarToast("Debe escribir un mensaje.", "warning");
        return;
    }

    const denuncias = await obtenerDenuncias();
    const index = denuncias.findIndex(d => d.codigo === codigo && d.pin === pin);

    if (index === -1) {
        mostrarToast("No se encontró el caso.", "error");
        return;
    }

    denuncias[index].mensajesAnonimos.push({
        emisor: "Denunciante",
        mensaje: mensaje,
        fecha: new Date().toLocaleString()
    });

    if (supabaseClient) await supabaseClient.from('denuncias').update({ mensajesAnonimos: denuncias[index].mensajesAnonimos }).eq('id', denuncias[index].id);
    mostrarToast("Mensaje enviado correctamente.", "success");
    await consultarCaso();
}

function loginAdmin() {
    const password = document.getElementById("passwordAdmin").value;

    if (password === "1311") {
        sessionStorage.setItem("adminAuth", "true");
        window.location.href = "admin.html";
    } else {
        mostrarToast("Contraseña incorrecta.", "error");
    }
}

function cerrarSesionAdmin() {
    sessionStorage.removeItem("adminAuth");
    window.location.href = "login.html";
}

async function cargarDashboard(denuncias) {
    if (!document.getElementById("totalCasos")) return;
    if (!denuncias) denuncias = await obtenerDenuncias();

    document.getElementById("totalCasos").textContent = denuncias.length;
    if (document.getElementById("casosRecibidos")) document.getElementById("casosRecibidos").textContent = denuncias.filter(d => d.estado === "Recibido").length;
    if (document.getElementById("casosRevision")) document.getElementById("casosRevision").textContent = denuncias.filter(d => d.estado === "En revisión").length;
    if (document.getElementById("casosUrgentes")) document.getElementById("casosUrgentes").textContent = denuncias.filter(d => d.urgencia === "Alto").length;
    if (document.getElementById("casosCerrados")) document.getElementById("casosCerrados").textContent = denuncias.filter(d => d.estado === "Cerrado").length;

    if (typeof Chart !== 'undefined') {
        renderizarGraficos(denuncias);
    }
}

let paginaActualAdmin = 1;
const CASOS_POR_PAGINA = 10;

async function cargarTablaAdmin(resetPage = false) {
    if (resetPage === true || typeof resetPage === 'number') {
        paginaActualAdmin = typeof resetPage === 'number' ? resetPage : 1;
    }

    const tbody = document.getElementById("tablaCasos");
    if (!tbody) return;

    const buscador = document.getElementById("buscadorAdmin") ? document.getElementById("buscadorAdmin").value.toLowerCase() : "";
    const filtroEstado = document.getElementById("filtroEstado") ? document.getElementById("filtroEstado").value : "";
    const filtroUrgencia = document.getElementById("filtroUrgencia") ? document.getElementById("filtroUrgencia").value : "";

    let denuncias = await obtenerDenuncias();

    if (buscador) {
        denuncias = denuncias.filter(d =>
            d.codigo.toLowerCase().includes(buscador) ||
            (d.area && d.area.toLowerCase().includes(buscador)) ||
            (d.tipoDenuncia && d.tipoDenuncia.toLowerCase().includes(buscador))
        );
    }

    if (filtroEstado && filtroEstado !== "Todos") {
        denuncias = denuncias.filter(d => d.estado === filtroEstado);
    }

    if (filtroUrgencia && filtroUrgencia !== "Todas") {
        denuncias = denuncias.filter(d => d.urgencia === filtroUrgencia);
    }

    cargarDashboard(denuncias);

    const totalCasos = denuncias.length;
    const totalPaginas = Math.ceil(totalCasos / CASOS_POR_PAGINA);

    if (totalCasos === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    No existen denuncias registradas.
                </td>
            </tr>
        `;
        if (document.getElementById("paginacionInfo")) {
            document.getElementById("paginacionInfo").textContent = "Mostrando 0 a 0 de 0 casos";
            document.getElementById("paginacionControles").innerHTML = "";
        }
        return;
    }

    if (paginaActualAdmin > totalPaginas) paginaActualAdmin = totalPaginas;

    const inicio = (paginaActualAdmin - 1) * CASOS_POR_PAGINA;
    const fin = Math.min(inicio + CASOS_POR_PAGINA, totalCasos);

    const casosPaginados = denuncias.slice(inicio, fin);

    tbody.innerHTML = casosPaginados.map(d => `
        <tr>
            <td>${d.codigo}</td>
            <td>${d.tipoDenuncia}</td>
            <td>${d.area}</td>
            <td>${d.urgencia}</td>
            <td>${obtenerBadgeEstado(d.estado)}</td>
            <td>${d.fechaRegistro}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="irDetalleAdmin('${d.id}')" title="Ver detalle">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join("");

    if (document.getElementById("paginacionInfo")) {
        document.getElementById("paginacionInfo").textContent = `Mostrando ${inicio + 1} a ${fin} de ${totalCasos} casos`;

        let controlesHTML = `
            <li class="page-item ${paginaActualAdmin === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="cargarTablaAdmin(${paginaActualAdmin - 1})">Anterior</button>
            </li>
        `;

        for (let i = 1; i <= totalPaginas; i++) {
            controlesHTML += `
                <li class="page-item ${i === paginaActualAdmin ? 'active' : ''}">
                    <button class="page-link" onclick="cargarTablaAdmin(${i})">${i}</button>
                </li>
            `;
        }

        controlesHTML += `
            <li class="page-item ${paginaActualAdmin === totalPaginas ? 'disabled' : ''}">
                <button class="page-link" onclick="cargarTablaAdmin(${paginaActualAdmin + 1})">Siguiente</button>
            </li>
        `;

        document.getElementById("paginacionControles").innerHTML = controlesHTML;
    }
}

function irDetalleAdmin(id) {
    sessionStorage.setItem("casoAdminActual", id);
    window.location.href = "admin_detalle.html";
}

async function verDetalleAdmin(id) {
    const denuncias = await obtenerDenuncias();
    const caso = denuncias.find(d => d.id === id);

    if (!caso) {
        mostrarToast("Caso no encontrado.", "error");
        return;
    }

    let evidenciasHTML = renderizarEvidenciasAdmin(caso.evidencias, caso.id);

    let mensajesHTML = "";
    if (caso.mensajesAnonimos && caso.mensajesAnonimos.length > 0) {
        mensajesHTML = caso.mensajesAnonimos.map(m => `
            <div class="mb-2 p-2 rounded ${m.emisor === "Comité" ? "bg-light border text-end" : "bg-primary bg-opacity-10 text-start"}">
                <strong class="${m.emisor === "Comité" ? "text-dark" : "text-primary"}">${m.emisor}:</strong> 
                <span class="text-dark">${m.mensaje}</span>
                <div class="text-muted" style="font-size: 0.75rem; margin-top: 4px;">${m.fecha}</div>
            </div>
        `).join("");
    } else {
        mensajesHTML = `<div class="text-muted text-center py-4"><i class="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>No hay mensajes registrados.</div>`;
    }

    document.getElementById("detalleCasoAdmin").innerHTML = `
        <div class="row g-4">
            <div class="col-lg-8">
                <!-- INFO PRINCIPAL -->
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 text-primary fw-bold"><i class="bi bi-file-earmark-text-fill me-2"></i>Caso: ${caso.codigo}</h5>
                        ${obtenerBadgeEstado(caso.estado)}
                    </div>
                    <div class="card-body">
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <span class="text-muted small d-block text-uppercase fw-bold">Tipo de Denuncia</span>
                                <span class="fs-6">${caso.tipoDenuncia}</span>
                            </div>
                            <div class="col-md-4">
                                <span class="text-muted small d-block text-uppercase fw-bold">Área / Depto</span>
                                <span class="fs-6">${caso.area}</span>
                            </div>
                            <div class="col-md-4">
                                <span class="text-muted small d-block text-uppercase fw-bold">Cargo Involucrado</span>
                                <span class="fs-6">${caso.cargoInvolucrado}</span>
                            </div>
                            <div class="col-md-4">
                                <span class="text-muted small d-block text-uppercase fw-bold">Fecha del Hecho</span>
                                <span class="fs-6">${caso.fechaHecho || "No especificada"}</span>
                            </div>
                            <div class="col-md-4">
                                <span class="text-muted small d-block text-uppercase fw-bold">Urgencia</span>
                                <span class="badge ${caso.urgencia === 'Alto' ? 'bg-danger' : (caso.urgencia === 'Medio' ? 'bg-warning text-dark' : 'bg-info')}">${caso.urgencia}</span>
                            </div>
                            <div class="col-md-4">
                                <span class="text-muted small d-block text-uppercase fw-bold">Fecha Registro</span>
                                <span class="fs-6">${caso.fechaRegistro}</span>
                            </div>
                        </div>

                        <h6 class="fw-bold text-dark border-bottom pb-2">Descripción de los hechos</h6>
                        <div class="bg-light p-3 rounded mb-4 text-dark" style="white-space: pre-wrap;">${caso.descripcion}</div>

                        <div class="row g-3">
                            <div class="col-md-6">
                                <h6 class="fw-bold text-dark border-bottom pb-2">Testigos o referencias</h6>
                                <p class="text-muted">${caso.testigos || "Ninguno especificado"}</p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="fw-bold text-dark border-bottom pb-2">Contacto (Opcional)</h6>
                                <p class="text-muted">${caso.contacto || "Anónimo"}</p>
                            </div>
                        </div>

                        <h6 class="fw-bold text-dark border-bottom pb-2 mt-4"><i class="bi bi-paperclip me-2"></i>Evidencias Adjuntas</h6>
                        ${evidenciasHTML}
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <!-- GESTIÓN -->
                <div class="card shadow-sm border-0 mb-4">
                    <div class="card-header bg-dark text-white py-3">
                        <h6 class="mb-0 fw-bold"><i class="bi bi-arrow-repeat me-2"></i>Gestión del Estado</h6>
                    </div>
                    <div class="card-body">
                        <label class="form-label fw-bold text-secondary">Nuevo estado</label>
                        <select class="form-select mb-3" id="nuevoEstado">
                            <option value="Recibido" ${caso.estado === 'Recibido' ? 'selected' : ''}>Recibido</option>
                            <option value="En revisión" ${caso.estado === 'En revisión' ? 'selected' : ''}>En revisión</option>
                            <option value="Con resolución" ${caso.estado === 'Con resolución' ? 'selected' : ''}>Con resolución</option>
                            <option value="Cerrado" ${caso.estado === 'Cerrado' ? 'selected' : ''}>Cerrado</option>
                        </select>

                        <label class="form-label fw-bold text-secondary">Comentario interno</label>
                        <textarea class="form-control mb-3" id="comentarioEstado" rows="2" placeholder="Ej: Caso derivado al Comité..."></textarea>

                        <button class="btn btn-success w-100 fw-bold" onclick="actualizarEstadoCaso('${caso.id}')">
                            <i class="bi bi-check-circle me-2"></i>Guardar Cambios
                        </button>
                    </div>
                </div>

                <!-- BUZÓN -->
                <div class="card shadow-sm border-0">
                    <div class="card-header bg-info text-white py-3">
                        <h6 class="mb-0 fw-bold"><i class="bi bi-chat-dots-fill me-2"></i>Buzón Anónimo</h6>
                    </div>
                    <div class="card-body d-flex flex-column" style="max-height: 400px;">
                        <div class="chat-messages flex-grow-1 overflow-auto mb-3 pe-2">
                            ${mensajesHTML}
                        </div>
                        <div class="border-top pt-3">
                            <label class="form-label fw-bold text-secondary small">Enviar mensaje al denunciante</label>
                            <textarea class="form-control mb-2" id="mensajeComite" rows="2" placeholder="Solicitar más información..."></textarea>
                            <button class="btn btn-info text-white w-100 fw-bold" onclick="enviarMensajeComite('${caso.id}')">
                                <i class="bi bi-send-fill me-2"></i>Enviar Mensaje
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderizarEvidenciasAdmin(evidencias, idCaso) {
    if (!evidencias || evidencias.length === 0) {
        return `<div class="alert alert-light border text-center text-muted">No se adjuntaron evidencias.</div>`;
    }

    return `
        <div class="admin-evidence-grid">
            ${evidencias.map((evidencia, index) => {
        if (typeof evidencia === "string") {
            return `
                        <div class="admin-evidence-card p-3 text-center border rounded bg-light">
                            <i class="bi bi-file-earmark-fill fs-1 text-primary"></i>
                            <strong class="mt-2 d-block text-truncate" title="${evidencia}">${evidencia}</strong>
                        </div>
                    `;
        }

        let previewIcon = "bi-file-earmark-fill";
        if (evidencia.categoria === "imagen") previewIcon = "bi-image";
        if (evidencia.categoria === "video") previewIcon = "bi-film";
        if (evidencia.categoria === "audio") previewIcon = "bi-file-music";
        if (evidencia.categoria === "pdf") previewIcon = "bi-file-pdf";

        return `
                    <div class="admin-evidence-card p-3 text-center border rounded bg-light d-flex flex-column justify-content-between h-100">
                        <div>
                            <i class="bi ${previewIcon} fs-1 text-primary"></i>
                            <strong class="mt-2 d-block text-truncate" title="${evidencia.nombre}">${evidencia.nombre}</strong>
                            <small class="text-muted">${formatearTamano(evidencia.tamano)}</small>
                        </div>
                        <button class="btn btn-sm btn-outline-primary mt-3 w-100" onclick="abrirEvidenciaAdmin('${idCaso}', ${index})">
                            <i class="bi bi-eye me-1"></i>Ver Evidencia
                        </button>
                    </div>
                `;
    }).join("")}
        </div>
    `;
}

async function abrirEvidenciaAdmin(idCaso, indexEvidencia) {
    const denuncias = await obtenerDenuncias();
    const caso = denuncias.find(d => d.id === idCaso);
    if (!caso || !caso.evidencias || !caso.evidencias[indexEvidencia]) return;

    const evidencia = caso.evidencias[indexEvidencia];

    if (evidencia.categoria === "imagen" || evidencia.categoria === "pdf" || evidencia.categoria === "video" || evidencia.categoria === "audio") {
        document.getElementById("tituloEvidencia").textContent = evidencia.nombre;
        const contenedor = document.getElementById("contenedorEvidencia");

        if (evidencia.categoria === "imagen") {
            contenedor.innerHTML = `<img src="${(evidencia.url || evidencia.dataUrl)}" style="max-width: 100%; max-height: 80vh; object-fit: contain;">`;
        } else if (evidencia.categoria === "pdf") {
            contenedor.innerHTML = `<iframe src="${(evidencia.url || evidencia.dataUrl)}" style="width: 100%; height: 80vh; border: none;"></iframe>`;
        } else if (evidencia.categoria === "video") {
            contenedor.innerHTML = `<video src="${(evidencia.url || evidencia.dataUrl)}" controls style="max-width: 100%; max-height: 80vh;"></video>`;
        } else if (evidencia.categoria === "audio") {
            contenedor.innerHTML = `<div class="p-5 bg-white rounded"><i class="bi bi-file-music fs-1 text-primary d-block mb-3"></i><audio src="${(evidencia.url || evidencia.dataUrl)}" controls></audio></div>`;
        }

        const modal = new bootstrap.Modal(document.getElementById("modalEvidencia"));
        modal.show();
    } else {
        const a = document.createElement("a");
        a.href = (evidencia.url || evidencia.dataUrl);
        a.download = evidencia.nombre;
        a.click();
    }
}

async function actualizarEstadoCaso(id) {
    const denuncias = await obtenerDenuncias();
    const index = denuncias.findIndex(d => d.id === id);

    if (index === -1) {
        mostrarToast("Caso no encontrado.", "error");
        return;
    }

    const nuevoEstado = document.getElementById("nuevoEstado").value;
    const comentario = document.getElementById("comentarioEstado").value.trim();

    denuncias[index].estado = nuevoEstado;

    denuncias[index].historial.push({
        fecha: new Date().toLocaleString(),
        estado: nuevoEstado,
        comentario: comentario || "El estado del caso fue actualizado."
    });

    if (supabaseClient) {
        await supabaseClient.from('denuncias').update({
            estado: nuevoEstado,
            historial: denuncias[index].historial
        }).eq('id', id);
    }

    mostrarToast("Caso actualizado correctamente.", "success");

    if (document.getElementById("panelAdmin")) {
        cargarTablaAdmin();
    }
    verDetalleAdmin(id);
}

async function enviarMensajeComite(id) {
    const mensaje = document.getElementById("mensajeComite").value.trim();

    if (!mensaje) {
        mostrarToast("Debe escribir un mensaje.", "warning");
        return;
    }

    const denuncias = await obtenerDenuncias();
    const index = denuncias.findIndex(d => d.id === id);

    if (index === -1) {
        mostrarToast("Caso no encontrado.", "error");
        return;
    }

    denuncias[index].mensajesAnonimos.push({
        emisor: "Comité",
        mensaje: mensaje,
        fecha: new Date().toLocaleString()
    });

    denuncias[index].historial.push({
        fecha: new Date().toLocaleString(),
        estado: denuncias[index].estado,
        comentario: "El comité envió un mensaje al denunciante."
    });

    if (supabaseClient) await supabaseClient.from('denuncias').update({ mensajesAnonimos: denuncias[index].mensajesAnonimos, historial: denuncias[index].historial }).eq('id', id);
    mostrarToast("Mensaje enviado correctamente.", "success");
    await verDetalleAdmin(id);
}

function obtenerBadgeEstado(estado) {
    switch (estado) {
        case "Recibido":
            return `<span class="badge bg-primary px-3 py-2 rounded-pill"><i class="bi bi-inbox me-1"></i>${estado}</span>`;
        case "En revisión":
            return `<span class="badge bg-warning text-dark px-3 py-2 rounded-pill"><i class="bi bi-search me-1"></i>${estado}</span>`;
        case "Con resolución":
            return `<span class="badge bg-info text-dark px-3 py-2 rounded-pill"><i class="bi bi-bookmark-check me-1"></i>${estado}</span>`;
        case "Cerrado":
            return `<span class="badge bg-success px-3 py-2 rounded-pill"><i class="bi bi-check-circle-fill me-1"></i>${estado}</span>`;
        default:
            return `<span class="badge bg-secondary px-3 py-2 rounded-pill">${estado}</span>`;
    }
}

// Lógica de Gráficos y Exportación
let chartTipoInstance = null;
let chartAreaInstance = null;
let chartUrgenciaInstance = null;

function renderizarGraficos(denuncias) {
    if (!document.getElementById("chartTipo")) return;

    if (chartTipoInstance) chartTipoInstance.destroy();
    if (chartAreaInstance) chartAreaInstance.destroy();
    if (chartUrgenciaInstance) chartUrgenciaInstance.destroy();

    const countBy = (arr, key) => arr.reduce((acc, obj) => {
        const val = obj[key] || 'No especificado';
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});

    const tipoData = countBy(denuncias, "tipoDenuncia");
    const areaData = countBy(denuncias, "area");
    const urgenciaData = countBy(denuncias, "urgencia");

    const baseColors = ['#0d6efd', '#20c997', '#fd7e14', '#d63384', '#6610f2', '#6f42c1', '#dc3545', '#ffc107', '#198754', '#0dcaf0'];

    const createConfig = (dataObj, type = 'pie') => ({
        type: type,
        data: {
            labels: Object.keys(dataObj),
            datasets: [{
                data: Object.values(dataObj),
                backgroundColor: baseColors.slice(0, Object.keys(dataObj).length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    chartTipoInstance = new Chart(document.getElementById("chartTipo"), createConfig(tipoData, 'doughnut'));
    chartAreaInstance = new Chart(document.getElementById("chartArea"), createConfig(areaData, 'pie'));
    chartUrgenciaInstance = new Chart(document.getElementById("chartUrgencia"), createConfig(urgenciaData, 'doughnut'));
}

async function exportarExcel() {
    const denuncias = await obtenerDenuncias();
    if (denuncias.length === 0) {
        mostrarToast("No hay datos para exportar.", "warning");
        return;
    }

    if (typeof ExcelJS === 'undefined') {
        mostrarToast("Error: La librería ExcelJS no está cargada.", "error");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Denuncias');

    sheet.addTable({
        name: 'TablaDenuncias',
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: {
            theme: 'TableStyleMedium2',
            showRowStripes: true,
        },
        columns: [
            { name: 'Código', filterButton: true },
            { name: 'Tipo de Denuncia', filterButton: true },
            { name: 'Área / Departamento', filterButton: true },
            { name: 'Cargo Involucrado', filterButton: true },
            { name: 'Fecha del Hecho', filterButton: true },
            { name: 'Urgencia', filterButton: true },
            { name: 'Estado', filterButton: true },
            { name: 'Fecha de Registro', filterButton: true },
            { name: 'Descripción', filterButton: true },
            { name: 'Testigos', filterButton: true },
            { name: 'Contacto', filterButton: true }
        ],
        rows: denuncias.map(d => [
            d.codigo,
            d.tipoDenuncia,
            d.area,
            d.cargoInvolucrado,
            d.fechaHecho || 'No especificada',
            d.urgencia,
            d.estado,
            d.fechaRegistro,
            d.descripcion,
            d.testigos || 'No especificado',
            d.contacto || 'No proporcionado'
        ])
    });

    sheet.columns.forEach(column => {
        column.width = 22;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Reporte_Denuncias.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
}

function copiarCredenciales() {
    const codigo = document.getElementById("codigoGenerado").textContent;
    const pin = document.getElementById("pinGenerado").textContent;
    const texto = `Denuncia Registrada - VozSegura Laboral\nCódigo de seguimiento: ${codigo}\nPIN de acceso: ${pin}\n\nGuarde esta información en un lugar seguro para consultar el estado de su caso y comunicarse con el comité.`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast("Credenciales copiadas al portapapeles exitosamente.", "success");
        }).catch(err => {
            mostrarToast("No se pudo copiar al portapapeles. Por favor, anote los datos manualmente.", "error");
        });
    } else {
        mostrarToast("Su navegador no soporta el copiado automático. Por favor, seleccione el texto y cópielo manualmente.", "warning");
    }
}

function imprimirCredenciales() {
    const codigo = document.getElementById("codigoGenerado").textContent;
    const pin = document.getElementById("pinGenerado").textContent;

    const ventanaImpresion = window.open('', '_blank', 'height=600,width=800');

    if (!ventanaImpresion) {
        mostrarToast("Su navegador bloqueó la ventana emergente. Permita las ventanas emergentes para poder imprimir.", "warning");
        return;
    }

    ventanaImpresion.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Credenciales de Denuncia - VozSegura Laboral</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    padding: 40px; 
                    text-align: center;
                    color: #12355b;
                }
                .logo { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
                .subtitle { color: #6b7a8f; margin-bottom: 40px; font-size: 14px; }
                .box { 
                    border: 2px dashed #0d6efd; 
                    padding: 30px; 
                    border-radius: 12px; 
                    margin: 0 auto;
                    max-width: 500px;
                    background-color: #f8fcfd;
                }
                .code-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #6b7a8f; letter-spacing: 1px; margin-bottom: 5px; }
                .code { font-size: 32px; font-weight: bold; margin-bottom: 30px; color: #0d6efd; letter-spacing: 2px; }
                .pin { font-size: 36px; font-weight: bold; color: #dc3545; letter-spacing: 8px; }
                .warn { 
                    color: #dc3545; 
                    font-size: 13px; 
                    margin-top: 40px; 
                    padding: 15px;
                    background-color: #fff5f5;
                    border-radius: 8px;
                    border-left: 4px solid #dc3545;
                    text-align: left;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="logo">VozSegura Laboral</div>
            <div class="subtitle">Comprobante de Registro de Denuncia</div>
            
            <p style="margin-bottom: 30px; font-size: 16px;">Su denuncia ha sido registrada de forma segura y encriptada en nuestro sistema.</p>
            
            <div class="box">
                <div class="code-title">CÓDIGO DE SEGUIMIENTO</div>
                <div class="code">${codigo}</div>
                
                <div class="code-title">PIN DE ACCESO DE 4 DÍGITOS</div>
                <div class="pin">${pin}</div>
            </div>
            
            <div class="warn">
                <strong>⚠️ MUY IMPORTANTE:</strong> Conserve esta hoja en un lugar seguro y no la comparta con nadie. 
                El Código y el PIN son las <strong>únicas llaves</strong> que le permitirán acceder al seguimiento de su caso, 
                leer los mensajes del Comité Investigador y aportar más información de forma totalmente anónima.
            </div>
            
            <button class="no-print" onclick="window.print()" style="margin-top: 40px; padding: 12px 24px; font-size: 16px; background: #0d6efd; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Imprimir comprobante
            </button>
            
            <script>
                // Auto imprimir al cargar la ventana
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    ventanaImpresion.document.close();
}

function mostrarToast(mensaje, tipo = "success") {
    let toastEl = document.getElementById("liveToast");
    if (!toastEl) {
        const container = document.createElement("div");
        container.className = "toast-container position-fixed bottom-0 end-0 p-3";
        container.style.zIndex = "1055";
        container.innerHTML = `
            <div id="liveToast" class="toast align-items-center text-white border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body fw-bold" id="toastMessage"></div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        toastEl = document.getElementById("liveToast");
    }

    const toastMessage = document.getElementById("toastMessage");
    toastMessage.textContent = mensaje;

    toastEl.classList.remove("bg-primary", "bg-success", "bg-danger", "bg-warning", "text-white", "text-dark");
    if (tipo === "success") {
        toastEl.classList.add("bg-success", "text-white");
    } else if (tipo === "error") {
        toastEl.classList.add("bg-danger", "text-white");
    } else if (tipo === "warning") {
        toastEl.classList.add("bg-warning", "text-dark");
        toastEl.querySelector('.btn-close').classList.remove('btn-close-white');
    } else {
        toastEl.classList.add("bg-primary", "text-white");
    }

    if (tipo !== "warning") {
        toastEl.querySelector('.btn-close').classList.add('btn-close-white');
    }

    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
}