/* ============================================
   AulaSocial - Clean Sprint Web App
   JavaScript Vanilla
   ============================================ */

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
const AppState = {
    currentProjectId: null,
    projects: [],
    images: {
        1: [],
        2: [],
        3: [],
        4: [],
        5: []
    }
};

// ============================================
// CONSTANTES
// ============================================
const STORAGE_KEY = 'aulasocial_projects';
const STORAGE_IMAGES = 'aulasocial_images';

const FIELD_IDS_INFO = [
    'nombreProyecto', 'nombreEquipo', 'nombreFacilitador',
    'fechaInicio', 'estadoProyecto', 'descripcionGeneral'
];

const FIELD_IDS_STAGE = {
    1: ['e1_problema', 'e1_beneficiarios', 'e1_contexto', 'e1_causas', 'e1_entrevistas', 'e1_howMightWe'],
    2: ['e2_lluviaIdeas', 'e2_ideasCrazy8', 'e2_metodosCreativos', 'e2_observaciones'],
    3: ['e3_criterios', 'e3_ideaSeleccionada', 'e3_votacion', 'e3_valorPropuesta', 'e3_recursos', 'e3_riesgos'],
    4: ['e4_descripcionProto', 'e4_tipoProto', 'e4_materiales', 'e4_experienciaUsuario', 'e4_hipotesis', 'e4_metricas'],
    5: ['e5_planPrueba', 'e5_participantes', 'e5_resultados', 'e5_feedback', 'e5_aprendizajes', 'e5_siguientesPasos']
};

const STAGE_NAMES = {
    1: 'Entender',
    2: 'Divergir',
    3: 'Converger',
    4: 'Prototipar',
    5: 'Evaluar'
};

// ============================================
// UTILIDADES
// ============================================
function generateId() {
    return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateStr) {
    if (!dateStr) return 'Sin fecha';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function getProjectStatusText(status) {
    const map = {
        'planificacion': 'En Planificación',
        'ejecucion': 'En Ejecución',
        'completado': 'Completado',
        'pausado': 'Pausado'
    };
    return map[status] || 'Sin definir';
}

// ============================================
// ALMACENAMIENTO LOCAL
// ============================================
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState.projects));
    } catch (e) {
        showToast('Error: Almacenamiento lleno. Intente eliminar proyectos antiguos.', 'error');
    }
}

function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        AppState.projects = data ? JSON.parse(data) : [];
    } catch (e) {
        AppState.projects = [];
    }
}

// ============================================
// GESTIÓN DE CAMPOS
// ============================================
function getProjectData() {
    const data = {
        info: {},
        stages: {}
    };

    // Info general
    FIELD_IDS_INFO.forEach(id => {
        const el = document.getElementById(id);
        if (el) data.info[id] = el.value;
    });

    // Etapas
    for (let s = 1; s <= 5; s++) {
        data.stages[s] = {};
        FIELD_IDS_STAGE[s].forEach(id => {
            const el = document.getElementById(id);
            if (el) data.stages[s][id] = el.value;
        });
        data.stages[s].images = AppState.images[s] || [];
    }

    return data;
}

function setProjectData(data) {
    if (!data) return;

    // Info general
    if (data.info) {
        FIELD_IDS_INFO.forEach(id => {
            const el = document.getElementById(id);
            if (el && data.info[id] !== undefined) el.value = data.info[id];
        });
    }

    // Etapas
    if (data.stages) {
        for (let s = 1; s <= 5; s++) {
            if (data.stages[s]) {
                FIELD_IDS_STAGE[s].forEach(id => {
                    const el = document.getElementById(id);
                    if (el && data.stages[s][id] !== undefined) el.value = data.stages[s][id];
                });
                if (data.stages[s].images) {
                    AppState.images[s] = data.stages[s].images;
                }
            }
        }
    }

    renderAllImagePreviews();
    updateProgressBar();
}

function clearAllFields() {
    FIELD_IDS_INFO.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    for (let s = 1; s <= 5; s++) {
        FIELD_IDS_STAGE[s].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        AppState.images[s] = [];
        const container = document.getElementById(`imgPreview${s}`);
        if (container) container.innerHTML = '';
    }

    AppState.currentProjectId = null;
    updateProgressBar();
    updateStatusBadge('Sin guardar');
}

function updateStatusBadge(text) {
    document.getElementById('statusBadge').textContent = text;
}

