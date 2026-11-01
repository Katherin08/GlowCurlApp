
// ABRIR Y CERRAR MENÚ
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

    if (sidebar) sidebar.classList.remove("activo");
    if (overlay) overlay.classList.remove("activo");
}

// CARGAR CONFIGURACIÓN
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
    }

    const titulo = document.getElementById("nombreEmpresa");

    if (titulo) {
        titulo.textContent = config.empresa || "Glow Curl App";
    }

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
                sidebar: "#d46aa3",
                boton: "#d46aa3",
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

// COMPROBAR SESIÓN
function obtenerUsuarioSesion() {
    try {
        if (typeof getUsuario === "function") {
            const usuario = getUsuario();

            if (usuario && usuario.id_usuario) {
                return usuario;
            }
        }

        const guardado = localStorage.getItem("usuarioActual");

        if (!guardado) return null;

        const usuario = JSON.parse(guardado);

        return usuario && usuario.id_usuario ? usuario : null;

    } catch (error) {
        console.error("Error al comprobar sesión:", error);
        return null;
    }
}

// MOSTRAR U OCULTAR OPCIONES
function actualizarMenuNavegacion() {
    const usuario = obtenerUsuarioSesion();
    const tieneSesion = Boolean(usuario);

    document.body.classList.toggle("logged-in", tieneSesion);
    document.body.classList.toggle("logged-out", !tieneSesion);

    const login = document.getElementById("opcionLogin");
    const registro = document.getElementById("opcionRegistro");
    const cerrar = document.getElementById("opcionCerrarSesion");

    if (login) login.style.display = tieneSesion ? "none" : "";
    if (registro) registro.style.display = tieneSesion ? "none" : "";
    if (cerrar) cerrar.style.display = tieneSesion ? "" : "none";
}

// CERRAR SESIÓN
function cerrarSesion() {
    localStorage.removeItem("usuarioActual");

    alert("Has cerrado sesión correctamente.");

    window.location.href = "../auth/loginCliente.html";
}

// INICIALIZAR
document.addEventListener("DOMContentLoaded", function () {
    cargarConfiguracion();
    actualizarMenuNavegacion();
});
