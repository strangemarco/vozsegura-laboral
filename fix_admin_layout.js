const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

// Replace the <main> tag to make it fluid
html = html.replace('<main class="container my-4">', '<main class="container-fluid px-5 my-4">');

const adminStart = '<div id="panelAdmin" class="admin-wrapper">';
const adminEnd = '</div>\\n\\n            </div>\\n        </section>';
const startIndex = html.indexOf(adminStart);
const endIndex = html.indexOf('</section>', startIndex);

if (startIndex > -1 && endIndex > -1) {
    const newAdminContent = `
<div id="panelAdmin">
    <div class="admin-dashboard-header">
        <div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-light border" onclick="window.location.href='index.html'">
                    <i class="bi bi-arrow-left"></i>
                </button>
                <h3>DASHBOARD DE ACCIONES Y DECISIONES <i class="bi bi-question-circle text-muted fs-6"></i></h3>
            </div>
            <p class="breadcrumb mt-1 ms-5">Inicio &gt; Dashboard</p>
        </div>
        <div>
            <button class="btn btn-outline-success bg-white fw-bold shadow-sm" onclick="exportarExcel()">
                <i class="bi bi-file-earmark-excel"></i> Exportar a Excel
            </button>
        </div>
    </div>

    <!-- FILTERS -->
    <div class="filters-row">
        <div class="row g-3">
            <div class="col-md-3">
                <label class="form-label">Urgencia</label>
                <select class="form-select" id="filtroUrgencia" onchange="cargarTablaAdmin(1)">
                    <option value="">Todas las urgencias</option>
                    <option>Bajo</option>
                    <option>Medio</option>
                    <option>Alto</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Estado de la acción</label>
                <select class="form-select" id="filtroEstado" onchange="cargarTablaAdmin(1)">
                    <option value="">Todos los estados</option>
                    <option>Recibido</option>
                    <option>En revisión</option>
                    <option>Cerrado</option>
                </select>
            </div>
            <div class="col-md-6">
                <label class="form-label">Buscar</label>
                <div class="input-group">
                    <span class="input-group-text bg-white border-0 border-bottom"><i class="bi bi-search text-primary"></i></span>
                    <input type="text" class="form-control" id="buscadorAdmin" placeholder="Buscar por código, detalle o área..." oninput="cargarTablaAdmin(1)">
                </div>
            </div>
        </div>
    </div>

    <div class="stats-banner shadow-sm">
        <i class="bi bi-graph-up"></i> Estadísticas de Todas las denuncias - Todas las áreas - Todos los estados (Inicio → Hoy)
    </div>

    <!-- STATS CARDS -->
    <div class="row g-3 mb-4">
        <div class="col-md-3">
            <div class="stat-card-new shadow-sm">
                <div class="stat-card-left" style="border-right: none;">
                    <h2 class="text-primary" id="totalCasos">0</h2>
                    <p><i class="bi bi-card-text"></i> Total de Denuncias</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card-new shadow-sm">
                <div class="stat-card-left">
                    <h2 class="text-success" id="casosCerrados">0</h2>
                    <p><i class="bi bi-check-circle-fill"></i> Atendidas</p>
                </div>
                <div class="stat-card-right">
                    <span class="stat-pill pill-filled-red">0 Urgencia Alta</span>
                    <span class="stat-pill pill-filled-blue">0 Urgencia Media</span>
                    <span class="stat-pill pill-filled-green">0 Urgencia Baja</span>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card-new shadow-sm">
                <div class="stat-card-left">
                    <h2 class="text-danger" id="casosUrgentes">0</h2>
                    <p><i class="bi bi-exclamation-triangle-fill"></i> Urgentes</p>
                </div>
                <div class="stat-card-right">
                    <span class="stat-pill pill-red">0 Recibido</span>
                    <span class="stat-pill pill-blue">0 En revisión</span>
                    <span class="stat-pill pill-green">0 Cerrado</span>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="stat-card-new shadow-sm">
                <div class="stat-card-left" style="border-right: none;">
                    <h2 class="text-warning" id="casosRevision">0</h2>
                    <p><i class="bi bi-search"></i> En Revisión</p>
                </div>
            </div>
        </div>
    </div>

    <!-- TABLE -->
    <div class="bg-white p-3 rounded-3 shadow-sm border" style="border-color: #e1ecf7 !important;">
        <div class="d-flex align-items-center mb-3">
            <i class="bi bi-table text-primary fs-5 me-2"></i>
            <h5 class="mb-0 text-secondary fw-bold">Últimas Acciones</h5>
        </div>
        
        <div class="table-responsive">
            <table class="table table-new table-striped table-hover mb-0">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Detalle de la Acción</th>
                        <th>Área / Reunión</th>
                        <th>Fecha de Registro</th>
                        <th>Urgencia</th>
                        <th>Estado acción</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaCasos"></tbody>
            </table>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
            <small class="text-muted" id="paginacionInfo">Mostrando 0 a 0 de 0 casos</small>
            <nav>
                <ul class="pagination pagination-sm mb-0" id="paginacionControles">
                </ul>
            </nav>
        </div>
    </div>
</div>
`;
    const before = html.substring(0, startIndex);
    const after = html.substring(endIndex);
    fs.writeFileSync('admin.html', before + newAdminContent + after);
    console.log('Replaced admin layout successfully.');
} else {
    console.log('Could not find boundaries.');
}
