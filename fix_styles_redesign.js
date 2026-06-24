const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

const newCSS = `

/* DASHBOARD EXTERNO REDISEÑO */
.admin-dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.admin-dashboard-header h3 {
    font-size: 1.1rem;
    font-weight: 800;
    margin: 0;
    text-transform: uppercase;
    color: #12355b;
}
.admin-dashboard-header .breadcrumb {
    font-size: 0.85rem;
    color: #0d6efd;
    margin: 0;
}
.filters-row {
    background: white;
    border: 1px solid #e1ecf7;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
}
.filters-row .form-label {
    font-size: 0.75rem;
    color: #6c757d;
    margin-bottom: 2px;
}
.filters-row .form-select, .filters-row .form-control {
    border: none;
    border-bottom: 1px solid #dee2e6;
    border-radius: 0;
    padding-left: 0;
    font-size: 0.9rem;
    color: #495057;
}
.filters-row .form-select:focus, .filters-row .form-control:focus {
    box-shadow: none;
    border-bottom-color: #0d6efd;
}
.stats-banner {
    background-color: #e0f4fc;
    color: #0d6efd;
    text-align: center;
    padding: 10px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 15px;
}
.stat-card-new {
    background: white;
    border: 1px solid #e1ecf7;
    border-radius: 8px;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
}
.stat-card-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    border-right: 1px solid #eee;
}
.stat-card-new:last-child .stat-card-left {
    border-right: none;
}
.stat-card-left h2 {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0;
    line-height: 1;
}
.stat-card-left p {
    font-size: 0.85rem;
    color: #5b6b7f;
    margin: 5px 0 0 0;
    display: flex;
    align-items: center;
    gap: 5px;
}
.stat-card-right {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding-left: 15px;
    flex: 1;
}
.stat-pill {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
    display: inline-block;
    text-align: center;
}
.pill-red { background-color: #fce8e8; color: #dc3545; border: 1px solid #dc3545; }
.pill-blue { background-color: #e7f1ff; color: #0d6efd; border: 1px solid #0d6efd; }
.pill-yellow { background-color: #fff3cd; color: #ffc107; border: 1px solid #ffc107; }
.pill-green { background-color: #e8f5e9; color: #198754; border: 1px solid #198754; }
.pill-filled-red { background-color: #dc3545; color: white; }
.pill-filled-blue { background-color: #0d6efd; color: white; }
.pill-filled-yellow { background-color: #ffc107; color: black; }
.pill-filled-green { background-color: #198754; color: white; }

.table-new {
    background: white;
    font-size: 0.85rem;
}
.table-new th {
    color: #5b6b7f;
    font-weight: 600;
    border-bottom: 2px solid #e1ecf7;
    background-color: #f8fbff;
}
.table-new td {
    vertical-align: middle;
    color: #333;
}
.badge-table {
    padding: 3px 10px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.75rem;
}
.badge-tipo {
    background-color: #e7f1ff;
    color: #0d6efd;
    display: inline-block;
    margin-bottom: 3px;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 0.7rem;
}
.btn-eye {
    color: #0d6efd;
    border: 1px solid #0d6efd;
    background: transparent;
    padding: 3px 8px;
    border-radius: 4px;
}
.btn-eye:hover {
    background: #0d6efd;
    color: white;
}
`;

if (!css.includes('.admin-dashboard-header')) {
    css += newCSS;
    fs.writeFileSync('styles.css', css);
    console.log('Added styles for new dashboard design');
}
