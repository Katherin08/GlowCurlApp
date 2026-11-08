
/* ==========================================
   GLOW CURL APP - CLIENTES.JS
   Conexión con Node.js y MySQL
========================================== */

const API = "https://glowcurl-backend.onrender.com/api";

// ==========================================
// SESIÓN
// ==========================================

function getUsuario() {
    try {
        return JSON.parse(localStorage.getItem("usuarioActual")) || null;
    } catch {
        return null;
    }
}

function guardarSesion(usuario) {
    localStorage.setItem("usuarioActual", JSON.stringify(usuario));
}

function correoUsuario(usuario) {
    return String(usuario?.correo || "").trim().toLowerCase();
}

function formatoPrecio(valor) {
    return "$" + Number(valor || 0).toLocaleString("es-CO");
}

// ==========================================
// CONEXIÓN CON EL BACKEND
// ==========================================

async function solicitar(ruta, opciones = {}) {
    const respuesta = await fetch(API + ruta, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...(opciones.headers || {})
        }
    });

    let datos;

    try {
        datos = await respuesta.json();
    } catch {
        throw new Error("El servidor no devolvió una respuesta válida.");
    }

    if (!respuesta.ok) {
        throw new Error(datos.mensaje || "Error en la solicitud.");
    }

    return datos;
}

// ==========================================
// PROTECCIÓN DE PÁGINAS
// ==========================================

function exigirUsuario() {
    const usuario = getUsuario();

    if (!usuario || !usuario.id_usuario) {
        alert("Para continuar, inicia sesión o crea una cuenta.");
        window.location.href = "../auth/loginCliente.html";
        return null;
    }

    return usuario;
}

function protegerPaginaPrivada() {
    const privada =
        document.getElementById("formPerfil") ||
        document.getElementById("listaCitas") ||
        document.getElementById("listaCompras") ||
        document.getElementById("listaHistorial");

    if (privada && !getUsuario()) {
        window.location.replace("../auth/loginCliente.html");
        return false;
    }

    return true;
}

function cerrarSesion() {
    localStorage.removeItem("usuarioActual");
    window.location.href = "../auth/loginCliente.html";
}

// ==========================================
// REGISTRO
// ==========================================

