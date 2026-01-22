// app.js

// Definición de estructuras de artículos extraídas de Conexxión
const articleSchemas = {
    original: {
        title: "Investigación Científica Original",
        fields: [
            { id: "title_esp", label: "Título del Artículo (Español)", type: "text" },
            { id: "abstract_esp", label: "Resumen (150-250 palabras)", type: "textarea" },
            { id: "keywords", label: "Palabras Clave", type: "text" },
            { id: "intro", label: "Introducción", type: "textarea" },
            { id: "method", label: "Metodología", type: "textarea" },
            { id: "results", label: "Resultados", type: "textarea" },
            { id: "discussion", label: "Discusión y Conclusiones", type: "textarea" },
            { id: "refs", label: "Referencias (Formato APA)", type: "textarea" }
        ]
    },
    revision: {
        title: "Artículo de Revisión",
        fields: [
            { id: "title_esp", label: "Título de la Revisión", type: "text" },
            { id: "abstract_esp", label: "Resumen", type: "textarea" },
            { id: "intro", label: "Introducción", type: "textarea" },
            { id: "development", label: "Desarrollo del Tema (Análisis Crítico)", type: "textarea" },
            { id: "conclusions", label: "Conclusiones", type: "textarea" },
            { id: "refs", label: "Referencias (Mínimo 50 sugeridas)", type: "textarea" }
        ]
    },
    ensayo: {
        title: "Ensayo / Reflexión",
        fields: [
            { id: "title_esp", label: "Título del Ensayo", type: "text" },
            { id: "intro", label: "Introducción / Postura", type: "textarea" },
            { id: "body", label: "Desarrollo de Argumentos", type: "textarea" },
            { id: "conclusions", label: "Reflexiones Finales", type: "textarea" },
            { id: "refs", label: "Referencias", type: "textarea" }
        ]
    }
};

const app = {
    // Cambiar a la pantalla del formulario
    loadForm: function(type) {
        const schema = articleSchemas[type];
        const formContainer = document.getElementById('article-form');
        
        // Limpiar formulario anterior
        formContainer.innerHTML = `<h2>${schema.title}</h2>`;
        
        // Agregar campos de autoría (comunes a todos)
        this.addCommonFields(formContainer);

        // Generar campos específicos del esquema
        schema.fields.forEach(field => {
            const div = document.createElement('div');
            div.className = 'form-group';
            
            const label = document.createElement('label');
            label.innerText = field.label;
            
            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
            } else {
                input = document.createElement('input');
                input.type = field.type;
            }
            
            input.id = field.id;
            input.name = field.id;
            input.required = true;

            div.appendChild(label);
            div.appendChild(input);
            formContainer.appendChild(div);
        });

        // Botón de guardar
        formContainer.innerHTML += `<button type="submit" class="btn-primary">Guardar Borrador</button>`;

        // Navegación SPA
        document.getElementById('selector-screen').classList.add('hidden');
        document.getElementById('form-screen').classList.remove('hidden');
    },

    addCommonFields: function(container) {
        const commonHtml = `
            <div class="form-group">
                <label>Nombre del Autor Principal</label>
                <input type="text" id="author" placeholder="Ej. Juan Pérez" required>
            </div>
            <div class="form-group">
                <label>Campus</label>
                <input type="text" value="UNEA Saltillo" readonly>
            </div>
            <hr style="margin: 2rem 0; border: 0.5px solid #eee;">
        `;
        container.innerHTML += commonHtml;
    },

    showHome: function() {
        document.getElementById('form-screen').classList.add('hidden');
        document.getElementById('selector-screen').classList.remove('hidden');
    }
};

// Event Listeners iniciales podrían ir aquí

// app.js (Continuación)

const app = {
    // ... (funciones anteriores loadForm, addCommonFields, etc.)

    // EXPORTAR A WORD
    exportToWord: function() {
        const form = document.getElementById('article-form');
        const formData = new FormData(form);
        let content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Export</title></head>
            <body style="font-family: Arial, sans-serif;">
                <h1 style="text-align:center; color:#003366;">${document.querySelector('#form-screen h2').innerText}</h1>
        `;

        // Recorrer los datos del formulario y agregarlos al HTML
        for (let [key, value] of formData.entries()) {
            const label = document.querySelector(`label[for="${key}"]`)?.innerText || key;
            content += `<p><strong>${label}:</strong></p><p>${value}</p><br>`;
        }

        content += `</body></html>`;

        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Articulo_Conexxion_Borrador.doc';
        link.click();
    },

    // EXPORTAR A PDF (Usa la función de impresión del sistema)
    exportToPDF: function() {
        window.print();
    }
};

// Modificar el botón del formulario en loadForm para incluir estas opciones:
// formContainer.innerHTML += `
//    <div class="actions">
//        <button type="button" class="btn-primary" onclick="app.exportToWord()">Exportar Word</button>
//        <button type="button" class="btn-primary" style="background:#003366;" onclick="app.exportToPDF()">Exportar PDF</button>
//    </div>
// `;


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado'))
      .catch(err => console.log('Error al registrar SW', err));
  });
}

// app.js (Ampliación del objeto app)

const app = {
    // ... (Mantener las funciones previas: loadForm, exportToWord, etc.)

    // 1. Iniciar el monitoreo de cambios en el formulario
    initAutoSave: function(type) {
        const form = document.getElementById('article-form');
        
        // Escuchar cada vez que el usuario escribe algo
        form.addEventListener('input', () => {
            const formData = new FormData(form);
            const data = {};
            
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Guardamos en LocalStorage usando el tipo de artículo como llave
            localStorage.setItem(`draft_${type}`, JSON.stringify(data));
            console.log("Progreso guardado automáticamente...");
        });
    },

    // 2. Cargar datos guardados si existen
    loadFromLocalStorage: function(type) {
        const savedData = localStorage.getItem(`draft_${type}`);
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Recorrer el objeto y llenar los campos correspondientes
            Object.keys(data).forEach(key => {
                const field = document.getElementById(key);
                if (field) {
                    field.value = data[key];
                }
            });
            console.log("Borrador recuperado con éxito.");
        }
    },

    // 3. Limpiar el borrador (útil después de una exportación exitosa)
    clearDraft: function(type) {
        if(confirm("¿Estás seguro de que deseas borrar este borrador?")) {
            localStorage.removeItem(`draft_${type}`);
            location.reload(); // Recarga para limpiar la vista
        }
    }
};
