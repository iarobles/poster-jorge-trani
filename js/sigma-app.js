import Sigma from "https://esm.sh/sigma@3.0.0";
import Graph from "https://esm.sh/graphology@0.25.4";

// ------------------------------------------------
// CONFIGURACIÓN
// ------------------------------------------------
const DATA_FILE = "datos/red-completa.json";
const container = document.getElementById("sigma-canvas");

// ------------------------------------------------
// REFERENCIAS UI
// ------------------------------------------------
const ui = {
    panel: document.getElementById("attributepane"),
    name: document.querySelector(".name"),
    data: document.querySelector(".data"),
    list: document.querySelector(".link ul"),
    closeBtn: document.querySelector(".close-header")
};

// ------------------------------------------------
// ESTADO INTERACCIÓN
// ------------------------------------------------
let longPressTimer = null;
let longPressTriggered = false;
let pressedNode = null;

const LONG_PRESS_DELAY = 500; // ms

// ------------------------------------------------
// 1. CARGA DEL GRAFO
// ------------------------------------------------
async function run() {
    try {
        const response = await fetch(DATA_FILE);
        if (!response.ok) throw new Error("No se pudo leer el JSON");

        const data = await response.json();
        const graph = new Graph();
        graph.import(data);

        // Ajustes post-Gephi
        graph.forEachNode((node, attrs) => {
            graph.setNodeAttribute(
                node,
                "size",
                attrs.size ? attrs.size * 0.5 : 3
            );
            if (!attrs.color) {
                graph.setNodeAttribute(node, "color", "#999");
            }
        });

        initSigma(graph);

        const loader = document.getElementById("graph-loader");
        if (loader) loader.style.display = "none";

    } catch (err) {
        console.error(err);
        container.innerHTML = `<h3 style="color:red">Error: ${err.message}</h3>`;
    }
}

// ------------------------------------------------
// 2. SIGMA
// ------------------------------------------------
function initSigma(graph) {
    const renderer = new Sigma(graph, container, {
        renderEdgeLabels: false,
        minCameraRatio: 0.1,
        maxCameraRatio: 5,
        hideLabelsOnMove: true,

        // Reducers neutros
        nodeReducer: (node, data) => data,
        edgeReducer: (edge, data) => data
    });

    setupInteractions(renderer, graph);
}

// ------------------------------------------------
// 3. PANEL
// ------------------------------------------------
function openPanel(graph, node) {
    const attrs = graph.getNodeAttributes(node);
    const neighbors = graph.neighbors(node);

    ui.panel.style.display = "block";
    ui.name.textContent = attrs.label || "Sin nombre";
    ui.data.textContent =
        `Grado: ${graph.degree(node)} · Vecinos: ${neighbors.length}`;

    const maxList = 100;
    ui.list.innerHTML =
        neighbors.slice(0, maxList)
            .map(n => `<li>${graph.getNodeAttribute(n, "label") || n}</li>`)
            .join("") +
        (neighbors.length > maxList
            ? `<li>... ${neighbors.length - maxList} más</li>`
            : "");
}

// ------------------------------------------------
// 4. INTERACCIONES
// ------------------------------------------------
function setupInteractions(renderer, graph) {

    // Hover pasivo
    renderer.on("enterNode", () => {
        container.style.cursor = "pointer";
    });

    renderer.on("leaveNode", () => {
        container.style.cursor = "default";
    });

    // -----------------------------
    // DESKTOP → DOBLE CLICK
    // -----------------------------
    renderer.on("doubleClickNode", ({ node }) => {
        openPanel(graph, node);
    });

    // -----------------------------
    // MÓVIL → LONG PRESS
    // -----------------------------
    renderer.on("downNode", ({ node }) => {
        pressedNode = node;
        longPressTriggered = false;

        longPressTimer = setTimeout(() => {
            longPressTriggered = true;
            openPanel(graph, node);
        }, LONG_PRESS_DELAY);
    });

    renderer.on("upNode", () => {
        clearTimeout(longPressTimer);
        pressedNode = null;
    });

    renderer.on("leaveNode", () => {
        clearTimeout(longPressTimer);
    });

    // Si el usuario empieza a mover la cámara, cancelamos long-press
    renderer.getCamera().on("updated", () => {
        if (pressedNode) {
            clearTimeout(longPressTimer);
        }
    });

    // -----------------------------
    // CERRAR PANEL
    // -----------------------------
    renderer.on("clickStage", () => {
        ui.panel.style.display = "none";
    });

    ui.closeBtn.addEventListener("click", () => {
        ui.panel.style.display = "none";
    });
}

// ------------------------------------------------
run();