// ============================================
// PROGRESO
// ============================================
function updateProgressBar() {
    let totalFields = 0;
    let filledFields = 0;

    // Contar campos de info
    FIELD_IDS_INFO.forEach(id => {
        totalFields++;
        const el = document.getElementById(id);
        if (el && el.value.trim()) filledFields++;
    });

    // Contar campos de etapas
    for (let s = 1; s <= 5; s++) {
        FIELD_IDS_STAGE[s].forEach(id => {
            totalFields++;
            const el = document.getElementById(id);
            if (el && el.value.trim()) filledFields++;
        });
        if (AppState.images[s] && AppState.images[s].length > 0) {
            totalFields++;
            filledFields++;
        }
    }

    const percent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('progressPercent').textContent = percent + '%';
}

// ============================================
// GESTIÓN DE IMÁGENES
// ============================================
function handleImageUpload(stageNum, files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('La imagen es muy grande. Máximo 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            AppState.images[stageNum].push(e.target.result);
            renderImagePreview(stageNum);
        };
        reader.readAsDataURL(file);
    });
}

function renderImagePreview(stageNum) {
    const container = document.getElementById(`imgPreview${stageNum}`);
    if (!container) return;
    container.innerHTML = '';

    AppState.images[stageNum].forEach((imgSrc, index) => {
        const div = document.createElement('div');
        div.className = 'img-preview';
        div.innerHTML = `
            <img src="${imgSrc}" alt="Imagen etapa ${stageNum}">
            <button class="remove-img" data-stage="${stageNum}" data-index="${index}" title="Eliminar imagen">&times;</button>
        `;
        container.appendChild(div);
    });

    // Event listeners para botones de eliminar
    container.querySelectorAll('.remove-img').forEach(btn => {
        btn.addEventListener('click', function() {
            const s = parseInt(this.dataset.stage);
            const i = parseInt(this.dataset.index);
            AppState.images[s].splice(i, 1);
            renderImagePreview(s);
            updateProgressBar();
        });
    });
}

function renderAllImagePreviews() {
    for (let s = 1; s <= 5; s++) {
        renderImagePreview(s);
    }
}

// ============================================
// ACCIONES DE BOTONES
// ============================================

// --- NUEVO ---
function actionNuevo() {
    if (hasData()) {
        if (!confirm('¿Está seguro? Se perderán los cambios no guardados del proyecto actual.')) return;
    }
    clearAllFields();
    showToast('Nuevo proyecto creado. ¡Empieza a trabajar!', 'info');
}

function hasData() {
    for (let s = 1; s <= 5; s++) {
        for (const id of FIELD_IDS_STAGE[s]) {
            const el = document.getElementById(id);
            if (el && el.value.trim()) return true;
        }
    }
    for (const id of FIELD_IDS_INFO) {
        const el = document.getElementById(id);
        if (el && el.value.trim()) return true;
    }
    return Object.values(AppState.images).some(arr => arr.length > 0);
}

// --- GUARDAR AVANCE ---
function actionGuardar() {
    const data = getProjectData();
    const nombre = data.info.nombreProyecto.trim() || 'Proyecto sin nombre';

    if (AppState.currentProjectId) {
        // Actualizar proyecto existente
        const idx = AppState.projects.findIndex(p => p.id === AppState.currentProjectId);
        if (idx !== -1) {
            AppState.projects[idx].data = data;
            AppState.projects[idx].nombre = nombre;
            AppState.projects[idx].estado = data.info.estadoProyecto || 'planificacion';
            AppState.projects[idx].updated = new Date().toISOString();
        }
    } else {
        // Crear nuevo proyecto
        const project = {
            id: generateId(),
            nombre: nombre,
            estado: data.info.estadoProyecto || 'planificacion',
            equipo: data.info.nombreEquipo || '',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            data: data
        };
        AppState.projects.unshift(project);
        AppState.currentProjectId = project.id;
    }

    saveToStorage();
    updateStatusBadge('Guardado ✓');
    showToast('Avance guardado correctamente.', 'success');
}