async function registrarCliente() {
    const nombre = document.getElementById("nombre")?.value.trim();
    const apellido = document.getElementById("apellido")?.value.trim();
    const correo = document.getElementById("correo")?.value.trim().toLowerCase();
    const telefono = document.getElementById("telefono")?.value.trim();
    const cabello = document.getElementById("cabello")?.value.trim().toLowerCase();
    const password = document.getElementById("password")?.value;
    const confirmar = document.getElementById("confirmar")?.value;

    if (!nombre || !apellido || !correo || !telefono ||
        !cabello || !password || !confirmar) {
        alert("Completa todos los campos.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        alert("Ingresa un correo electrónico válido.");
        return;
    }

    if (!["ondulado", "rizo", "afro"].includes(cabello)) {
        alert("Selecciona un tipo de cabello válido.");
        return;
    }

    if (password !== confirmar) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    try {
        const resultado = await solicitar("/clientes", {
            method: "POST",
            body: JSON.stringify({
                nombre,
                apellido,
                correo,
                telefono,
                cabello,
                password
            })
        });

        alert(resultado.mensaje);
        window.location.href = "loginCliente.html";

    } catch (error) {
        console.error("Error en registro:", error);
        alert(error.message);
    }
}

// ==========================================
// INICIO DE SESIÓN
// ==========================================

async function ingresarCliente() {
    const campoCorreo = document.getElementById("usuarioCliente");
    const campoPassword = document.getElementById("passwordCliente");

    if (!campoCorreo || !campoPassword) {
        alert("No se encontraron los campos de inicio de sesión.");
        return;
    }

    const correo = campoCorreo.value.trim().toLowerCase();
    const password = campoPassword.value;

    if (!correo || !password) {
        alert("Escribe tu correo y contraseña.");
        return;
    }

    try {
        const resultado = await solicitar("/login", {
            method: "POST",
            body: JSON.stringify({ correo, password })
        });

        guardarSesion(resultado.usuario);

        alert("¡Bienvenido/a a Glow Curl!");

        const volver = new URLSearchParams(window.location.search).get("volver");

        if (volver) {
            window.location.href = volver;
        } else {
            window.location.href = "../cliente/inicioCliente.html";
        }

    } catch (error) {
        console.error("Error de inicio de sesión:", error);
        alert(error.message);
    }
}

function mostrarPasswordCliente() {
    const campo = document.getElementById("passwordCliente");

    if (!campo) return;

    campo.type = campo.type === "password" ? "text" : "password";
}

function limpiarCliente() {
    const correo = document.getElementById("usuarioCliente");
    const password = document.getElementById("passwordCliente");

    if (correo) correo.value = "";
    if (password) password.value = "";
}

// ==========================================
// PERFIL
// ==========================================

async function cargarPerfil() {
    const usuario = exigirUsuario();
    if (!usuario) return;

    try {
        const resultado = await solicitar("/usuarios");

        const datos = (resultado.usuarios || []).find(
            persona => Number(persona.id_usuario) === Number(usuario.id_usuario)
        );

        if (!datos) {
            alert("No se encontró la información de tu perfil.");
            return;
        }

        const campos = {
            nombre: datos.nombre || "",
            apellido: datos.apellido || "",
            correo: datos.correo || "",
            telefono: datos.telefono || "",
            cabello: datos.cabello || datos.tipo_cabello || ""
        };

        Object.entries(campos).forEach(([id, valor]) => {
            const campo = document.getElementById(id);
            if (campo) campo.value = valor;
        });

        guardarSesion({
            ...usuario,
            ...datos
        });

    } catch (error) {
        console.error("Error al cargar el perfil:", error);
        alert(error.message);
    }
}

async function actualizarPerfil() {
    const usuario = exigirUsuario();
    if (!usuario) return;

    const nombre = document.getElementById("nombre")?.value.trim();
    const apellido = document.getElementById("apellido")?.value.trim();
    const correo = document.getElementById("correo")?.value.trim().toLowerCase();
    const telefono = document.getElementById("telefono")?.value.trim();
    const cabello = document.getElementById("cabello")?.value.trim().toLowerCase();

    if (!nombre || !apellido || !correo || !telefono || !cabello) {
        alert("Completa todos los campos.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        alert("Ingresa un correo válido.");
        return;
    }

    if (!["ondulado", "rizo", "afro"].includes(cabello)) {
        alert("Selecciona un tipo de cabello válido.");
        return;
    }

    try {
        const resultado = await solicitar(
            `/usuarios/${usuario.id_usuario}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    nombre,
                    apellido,
                    correo,
                    telefono,
                    cabello,
                    rol: usuario.rol || "cliente"
                })
            }
        );

        guardarSesion({
            ...usuario,
            nombre,
            apellido,
            correo,
            telefono,
            cabello,
            tipo_cabello: cabello
        });

        alert(resultado.mensaje);

    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        alert(error.message);
    }
}

// ==========================================
// PRODUCTOS
// ==========================================

function obtenerImagenProducto(nombre) {
    const nombreNormalizado = String(nombre || "").toLowerCase();

    if (nombreNormalizado.includes("shampoo")) {
        return "../../img/shampoo.png";
    }

    if (nombreNormalizado.includes("crema")) {
        return "../../img/crema.png";
    }

    if (nombreNormalizado.includes("aceite")) {
        return "../../img/aceite.png";
    }

    if (nombreNormalizado.includes("mascarilla")) {
        return "../../img/mascarilla.png";
    }

    return "../../img/crema.png";
}

async function cargarProductos() {
    const contenedor = document.getElementById("contenedorProductos");
    if (!contenedor) return;

    try {
        const resultado = await solicitar("/productos");
        const productos = resultado.productos || [];

        contenedor.innerHTML = "";

        if (!productos.length) {
            contenedor.textContent = "No hay productos disponibles.";
            return;
        }

        productos.forEach(producto => {
            const tarjeta = document.createElement("div");
            tarjeta.className = "producto-card";

            const imagen = document.createElement("img");
            imagen.className = "producto-imagen";
            imagen.src = obtenerImagenProducto(producto.nombre);
            imagen.alt = producto.nombre;

            imagen.onerror = () => {
                imagen.src = "../../img/crema.png";
            };

            const nombre = document.createElement("h3");
            nombre.textContent = producto.nombre;

            const descripcion = document.createElement("p");
            descripcion.className = "descripcion";
            descripcion.textContent = producto.descripcion || "";

            const precio = document.createElement("p");
            precio.className = "precio";
            precio.textContent = formatoPrecio(producto.precio);

            const stock = Number(producto.cantidad ?? producto.stock ?? 0);

            const boton = document.createElement("button");
            boton.type = "button";

            if (stock > 0) {
                boton.textContent = "Agregar al carrito";

                boton.onclick = () => agregarCarrito(
                    producto.id_producto,
                    producto.nombre,
                    producto.precio
                );
            } else {
                boton.textContent = "Agotado";
                boton.disabled = true;
            }

            tarjeta.append(imagen, nombre, descripcion, precio, boton);
            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
        contenedor.textContent = error.message;
    }
}

// ==========================================
// SERVICIOS
// ==========================================

async function cargarServicios() {
    const contenedor = document.getElementById("contenedorServicios");
    if (!contenedor) return;

    try {
        const resultado = await solicitar("/servicios");

        contenedor.innerHTML = "";

        const servicios = resultado.servicios || [];

        if (!servicios.length) {
            contenedor.textContent = "No hay servicios disponibles.";
            return;
        }

        servicios.forEach(servicio => {
            const tarjeta = document.createElement("div");
            tarjeta.className = "tarjeta-servicio";

            const nombre = document.createElement("h3");
            nombre.textContent = servicio.nombre;

            const descripcion = document.createElement("p");
            descripcion.textContent = servicio.descripcion || "";

            const precio = document.createElement("p");
            precio.textContent = formatoPrecio(servicio.precio);

            tarjeta.append(nombre, descripcion, precio);
            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error(error);
        contenedor.textContent = error.message;
    }
}

// ==========================================
// CARRITO
// ==========================================

function claveCarritoActual() {
    const usuario = getUsuario();

    return usuario
        ? "carrito_" + correoUsuario(usuario)
        : "carrito_visitante";
}

function obtenerCarritoActual() {
    try {
        return JSON.parse(
            localStorage.getItem(claveCarritoActual())
        ) || [];
    } catch {
        return [];
    }
}

function guardarCarritoActual(carrito) {
    localStorage.setItem(
        claveCarritoActual(),
        JSON.stringify(carrito)
    );
}

function agregarCarrito(id, producto, precio) {
    const carrito = obtenerCarritoActual();

    const existente = carrito.find(
        item => Number(item.id_producto) === Number(id)
    );

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id_producto: id,
            producto,
            precio: Number(precio),
            cantidad: 1
        });
    }

    guardarCarritoActual(carrito);

    alert("Producto agregado al carrito.");

    mostrarCarrito();
}

function mostrarCarrito() {
    const tabla = document.getElementById("listaCarrito");
    if (!tabla) return;

    const carrito = obtenerCarritoActual();

    tabla.innerHTML = "";

    let total = 0;

    if (!carrito.length) {
        tabla.innerHTML = '<tr><td colspan="5">El carrito está vacío.</td></tr>';
    }

    carrito.forEach((producto, indice) => {
        const cantidad = Number(producto.cantidad) || 1;
        const precio = Number(producto.precio) || 0;
        const subtotal = cantidad * precio;

        total += subtotal;

        const fila = document.createElement("tr");

        [
            producto.producto,
            formatoPrecio(precio),
            cantidad,
            formatoPrecio(subtotal)
        ].forEach(valor => {
            const celda = document.createElement("td");
            celda.textContent = valor;
            fila.appendChild(celda);
        });

        const acciones = document.createElement("td");

        const mas = document.createElement("button");
        mas.textContent = "+";
        mas.type = "button";
        mas.onclick = () => cambiarCantidad(indice, 1);

        const menos = document.createElement("button");
        menos.textContent = "−";
        menos.type = "button";
        menos.onclick = () => cambiarCantidad(indice, -1);

        const eliminar = document.createElement("button");
        eliminar.textContent = "Eliminar";
        eliminar.type = "button";
        eliminar.onclick = () => eliminarItem(indice);

        acciones.append(mas, menos, eliminar);
        fila.appendChild(acciones);
        tabla.appendChild(fila);
    });

    const totalElemento = document.getElementById("totalCarrito");

    if (totalElemento) {
        totalElemento.textContent = formatoPrecio(total);
    }
}

function cambiarCantidad(indice, cambio) {
    const carrito = obtenerCarritoActual();

    if (!carrito[indice]) return;

    carrito[indice].cantidad += cambio;

    const actualizado = carrito.filter(
        producto => producto.cantidad > 0
    );

    guardarCarritoActual(actualizado);
    mostrarCarrito();
}

function aumentar(indice) {
    cambiarCantidad(indice, 1);
}

function disminuir(indice) {
    cambiarCantidad(indice, -1);
}

function eliminarItem(indice) {
    const carrito = obtenerCarritoActual();

    carrito.splice(indice, 1);

    guardarCarritoActual(carrito);
    mostrarCarrito();
}

function vaciarCarrito() {
    if (!confirm("¿Deseas vaciar el carrito?")) return;

    guardarCarritoActual([]);
    mostrarCarrito();
}

// ==========================================
// COMPRAS Y VENTAS
// ==========================================

async function finalizarCompra() {
    const usuario = exigirUsuario();
    if (!usuario) return;

    const carrito = obtenerCarritoActual();

    if (!carrito.length) {
        alert("El carrito está vacío.");
        return;
    }

    try {
        const resultado = await solicitar("/ventas", {
            method: "POST",
            body: JSON.stringify({
                id_usuario: usuario.id_usuario,
                productos: carrito.map(item => ({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad
                }))
            })
        });

        guardarCarritoActual([]);

        alert(resultado.mensaje);

        mostrarCarrito();

        await mostrarCompras();
        await cargarInicio();

    } catch (error) {
        console.error("Error al finalizar la compra:", error);
        alert(error.message);
    }
}

async function mostrarCompras() {
    const tabla = document.getElementById("listaCompras");
    if (!tabla) return;

    const usuario = exigirUsuario();
    if (!usuario) return;

    try {
        const resultado = await solicitar(
            `/ventas/cliente/${usuario.id_usuario}`
        );

        const compras = resultado.compras || [];

        tabla.innerHTML = "";

        let total = 0;
        let cantidadTotal = 0;

        if (!compras.length) {
            tabla.innerHTML = '<tr><td colspan="5">No hay compras registradas.</td></tr>';
        }

        compras.forEach(compra => {
            const cantidad = Number(compra.cantidad) || 0;
            const precio = Number(compra.precio) || 0;
            const subtotal = Number(compra.subtotal) || cantidad * precio;

            total += subtotal;
            cantidadTotal += cantidad;

            const fila = document.createElement("tr");

            [
                compra.producto,
                cantidad,
                formatoPrecio(precio),
                String(compra.fecha).slice(0, 10),
                formatoPrecio(subtotal)
            ].forEach(valor => {
                const celda = document.createElement("td");
                celda.textContent = valor ?? "";
                fila.appendChild(celda);
            });

            tabla.appendChild(fila);
        });

        const cantidadElemento = document.getElementById("cantidadCompras");
        const totalElemento = document.getElementById("totalCompras");

        if (cantidadElemento) cantidadElemento.textContent = cantidadTotal;
        if (totalElemento) totalElemento.textContent = formatoPrecio(total);

    } catch (error) {
        console.error("Error al cargar las compras:", error);

        tabla.innerHTML = '<tr><td colspan="5">No se pudieron cargar las compras.</td></tr>';
    }
}

// ==========================================
// CITAS
// ==========================================

function fechaValidaNoAnterior(fechaTexto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto)) return false;

    const fecha = new Date(fechaTexto + "T00:00:00");

    if (Number.isNaN(fecha.getTime())) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return fecha >= hoy;
}

function horaValida(hora) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

async function reservar(servicio, idFecha, idHora) {
    const usuario = exigirUsuario();
    if (!usuario) return;

    const fecha = document.getElementById(idFecha)?.value;
    const hora = document.getElementById(idHora)?.value;

    if (!usuario.id_cliente) {
        alert("No se encontró el identificador del cliente. Cierra sesión e inicia sesión nuevamente.");
        return;
    }

    if (!fecha || !hora) {
        alert("Selecciona una fecha y una hora.");
        return;
    }

    if (!fechaValidaNoAnterior(fecha) || !horaValida(hora)) {
        alert("Selecciona una fecha y hora válidas.");
        return;
    }

    try {
        const resultado = await solicitar("/citas", {
            method: "POST",
            body: JSON.stringify({
                id_cliente: usuario.id_cliente,
                id_usuario: usuario.id_usuario,
                servicio,
                fecha,
                hora
            })
        });

        alert(resultado.mensaje);

        await mostrarCitas();
        await mostrarHistorial();
        await cargarInicio();

    } catch (error) {
        console.error("Error al reservar:", error);
        alert(error.message);
    }
}

async function mostrarCitas() {
    const tabla = document.getElementById("listaCitas");
    if (!tabla) return;

    const usuario = exigirUsuario();
    if (!usuario) return;

    try {
        const resultado = await solicitar(
            `/citas/cliente/${usuario.id_usuario}`
        );

        const citas = resultado.citas || [];

        tabla.innerHTML = "";

        const activas = citas.filter(
            cita => cita.estado !== "Cancelada"
        );

        if (!activas.length) {
            tabla.innerHTML = '<tr><td colspan="5">No tienes citas registradas.</td></tr>';
            return;
        }

        activas.forEach(cita => {
            const fila = document.createElement("tr");

            [
                cita.servicio,
                String(cita.fecha).slice(0, 10),
                String(cita.hora).slice(0, 5),
                cita.estado
            ].forEach(valor => {
                const celda = document.createElement("td");
                celda.textContent = valor || "";
                fila.appendChild(celda);
            });

            const acciones = document.createElement("td");

            const cancelar = document.createElement("button");
            cancelar.textContent = "Cancelar";
            cancelar.type = "button";
            cancelar.onclick = () => cancelarCita(cita.id_cita);

            acciones.appendChild(cancelar);
            fila.appendChild(acciones);
            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error(error);

        tabla.innerHTML = '<tr><td colspan="5">No se pudieron cargar las citas.</td></tr>';
    }
}

async function cancelarCita(id) {
    if (!confirm("¿Seguro que deseas cancelar esta cita?")) return;

    try {
        const resultado = await solicitar(`/citas/${id}`, {
            method: "DELETE"
        });

        alert(resultado.mensaje);

        await mostrarCitas();
        await mostrarHistorial();
        await cargarInicio();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// ==========================================
// HISTORIAL
// ==========================================

async function mostrarHistorial() {
    const tabla = document.getElementById("listaHistorial");
    if (!tabla) return;

    const usuario = exigirUsuario();
    if (!usuario) return;

    try {
        const resultado = await solicitar(
            `/citas/cliente/${usuario.id_usuario}`
        );

        const citas = resultado.citas || [];

        tabla.innerHTML = "";

        if (citas.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="4">No tienes citas registradas.</td>
                </tr>
            `;
            return;
        }

        citas.forEach(cita => {
            const fila = document.createElement("tr");

            const datos = [
                cita.servicio || "Servicio no disponible",
                String(cita.fecha || "").slice(0, 10),
                String(cita.hora || "").slice(0, 5),
                cita.estado || "Pendiente"
            ];

            datos.forEach(valor => {
                const celda = document.createElement("td");
                celda.textContent = valor;
                fila.appendChild(celda);
            });

            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al cargar el historial de citas:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="4">No se pudo cargar el historial.</td>
            </tr>
        `;
    }
}

// ==========================================
// INICIO
// ==========================================

async function cargarInicio() {
    const usuario = getUsuario();

    const totalServicios = document.getElementById("totalServicios");
    const totalProductos = document.getElementById("totalProductos");
    const proxima = document.getElementById("proximaCita");

    if (!usuario) {
        if (totalServicios) totalServicios.textContent = "—";
        if (totalProductos) totalProductos.textContent = "—";
        if (proxima) proxima.textContent = "Inicia sesión para consultar";
        return;
    }

    try {
        const resultado = await solicitar(
            `/citas/cliente/${usuario.id_usuario}`
        );

        const citas = resultado.citas || [];

        const activas = citas.filter(
            cita => cita.estado !== "Cancelada"
        );

        if (totalServicios) {
            totalServicios.textContent = activas.length;
        }

        const comprasResultado = await solicitar(
            `/ventas/cliente/${usuario.id_usuario}`
        );

        const compras = comprasResultado.compras || [];

        if (totalProductos) {
            totalProductos.textContent = compras.reduce(
                (total, compra) => total + Number(compra.cantidad || 0),
                0
            );
        }

        if (proxima) {
            const futuras = activas
                .filter(cita =>
                    ["Pendiente", "Reprogramada"].includes(cita.estado)
                )
                .sort((a, b) =>
                    new Date(`${a.fecha}T${a.hora}`) -
                    new Date(`${b.fecha}T${b.hora}`)
                );

            proxima.textContent = futuras.length
                ? `${String(futuras[0].fecha).slice(0, 10)} · ${String(futuras[0].hora).slice(0, 5)}`
                : "Sin citas próximas";
        }

    } catch (error) {
        console.error("Error cargando inicio:", error);
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    if (!protegerPaginaPrivada()) return;

    if (document.getElementById("formPerfil")) {
        await cargarPerfil();
    }

    if (
        document.getElementById("totalServicios") ||
        document.getElementById("totalProductos") ||
        document.getElementById("proximaCita")
    ) {
        await cargarInicio();
    }

    if (document.getElementById("listaCitas")) {
        await mostrarCitas();
    }

    if (document.getElementById("listaHistorial")) {
        await mostrarHistorial();
    }

    if (document.getElementById("listaCarrito")) {
        mostrarCarrito();
    }

    if (document.getElementById("listaCompras")) {
        await mostrarCompras();
    }

    if (document.getElementById("contenedorProductos")) {
        await cargarProductos();
    }

    if (document.getElementById("contenedorServicios")) {
        await cargarServicios();
    }
});

