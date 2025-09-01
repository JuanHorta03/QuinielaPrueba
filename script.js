// --- CONFIGURACIÓN ---
const QUINIELA_COST = 25;
const WHATSAPP_NUMBER = '+524775670219'; 
const QUINIELA_TITLE = "QUINIELA DEPORTIVA"; 
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqqiiilZFv8xsaKKecoZE9QpZs5Cxs9TvwCYFNcEl5SqQxBzeSgDLf5yaSrqbPuJPw/exec'; 

// Aquí tus partidos y logos (igual que tu código original)
const partidosData = [
    ["MONTREAL", "NEW YORK CITY"],
    ["INTER MIAMI", "ATLANTA UNITED"],
    ["NEW ENGLAND", "COLORADO"],
    ["ORLANDO CITY", "CINCINNATI"],
    ["TORONTO FC", "PORTLAND TIMBERS"],
    ["HOUSTON DYNAMO", "ST. LOUIS CITY"],
    ["SJ EARTHQUAKES", "LA GALAXY"],
    ["SEATTLE SOUNDERS", "AUSTIN FC"],
    ["COLUMBUS CREW", "PHILADELPHIA"],
    ["LAFC", "VANCOUVER WHITECAPS"]
];

// logos igual que tu código original...
const logos = { /* Tus URLs */ };

// --- ELEMENTOS DEL DOM ---
const container = document.getElementById("partidos-container");
const resumen = document.getElementById("resumen");
const nombreInput = document.getElementById("nombre");
const telefonoInput = document.getElementById("telefono"); // <-- NUEVO input
const totalQuinielasSpan = document.getElementById("totalQuinielasSpan");
const totalCostSpan = document.getElementById("totalCost");
const numQuinielasSpan = document.getElementById("numQuinielas");
const addedQuinielasList = document.querySelector("#addedQuinielasList ul");

let addedQuinielas = [];

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    if (!container) {
        console.error("No se encontró #partidos-container");
        return;
    }

    partidosData.forEach(([local, visitante], index) => {
        const div = document.createElement("div");
        div.className = "partido";
        div.setAttribute("data-index", index);
        div.innerHTML = `
            <div class="equipo">
                <img class="logo-equipo" src="${logos[local] || 'https://via.placeholder.com/40?text=Logo'}" alt="${local}" />
                <div class="nombre-equipo">${local}</div>
            </div>
            <div class="opciones">
                <button type="button" class="btn-opcion" data-valor="L">L</button>
                <button type="button" class="btn-opcion" data-valor="E">E</button>
                <button type="button" class="btn-opcion" data-valor="V">V</button>
            </div>
            <div class="equipo">
                <div class="nombre-equipo">${visitante}</div>
                <img class="logo-equipo" src="${logos[visitante] || 'https://via.placeholder.com/40?text=Logo'}" alt="${visitante}" />
            </div>
        `;
        container.appendChild(div);
    });

    updateResumen();
    updateOverallSummary();
});

// --- FUNCIONES ---
function getCurrentQuinielaSelection() {
    return Array.from(document.querySelectorAll(".partido")).map(p => {
        const seleccion = p.querySelector(".btn-opcion.seleccionado");
        return seleccion ? seleccion.dataset.valor : "_";
    });
}

function updateResumen() {
    if (resumen) {
        resumen.textContent = "Tu selección actual: " + getCurrentQuinielaSelection().join(" ");
    }
}

function updateOverallSummary() {
    if (totalQuinielasSpan) totalQuinielasSpan.textContent = addedQuinielas.length;
    if (numQuinielasSpan) numQuinielasSpan.textContent = addedQuinielas.length;
    if (totalCostSpan) totalCostSpan.textContent = `$${addedQuinielas.length * QUINIELA_COST}`;
    renderAddedQuinielas();
}

function clearSelections() {
    document.querySelectorAll(".btn-opcion").forEach(btn => btn.classList.remove("seleccionado"));
    updateResumen();
}

function renderAddedQuinielas() {
    if (!addedQuinielasList) return;
    addedQuinielasList.innerHTML = '';
    addedQuinielas.forEach((q, index) => {
        const li = document.createElement('li');
        li.textContent = `${q.name} (#${index+1}): ${q.selections.join(' ')}`;
        addedQuinielasList.appendChild(li);
    });
}

function generateWhatsAppMessage() {
    let message = `¡Hola! Aquí están mis quinielas:\n\n`;
    addedQuinielas.forEach(q => {
        message += `${q.name}: ${q.selections.join(' ')}\n`;
    });
    message += `\nTeléfono: ${telefonoInput.value || 'No proporcionado'}\n`; // <-- NUEVO
    message += `Total de quinielas: ${addedQuinielas.length}\n`;
    message += `Costo total: $${addedQuinielas.length * QUINIELA_COST}\n`;
    message += `¡Gracias!`;
    return message;
}

// --- EVENT LISTENERS ---
document.addEventListener("click", e => {
    if (e.target.classList.contains("btn-opcion")) {
        e.target.parentElement.querySelectorAll(".btn-opcion").forEach(btn => btn.classList.remove("seleccionado"));
        e.target.classList.add("seleccionado");
        updateResumen();
    }
});

document.getElementById("btnBorrar")?.addEventListener("click", clearSelections);

document.getElementById("btnAzar")?.addEventListener("click", () => {
    document.querySelectorAll(".partido").forEach(p => {
        const opciones = p.querySelectorAll(".btn-opcion");
        opciones.forEach(o => o.classList.remove("seleccionado"));
        opciones[Math.floor(Math.random() * 3)].classList.add("seleccionado");
    });
    updateResumen();
});

document.getElementById("btnAgregarQuiniela")?.addEventListener("click", () => {
    const nombre = nombreInput.value.trim();
    if (!nombre) return alert("Escribe tu nombre primero.");

    const seleccion = getCurrentQuinielaSelection();
    if (seleccion.includes("_")) return alert("Selecciona todos los partidos.");

    addedQuinielas.push({ name: nombre, selections: seleccion });
    clearSelections();
    updateOverallSummary();
});

document.getElementById("quinielaForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    if (addedQuinielas.length === 0) return alert("Agrega al menos una quiniela.");

    const rawMessage = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(rawMessage);
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappURL, "_blank");

    try {
        for (const q of addedQuinielas) {
            await fetch(GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: q.name,
                    telefono: telefonoInput.value || "", // <-- NUEVO
                    predicciones: q.selections,
                    costo: QUINIELA_COST
                })
            });
        }
        alert('¡Quinielas guardadas con éxito!');
    } catch(err) {
        console.error(err);
        alert('Error al guardar en Google Sheets.');
    } finally {
        addedQuinielas = [];
        clearSelections();
        nombreInput.value = '';
        telefonoInput.value = ''; // <-- NUEVO
        updateOverallSummary();
    }
});
