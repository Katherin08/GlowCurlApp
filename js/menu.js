
// ===============================
// ABRIR Y CERRAR MENÚ
// ===============================

function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".overlay");

    if (!sidebar) return;

    const abierto = sidebar.classList.toggle("activo");

    if (overlay) {
        overlay.classList.toggle("activo", abierto);
    }
}

function cerrarMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".overlay");

    if (sidebar) {
        sidebar.classList.remove("activo");
    }

    if (overlay) {
        overlay.classList.remove("activo");
    }
}


// ===============================
// CARGAR CONFIGURACIÓN
// ===============================

function cargarConfiguracion() {
    let config = {};

    try {
        const guardada = localStorage.getItem("configuracion");

        if (guardada) {
            config = JSON.parse(guardada);

            if (!config || typeof config !== "object" || Array.isArray(config)) {
                config = {};
            }
        }
    } catch (error) {
        console.error("Error al cargar la configuración:", error);
        config = {};
    }

    // Nombre de la empresa
    const titulo = document.getElementById("nombreEmpresa");

    if (titulo) {
        titulo.textContent = config.empresa || "Glow Curl App";
    }

    // Tema visual
    let colores;

    switch (config.tema) {
        case "rosa":
            colores = {
                sidebar: "#d46aa3",
                boton: "#d46aa3",
                fondo: "#fdeaf3"
            };
            break;

        case "beige":
            colores = {
                sidebar: "#b68b63",
                boton: "#b68b63",
                fondo: "#f5eee6"
            };
            break;

        default:
            colores = {
                sidebar: "#d89c7d",
                boton: "#d89c7d",
                fondo: "#f4e4da"
            };
    }

    const raiz = document.documentElement;

    raiz.style.setProperty("--sidebar", colores.sidebar);
    raiz.style.setProperty("--boton", colores.boton);
    raiz.style.setProperty("--fondo", colores.fondo);
}


// ===============================
// INICIALIZACIÓN
// ===============================

document.addEventListener("DOMContentLoaded", function () {
    cargarConfiguracion();
});