// --- CARGAR (modal de selección) ---
function actionCargar() {
    if (AppState.projects.length === 0) {
        showToast('No hay proyectos guardados aún.', 'info');
        return;
    }

    const body = document.getElementById('modalCargarBody');
    body.innerHTML = '';

    AppState.projects.forEach(proj => {
        const div = document.createElement('div');
        div.className = 'load-option';
        div.innerHTML = `
            <input type="radio" name="loadProject" value="${proj.id}">
            <div class="load-option-info">
                <h4>${proj.nombre || 'Sin nombre'}</h4>
                <p>Equipo: ${proj.equipo || '—'} | Actualizado: ${formatDate(proj.updated)}</p>
                <span class="status-badge status-${proj.estado}">${getProjectStatusText(proj.estado)}</span>
            </div>
        `;
        div.addEventListener('click', function() {
            document.querySelectorAll('.load-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
        });
        body.appendChild(div);
    });

    // Botones de acción
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.innerHTML = `
        <button class="btn btn-secondary" id="cancelCargar">Cancelar</button>
        <button class="btn btn-primary" id="confirmCargar">Cargar seleccionado</button>
    `;
    body.appendChild(actions);

    document.getElementById('cancelCargar').addEventListener('click', () => closeModal('modalCargar'));
    document.getElementById('confirmCargar').addEventListener('click', () => {
        const selected = document.querySelector('input[name="loadProject"]:checked');
        if (!selected) {
            showToast('Seleccione un proyecto.', 'error');
            return;
        }
        loadProject(selected.value);
        closeModal('modalCargar');
    });

    openModal('modalCargar');
}

function loadProject(id) {
    const proj = AppState.projects.find(p => p.id === id);
    if (!proj) {
        showToast('Proyecto no encontrado.', 'error');
        return;
    }

    clearAllFields();
    AppState.currentProjectId = proj.id;
    setProjectData(proj.data);
    updateStatusBadge(`Cargado: ${proj.nombre}`);
    showToast(`Proyecto "${proj.nombre}" cargado.`, 'success');
}

// --- LISTA (modal completo) ---
function actionLista() {
    const body = document.getElementById('modalListaBody');
    body.innerHTML = '';

    if (AppState.projects.length === 0) {
        body.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="#90CAF9" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <h3>No hay proyectos guardados</h3>
                <p>Crea un nuevo proyecto y guarda tu avance para verlo aquí.</p>
            </div>
        `;
        openModal('modalLista');
        return;
    }

    AppState.projects.forEach(proj => {
        const data = proj.data || {};
        const info = data.info || {};
        const stages = data.stages || {};

        // Calcular completado por etapa
        let stagesInfo = '';
        for (let s = 1; s <= 5; s++) {
            if (stages[s]) {
                let filled = 0;
                let total = FIELD_IDS_STAGE[s].length;
                FIELD_IDS_STAGE[s].forEach(id => {
                    if (stages[s][id] && stages[s][id].trim()) filled++;
                });
                const pct = Math.round((filled / total) * 100);
                stagesInfo += `<div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.25rem;">
                    <span>Etapa ${s} - ${STAGE_NAMES[s]}</span>
                    <span style="font-weight:600;color:${pct >= 50 ? 'var(--success)' : 'var(--warning)'};">${pct}%</span>
                </div>`;
            }
        }

        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-card-header">
                <div>
                    <h3>${proj.nombre || 'Proyecto sin nombre'}</h3>
                    <div class="project-card-meta">
                        Equipo: ${proj.equipo || '—'} | Creado: ${formatDate(proj.created)} | Actualizado: ${formatDate(proj.updated)}
                    </div>
                </div>
                <span class="status-badge status-${proj.estado}">${getProjectStatusText(proj.estado)}</span>
            </div>
            <div style="margin-bottom:0.5rem;">${stagesInfo}</div>
            <div class="project-card-actions">
                <button class="btn btn-primary" onclick="loadProject('${proj.id}'); closeModal('modalLista');">
                    📂 Editar
                </button>
                <button class="btn btn-danger" onclick="deleteProject('${proj.id}');">
                    🗑️ Eliminar
                </button>
            </div>
        `;
        body.appendChild(card);
    });

    openModal('modalLista');
}

