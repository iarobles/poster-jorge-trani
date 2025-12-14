// ==============================
// Sigma.js v3 – Aplicación principal
// ==============================

import Sigma from "https://esm.sh/sigma@3.0.0";
import Graph from "https://esm.sh/graphology@0.25.4";
import { parse } from "https://esm.sh/graphology-gexf/browser";


// ------------------------------
// Configuración
// ------------------------------
const GEXF_FILE = "datos/red-completa.gexf";
const container = document.getElementById("sigma-canvas");

// Panel
const panel = document.getElementById("attributepane");
const nameBox = panel.querySelector(".name");
const dataBox = panel.querySelector(".data");
const listBox = panel.querySelector(".link ul");

// Estado interno para interacciones
const state = {
    hoveredNode: undefined,
    hoveredNeighbors: undefined,
};

// ------------------------------
// Cargar GEXF
// ------------------------------
fetch(GEXF_FILE)
    .then(r => {
        if (!r.ok) throw new Error("No se pudo cargar el GEXF");
        return r.text();
    })
    .then(gexf => {
        // Parsear GEXF creando una nueva instancia de Graph
        const graph = parse(Graph, gexf);

        // Post-procesamiento básico

        graph.forEachNode((node, attrs) => {
            if (!attrs.size) graph.setNodeAttribute(node, "size", 3);
            if (!attrs.color) graph.setNodeAttribute(node, "color", "#999");
        });

        // reescalamos el tamaño de los nodos
        graph.forEachNode((node, attrs) => {
            graph.setNodeAttribute(node, "size", attrs.size * 0.3);
        });

        initSigma(graph);
    });

// ------------------------------
// Inicializar Sigma v3
// ------------------------------
function initSigma(graph) {

    const renderer = new Sigma(graph, container, {
        renderEdgeLabels: false,
        minCameraRatio: 0.1,
        maxCameraRatio: 10,
        // Reducers para efectos visuales sin mutar el grafo
        nodeReducer: (node, data) => {
            if (state.hoveredNode) {
                if (node === state.hoveredNode || (state.hoveredNeighbors && state.hoveredNeighbors.has(node))) {
                    return { ...data, zIndex: 1 }; // Resaltar
                } else {
                    return { ...data, zIndex: 0, label: "", color: "#e5e5e5", image: null }; // Dim
                }
            }
            return data;
        },
        edgeReducer: (edge, data) => {
            if (state.hoveredNode) {
                if (graph.hasExtremity(edge, state.hoveredNode)) {
                    return { ...data, zIndex: 1 };
                } else {
                    return { ...data, zIndex: 0, hidden: true, color: "#f0f0f0" };
                }
            }
            return data;
        }
    });

    setupInteractions(renderer, graph);
}

// ------------------------------
// Interacciones (Hover / Click)
// ------------------------------
function setupInteractions(renderer, graph) {

    // Hover
    renderer.on("enterNode", ({ node }) => {
        state.hoveredNode = node;
        state.hoveredNeighbors = new Set(graph.neighbors(node));
        console.log("enterNode", node);
        renderer.refresh(); // Forzar re-render para aplicar reducers
        //renderer.scheduleRefresh();

        // Cursor pointer
        container.style.cursor = "pointer";
    });

    renderer.on("leaveNode", () => {
        state.hoveredNode = undefined;
        state.hoveredNeighbors = undefined;
        renderer.refresh(); // Forzar re-render para aplicar reducers
        //renderer.scheduleRefresh();

        container.style.cursor = "default";
    });

    // Click
    renderer.on("clickNode", ({ event, node }) => {
        //if (event && event.preventDefault) event.preventDefault();
        //if (event && event.original && event.original.stopPropagation) event.original.stopPropagation();

        const attrs = graph.getNodeAttributes(node);
        const { x, y } = attrs;

        const neighbors = graph.neighbors(node);

        // Mostrar panel
        panel.style.display = "block";

        nameBox.textContent = attrs.label || node;
        dataBox.textContent = `Grado: ${graph.degree(node)} · Vecinos: ${neighbors.length}`;

        listBox.innerHTML = neighbors
            .map(n => {
                const label = graph.getNodeAttribute(n, "label") || n;
                return `<li>${label}</li>`;
            })
            .join("");

        // Centrar cámara
        /*
        renderer.getCamera().animate(
            {
                x,
                y,
                ratio: Math.max(0.3, renderer.getCamera().getState().ratio * 0.6)
            }, // Zoom con ratio
            { duration: 600 }
        );*/
    });

    // Cerrar panel al hacer click en el fondo
    renderer.on("clickStage", () => {
        panel.style.display = "none";
    });

    panel.querySelector(".close-header").addEventListener("click", () => {
        panel.style.display = "none";
    });
}


