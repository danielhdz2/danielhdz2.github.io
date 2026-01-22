const app = {
    currentType: null,
    saveTimeout: null,

    schemas: {
        original: {
            title: "Investigación Original",
            fields: [
                { id: "title", label: "Título (Español/Inglés)", type: "text" },
                { id: "authors", label: "Autores (Filiación y ORCID)", type: "text" },
                { id: "abstract", label: "Resumen / Abstract (150-250 palabras)", type: "textarea" },
                { id: "intro", label: "Introducción", type: "textarea" },
                { id: "method", label: "Metodología", type: "textarea" },
                { id: "results", label: "Resultados", type: "textarea" },
                { id: "discussion", label: "Discusión y Conclusiones", type: "textarea" },
                { id: "refs", label: "Referencias (APA)", type: "textarea" }
            ]
        },
        revision: {
            title: "Artículo de Revisión",
            fields: [
                { id: "title", label: "Título de la Revisión", type: "text" },
                { id: "abstract", label: "Resumen", type: "textarea" },
                { id: "intro", label: "Introducción", type: "textarea" },
                { id: "development", label: "Desarrollo y Análisis Crítico", type: "textarea" },
                { id: "conclusions", label: "Conclusiones", type: "textarea" },
                { id: "refs", label: "Referencias (Mínimo 50)", type: "textarea" }
            ]
        },
        ensayo: {
            title: "Ensayo / Reflexión",
            fields: [
                { id: "title", label: "Título del Ensayo", type: "text" },
                { id: "intro", label: "Introducción y Tesis", type: "textarea" },
                { id: "body", label: "Desarrollo Argumentativo", type: "textarea" },
                { id: "conclusions", label: "Conclusiones", type: "textarea" },
                { id: "refs", label: "Referencias", type: "textarea" }
            ]
        }
    },

    loadForm: function(type) {
        this.currentType = type;
        const schema = this.schemas[type];
        const form = document.getElementById('article-form');
        
        form.innerHTML = `<h1>${schema.title}</h1>`;
        
        schema.fields.forEach(f => {
            const group = document.createElement('div');
            group.className = 'form-group';
            group.innerHTML = `
                <label for="${f.id}">${f.label}</label>
                ${f.type === 'textarea' ? `<textarea id="${f.id}" name="${f.id}"></textarea>` : `<input type="text" id="${f.id}" name="${f.id}">`}
            `;
            form.appendChild(group);
        });

        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('form-screen').classList.remove('hidden');
        
        this.loadData();
        this.initAutoSave();
    },

    showHome: function() {
        document.getElementById('form-screen').classList.add('hidden');
        document.getElementById('home-screen').classList.remove('hidden');
    },

    initAutoSave: function() {
        const form = document.getElementById('article-form');
        form.oninput = () => {
            document.getElementById('save-status').innerText = "Guardando...";
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                localStorage.setItem(`draft_${this.currentType}`, JSON.stringify(data));
                document.getElementById('save-status').innerText = "✓ Guardado localmente";
            }, 1000);
        };
    },

    loadData: function() {
        const saved = localStorage.getItem(`draft_${this.currentType}`);
        if (saved) {
            const data = JSON.parse(saved);
            Object.keys(data).forEach(key => {
                const el = document.getElementById(key);
                if (el) el.value = data[key];
            });
            document.getElementById('save-status').innerText = "✓ Borrador recuperado";
        }
    },

    clearDraft: function() {
        if(confirm("¿Eliminar todos los datos de este borrador?")) {
            localStorage.removeItem(`draft_${this.currentType}`);
            this.loadForm(this.currentType);
        }
    },

    exportToWord: function() {
        const schema = this.schemas[this.currentType];
        let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                    <head><meta charset='utf-8'></head><body style="font-family: Arial;">
                    <h1 style="color:#003366">${schema.title}</h1>`;
        
        const formData = new FormData(document.getElementById('article-form'));
        formData.forEach((value, key) => {
            const label = schema.fields.find(f => f.id === key)?.label || key;
            html += `<h3>${label}</h3><p>${value.replace(/\n/g, '<br>')}</p>`;
        });
        
        html += `</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Articulo_${this.currentType}.doc`;
        link.click();
    },

    exportToPDF: function() {
        window.print();
    }
};

// Registro de Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// Lógica de botón de instalación PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBtn').style.display = 'block';
});

document.getElementById('installBtn').onclick = () => {
    deferredPrompt.prompt();
    document.getElementById('installBtn').style.display = 'none';
};
