
import Sigma from "https://esm.sh/sigma@3.0.0";
import Graph from "https://esm.sh/graphology@0.25.4";

// CONFIGURACIÓN
// ------------------------------------------------
// Pon aquí el nombre exacto de tu archivo exportado por Gephi
const DATA_FILE = "datos/red-completa.json";
const container = document.getElementById("sigma-canvas");

// REFERENCIAS UI
const ui = {
    panel: document.getElementById("attributepane"),
    name: document.querySelector(".name"),
    data: document.querySelector(".data"),
    list: document.querySelector(".link ul"),
    closeBtn: document.querySelector(".close-header")
};

const state = { hoveredNode: undefined, hoveredNeighbors: undefined };

// ------------------------------------------------
// 1. CARGA Y PREPARACIÓN
// ------------------------------------------------
async function run() {
    try {
        const response = await fetch(DATA_FILE);
        if (!response.ok) throw new Error("No se pudo leer el JSON");

        const data = await response.json();

        // Instanciar grafo
        const graph = new Graph();

        // IMPORTAR DATOS DE GEPHI
        // Graphology es inteligente: suele entender el formato {nodes:[], edges:[]} de Gephi
        graph.import(data);

        // --- AJUSTE RÁPIDO (Post-Gephi) ---
        // Gephi suele exportar tamaños muy grandes. Hacemos una pasada rápida
        // para ajustar tamaños y asegurar colores.
        graph.forEachNode((node, attrs) => {
            // 1. Reescalar tamaño (ajusta el 0.5 si lo ves muy grande o chico)
            // Si tus nodos en Gephi miden 10, aquí medirán 5.
            if (attrs.size) {
                graph.setNodeAttribute(node, "size", attrs.size * 0.5);
            } else {
                graph.setNodeAttribute(node, "size", 3); // Tamaño por defecto
            }

            // 2. Asegurar color (fallback a gris si no tiene)
            if (!attrs.color) {
                graph.setNodeAttribute(node, "color", "#999");
            }

            // 3. (Opcional) Si Gephi exportó el label en "label" pero Sigma no lo ve,
            // a veces hay que mapearlo. Normalmente Gephi lo hace bien.
        });

        // Iniciar Sigma
        initSigma(graph);

        // Ocultar loader
        const loader = document.getElementById("graph-loader");
        if (loader) loader.style.display = "none";

    } catch (err) {
        console.error("Error cargando grafo:", err);
        container.innerHTML = `<h3 style="color:red; padding:20px;">Error: ${err.message}</h3>`;
    }
}

// ------------------------------------------------
// 2. CONFIGURACIÓN VISUAL SIGMA
// ------------------------------------------------
function initSigma(graph) {
    const renderer = new Sigma(graph, container, {
        renderEdgeLabels: false,
        minCameraRatio: 0.1,
        maxCameraRatio: 5, // Ajustado para zoom más controlado
        hideLabelsOnMove: true,

        // Reducers (Efectos visuales)
        nodeReducer: (node, data) => {
            if (state.hoveredNode) {
                if (node === state.hoveredNode || (state.hoveredNeighbors && state.hoveredNeighbors.has(node))) {
                    return { ...data, zIndex: 1 };
                }
                return { ...data, zIndex: 0, label: "", color: "#e5e5e5", image: null };
            }
            return data;
        },
        edgeReducer: (edge, data) => {
            if (state.hoveredNode) {
                if (graph.hasExtremity(edge, state.hoveredNode)) {
                    return { ...data, zIndex: 1, color: "#555" }; // Arista resaltada más oscura
                }
                return { ...data, zIndex: 0, hidden: true, color: "#f0f0f0" };
            }
            return data;
        }
    });

    setupInteractions(renderer, graph);
}

// ------------------------------------------------
// 3. INTERACCIONES
// ------------------------------------------------
function setupInteractions(renderer, graph) {

    renderer.on("enterNode", ({ node }) => {
        state.hoveredNode = node;
        state.hoveredNeighbors = new Set(graph.neighbors(node));
        container.style.cursor = "pointer";
        renderer.scheduleRefresh();
    });

    renderer.on("leaveNode", () => {
        state.hoveredNode = undefined;
        state.hoveredNeighbors = undefined;
        container.style.cursor = "default";
        renderer.scheduleRefresh();
    });

    renderer.on("clickNode", ({ node }) => {
        const attrs = graph.getNodeAttributes(node);
        const neighbors = graph.neighbors(node);

        requestAnimationFrame(() => {
            ui.panel.style.display = "block";
            ui.name.textContent = attrs.label || "Sin nombre";
            ui.data.textContent = `Grado: ${graph.degree(node)} · Vecinos: ${neighbors.length}`;

            const maxList = 100;
            const listHtml = neighbors.slice(0, maxList)
                .map(n => `<li>${graph.getNodeAttribute(n, "label") || n}</li>`)
                .join("");

            ui.list.innerHTML = listHtml + (neighbors.length > maxList ? `<li>... ${neighbors.length - maxList} más</li>` : "");
        });
    });

    const closePanel = () => ui.panel.style.display = "none";
    renderer.on("clickStage", closePanel);
    ui.closeBtn.addEventListener("click", closePanel);
}

run();