function deleteProject(id) {
    if (!confirm('¿Está seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) return;

    AppState.projects = AppState.projects.filter(p => p.id !== id);
    saveToStorage();

    if (AppState.currentProjectId === id) {
        AppState.currentProjectId = null;
        clearAllFields();
        updateStatusBadge('Sin guardar');
    }

    showToast('Proyecto eliminado.', 'info');
    actionLista(); // Refrescar la lista
}

// --- EXPORTAR PDF ---
function actionExportPDF() {
    const data = getProjectData();
    const nombre = data.info.nombreProyecto.trim() || 'Proyecto sin nombre';

    const html = generateExportHTML(data, nombre);

    const element = document.createElement('div');
    element.innerHTML = html;
    element.style.padding = '0';

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `AulaSocial_${nombre.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    showToast('Generando PDF...', 'info');

    html2pdf().set(opt).from(element).save().then(() => {
        showToast('PDF exportado correctamente.', 'success');
    }).catch(err => {
        showToast('Error al generar PDF: ' + err.message, 'error');
    });
}

// --- EXPORTAR WORD ---
function actionExportWord() {
    const data = getProjectData();
    const nombre = data.info.nombreProyecto.trim() || 'Proyecto sin nombre';

    const html = generateExportHTML(data, nombre);

    const converted = htmlDocx.asBlob(html, {
        orientation: 'portrait',
        margins: { top: 720, bottom: 720, left: 720, right: 720 }
    });

    saveAs(converted, `AulaSocial_${nombre.replace(/\s+/g, '_')}.docx`);
    showToast('Documento Word exportado correctamente.', 'success');
}

// ============================================
// GENERAR HTML PARA EXPORTACIÓN
// ============================================
function generateExportHTML(data, nombre) {
    const info = data.info || {};
    const stages = data.stages || {};

    let stagesHTML = '';
    for (let s = 1; s <= 5; s++) {
        const stage = stages[s] || {};
        let fieldsHTML = '';

        FIELD_IDS_STAGE[s].forEach(id => {
            const val = stage[id] || '';
            if (val.trim()) {
                // Convertir nombre del campo a texto legible
                const label = getFieldLabel(id);
                fieldsHTML += `
                    <div style="margin-bottom:12px;">
                        <h4 style="color:#1565C0;margin:0 0 4px 0;font-size:13px;">${label}</h4>
                        <p style="margin:0;font-size:12px;line-height:1.5;white-space:pre-wrap;">${escapeHTML(val)}</p>
                    </div>
                `;
            }
        });

        // Imágenes
        let imagesHTML = '';
        if (stage.images && stage.images.length > 0) {
            imagesHTML = '<h4 style="color:#1565C0;margin:8px 0 4px 0;font-size:13px;">Imágenes</h4><div style="display:flex;flex-wrap:wrap;gap:8px;">';
            stage.images.forEach(img => {
                imagesHTML += `<img src="${img}" style="max-width:200px;max-height:150px;border-radius:6px;border:1px solid #BBDEFB;">`;
            });
            imagesHTML += '</div>';
        }

        stagesHTML += `
            <div style="page-break-inside:avoid;margin-bottom:20px;border:1px solid #E3F2FD;border-radius:8px;padding:16px;">
                <h3 style="color:white;background:#1565C0;padding:8px 12px;margin:-16px -16px 12px -16px;border-radius:8px 8px 0 0;font-size:15px;">
                    Etapa ${s}: ${STAGE_NAMES[s]}
                </h3>
                ${fieldsHTML}
                ${imagesHTML}
            </div>
        `;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #37474F; line-height: 1.5; padding: 20px; }
                h1 { color: #1565C0; font-size: 22px; margin-bottom: 4px; }
                h2 { color: #1565C0; font-size: 16px; border-bottom: 2px solid #1565C0; padding-bottom: 4px; margin-top: 20px; }
                .meta { font-size: 11px; color: #607D8B; margin-bottom: 16px; }
                .header-banner { background: linear-gradient(135deg, #0D47A1, #1565C0, #1E88E5); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .header-banner h1 { color: white; font-size: 24px; }
                .header-banner p { color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 13px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
                .info-item { background: #F0F7FF; padding: 10px; border-radius: 6px; }
                .info-item label { font-weight: 700; font-size: 11px; color: #1565C0; display: block; margin-bottom: 2px; }
                .info-item p { margin: 0; font-size: 12px; }
                .footer { text-align: center; font-size: 10px; color: #90CAF9; margin-top: 20px; border-top: 1px solid #E3F2FD; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header-banner">
                <h1>🌐 AulaSocial — Clean Sprint</h1>
                <p>Metodología para Proyectos de Impacto Social</p>
            </div>

            <h1>${escapeHTML(nombre)}</h1>
            <div class="meta">
                Equipo: ${escapeHTML(info.nombreEquipo || '—')} |
                Facilitador: ${escapeHTML(info.nombreFacilitador || '—')} |
                Fecha: ${escapeHTML(info.fechaInicio || '—')} |
                Estado: ${escapeHTML(getProjectStatusText(info.estadoProyecto || ''))}
            </div>

            <h2>Descripción General</h2>
            <p style="white-space:pre-wrap;font-size:12px;">${escapeHTML(info.descripcionGeneral || 'Sin descripción.')}</p>

            ${stagesHTML}

            <div class="footer">
                Generado con AulaSocial — Clean Sprint para Impacto Social — ${new Date().toLocaleDateString('es-ES')}
            </div>
        </body>
        </html>
    `;
}

function getFieldLabel(fieldId) {
    const labels = {
        'e1_problema': 'Problema a resolver',
        'e1_beneficiarios': 'Beneficiarios afectados',
        'e1_contexto': 'Contexto del problema',
        'e1_causas': 'Causas raíz',
        'e1_entrevistas': 'Entrevistas / Investigación',
        'e1_howMightWe': 'Pregunta "¿Cómo podríamos...?"',
        'e2_lluviaIdeas': 'Lluvia de ideas',
        'e2_ideasCrazy8': "Crazy 8's",
        'e2_metodosCreativos': 'Métodos creativos utilizados',
        'e2_observaciones': 'Observaciones',
        'e3_criterios': 'Criterios de selección',
        'e3_ideaSeleccionada': 'Idea seleccionada',
        'e3_votacion': 'Proceso de votación',
        'e3_valorPropuesta': 'Propuesta de valor',
        'e3_recursos': 'Recursos necesarios',
        'e3_riesgos': 'Riesgos y mitigación',
        'e4_descripcionProto': 'Descripción del prototipo',
        'e4_tipoProto': 'Tipo de prototipo',
        'e4_materiales': 'Materiales y herramientas',
        'e4_experienciaUsuario': 'Experiencia de usuario (User Journey)',
        'e4_hipotesis': 'Hipótesis a validar',
        'e4_metricas': 'Métricas de éxito',
        'e5_planPrueba': 'Plan de prueba',
        'e5_participantes': 'Participantes de la prueba',
        'e5_resultados': 'Resultados obtenidos',
        'e5_feedback': 'Feedback de usuarios',
        'e5_aprendizajes': 'Aprendizajes clave',
        'e5_siguientesPasos': 'Siguientes pasos / Iteraciones'
    };
    return labels[fieldId] || fieldId;
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================
// MODALES
// ============================================
function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// COLLAPSE / EXPAND ETAPAS
// ============================================
function setupStageToggle() {
    document.querySelectorAll('.stage-header').forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const toggle = this.querySelector('.stage-toggle');

            content.classList.toggle('collapsed');
            toggle.style.transform = content.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
        });
    });
}

// ============================================
// DRAG & DROP IMÁGENES
// ============================================
function setupDragDrop() {
    for (let s = 1; s <= 5; s++) {
        const area = document.getElementById(`imgArea${s}`);
        if (!area) continue;

        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        area.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });

        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            handleImageUpload(s, e.dataTransfer.files);
        });
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Botones principales
    document.getElementById('btnNuevo').addEventListener('click', actionNuevo);
    document.getElementById('btnCargar').addEventListener('click', actionCargar);
    document.getElementById('btnLista').addEventListener('click', actionLista);
    document.getElementById('btnGuardar').addEventListener('click', actionGuardar);
    document.getElementById('btnPDF').addEventListener('click', actionExportPDF);
    document.getElementById('btnWord').addEventListener('click', actionExportWord);

    // Cerrar modales
    document.getElementById('closeCargar').addEventListener('click', () => closeModal('modalCargar'));
    document.getElementById('closeLista').addEventListener('click', () => closeModal('modalLista'));

    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Inputs de imágenes
    for (let s = 1; s <= 5; s++) {
        const input = document.getElementById(`imgInput${s}`);
        if (input) {
            input.addEventListener('change', function() {
                handleImageUpload(s, this.files);
                this.value = ''; // Reset para permitir subir la misma imagen
            });
        }
    }

    // Actualizar progreso en cada cambio
    document.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('input', updateProgressBar);
        el.addEventListener('change', updateProgressBar);
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================
function init() {
    loadFromStorage();
    setupEventListeners();
    setupStageToggle();
    setupDragDrop();
    updateProgressBar();
    updateStatusBadge('Sin guardar');
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
