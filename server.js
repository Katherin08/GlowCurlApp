
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./backend/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ======================================
// FUNCIONES AUXILIARES
// ======================================

function errorServidor(res, mensaje, error) {
    console.error(mensaje, error);

    return res.status(500).json({
        ok: false,
        mensaje,
        error: error.message
    });
}

function esNumeroPositivo(valor) {
    return Number.isFinite(Number(valor)) && Number(valor) > 0;
}

// ======================================
// PRUEBA DE CONEXIÓN CON MYSQL
// ======================================

app.get('/api/prueba-db', async (req, res) => {
    try {
        const [resultado] = await pool.query('SELECT 1 AS conectado');

        res.json({
            ok: true,
            mensaje: 'Glow Curl App está conectada a MySQL',
            resultado
        });
    } catch (error) {
        errorServidor(res, 'No se pudo conectar con MySQL', error);
    }
});

// ======================================
// REGISTRAR CLIENTE
// ======================================

app.post('/api/clientes', async (req, res) => {
    const {
        nombre,
        apellido,
        correo,
        telefono,
        cabello,
        password
    } = req.body;

    if (!nombre || !apellido || !correo || !telefono || !cabello || !password) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Complete todos los campos obligatorios'
        });
    }

    if (!['ondulado', 'rizo', 'afro'].includes(cabello)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El tipo de cabello no es válido'
        });
    }

    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const [existente] = await conexion.query(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (existente.length > 0) {
            await conexion.rollback();

            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe un usuario con ese correo'
            });
        }

        const [usuario] = await conexion.query(
            `INSERT INTO usuarios
            (nombre, apellido, correo, telefono, cabello, password, rol)
            VALUES (?, ?, ?, ?, ?, ?, 'cliente')`,
            [nombre, apellido, correo, telefono, cabello, password]
        );

        const idUsuario = usuario.insertId;

        const [cliente] = await conexion.query(
            `INSERT INTO clientes (id_usuario)
             VALUES (?)`,
            [idUsuario]
        );

        await conexion.commit();

        res.status(201).json({
            ok: true,
            mensaje: 'Registro exitoso',
            id_usuario: idUsuario,
            id_cliente: cliente.insertId
        });

    } catch (error) {
        await conexion.rollback();
        errorServidor(res, 'Error al registrar cliente', error);
    } finally {
        conexion.release();
    }
});

// ======================================
// CRUD DE USUARIOS
// ======================================

app.get('/api/usuarios', async (req, res) => {
    try {
        const [usuarios] = await pool.query(`
            SELECT
                id AS id_usuario,
                nombre,
                apellido,
                correo,
                telefono,
                cabello,
                cabello AS tipo_cabello,
                rol,
                fecha_creacion
            FROM usuarios
            ORDER BY id DESC
        `);

        res.json({
            ok: true,
            usuarios
        });
    } catch (error) {
        errorServidor(res, 'Error al obtener los usuarios', error);
    }
});

app.post('/api/usuarios', async (req, res) => {
    const {
        nombre,
        apellido,
        correo,
        telefono,
        cabello,
        tipo_cabello,
        password,
        rol
    } = req.body;

    const tipoCabello = cabello || tipo_cabello;

    if (!nombre || !apellido || !correo || !telefono || !password || !rol) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Complete los campos obligatorios'
        });
    }

    if (!['ondulado', 'rizo', 'afro'].includes(tipoCabello)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El tipo de cabello no es válido'
        });
    }

    try {
        const [existente] = await pool.query(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe un usuario con ese correo'
            });
        }

        const [resultado] = await pool.query(`
            INSERT INTO usuarios
            (nombre, apellido, correo, telefono, cabello, password, rol)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            nombre,
            apellido,
            correo,
            telefono,
            tipoCabello,
            password,
            rol
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Usuario guardado correctamente',
            id_usuario: resultado.insertId
        });

    } catch (error) {
        errorServidor(res, 'Error al guardar el usuario', error);
    }
});

app.put('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    const {
        nombre,
        apellido,
        correo,
        telefono,
        cabello,
        tipo_cabello,
        password,
        rol
    } = req.body;

    const tipoCabello = cabello || tipo_cabello;

    if (!nombre || !apellido || !correo || !telefono || !rol) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Complete los campos obligatorios'
        });
    }

    try {
        let resultado;

        if (password) {
            [resultado] = await pool.query(`
                UPDATE usuarios
                SET nombre = ?,
                    apellido = ?,
                    correo = ?,
                    telefono = ?,
                    cabello = ?,
                    password = ?,
                    rol = ?
                WHERE id = ?
            `, [
                nombre, apellido, correo, telefono,
                tipoCabello, password, rol, id
            ]);
        } else {
            [resultado] = await pool.query(`
                UPDATE usuarios
                SET nombre = ?,
                    apellido = ?,
                    correo = ?,
                    telefono = ?,
                    cabello = ?,
                    rol = ?
                WHERE id = ?
            `, [
                nombre, apellido, correo, telefono,
                tipoCabello, rol, id
            ]);
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Usuario actualizado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al actualizar el usuario', error);
    }
});

app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            'DELETE FROM usuarios WHERE id = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Usuario eliminado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'No se puede eliminar el usuario', error);
    }
});

// ======================================
// INICIO DE SESIÓN
// ======================================

app.post('/api/login', async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Ingrese correo y contraseña'
        });
    }

    try {
        const [usuarios] = await pool.query(`
            SELECT
                id AS id_usuario,
                nombre,
                apellido,
                correo,
                telefono,
                cabello,
                cabello AS tipo_cabello,
                rol
            FROM usuarios
            WHERE correo = ? AND password = ?
        `, [correo, password]);

        if (usuarios.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        const usuario = usuarios[0];

        const [clientes] = await pool.query(
            'SELECT id_cliente FROM clientes WHERE id_usuario = ?',
            [usuario.id_usuario]
        );

        if (clientes.length > 0) {
            usuario.id_cliente = clientes[0].id_cliente;
        }

        res.json({
            ok: true,
            mensaje: 'Inicio de sesión exitoso',
            usuario
        });

    } catch (error) {
        errorServidor(res, 'Error al iniciar sesión', error);
    }
});

// ======================================
// DASHBOARD
// ======================================

app.get('/api/dashboard', async (req, res) => {
    try {
        const [[clientes]] = await pool.query(
            'SELECT COUNT(*) AS total FROM clientes'
        );

        const [[empleados]] = await pool.query(
            'SELECT COUNT(*) AS total FROM empleados'
        );

        const [[citas]] = await pool.query(
            'SELECT COUNT(*) AS total FROM citas'
        );

        const [[ventas]] = await pool.query(
            'SELECT COALESCE(SUM(total), 0) AS total FROM ventas'
        );

        res.json({
            ok: true,
            clientes: clientes.total,
            empleados: empleados.total,
            citas: citas.total,
            ventas: ventas.total
        });

    } catch (error) {
        errorServidor(res, 'Error al cargar el dashboard', error);
    }
});

// ======================================
// PRODUCTOS
// ======================================

app.get('/api/productos', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT
                id_producto,
                codigo,
                nombre,
                descripcion,
                precio,
                stock,
                stock AS cantidad
            FROM productos
            ORDER BY id_producto DESC
        `);

        res.json({
            ok: true,
            productos
        });

    } catch (error) {
        errorServidor(res, 'Error al obtener productos', error);
    }
});

app.post('/api/productos', async (req, res) => {
    const {
        codigo,
        nombre,
        descripcion,
        precio,
        stock,
        cantidad
    } = req.body;

    const existencia = stock !== undefined ? stock : cantidad;

    if (!codigo || !nombre || precio === undefined || precio === '' ||
        !esNumeroPositivo(precio) || !Number.isInteger(Number(existencia)) ||
        Number(existencia) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Verifique el código, nombre, precio y stock'
        });
    }

    try {
        const [existente] = await pool.query(
            'SELECT id_producto FROM productos WHERE codigo = ?',
            [codigo]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe un producto con ese código'
            });
        }

        const [resultado] = await pool.query(`
            INSERT INTO productos
            (codigo, nombre, descripcion, precio, stock)
            VALUES (?, ?, ?, ?, ?)
        `, [
            codigo,
            nombre,
            descripcion || null,
            Number(precio),
            Number(existencia)
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Producto guardado correctamente',
            id_producto: resultado.insertId
        });

    } catch (error) {
        errorServidor(res, 'Error al guardar producto', error);
    }
});

app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;

    const {
        codigo,
        nombre,
        descripcion,
        precio,
        stock,
        cantidad
    } = req.body;

    const existencia = stock !== undefined ? stock : cantidad;

    if (!codigo || !nombre || precio === undefined || precio === '' ||
        !esNumeroPositivo(precio) || !Number.isInteger(Number(existencia)) ||
        Number(existencia) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Verifique los datos del producto'
        });
    }

    try {
        const [resultado] = await pool.query(`
            UPDATE productos
            SET codigo = ?,
                nombre = ?,
                descripcion = ?,
                precio = ?,
                stock = ?
            WHERE id_producto = ?
        `, [
            codigo,
            nombre,
            descripcion || null,
            Number(precio),
            Number(existencia),
            id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });
        }

        await pool.query(`
            UPDATE inventario
            SET cantidad = ?
            WHERE id_producto = ?
        `, [Number(existencia), id]);

        res.json({
            ok: true,
            mensaje: 'Producto actualizado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al actualizar el producto', error);
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            'DELETE FROM productos WHERE id_producto = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Producto eliminado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al eliminar el producto', error);
    }
});

// ======================================
// INVENTARIO
// ======================================

app.get('/api/inventario', async (req, res) => {
    try {
        const [inventario] = await pool.query(`
            SELECT
                i.id_inventario,
                i.id_producto,
                p.codigo,
                p.nombre AS producto,
                i.cantidad,
                i.ubicacion,
                CASE
                    WHEN i.cantidad = 0 THEN 'Agotado'
                    WHEN i.cantidad <= 5 THEN 'Bajo stock'
                    ELSE 'Disponible'
                END AS estado
            FROM inventario i
            INNER JOIN productos p
                ON i.id_producto = p.id_producto
            ORDER BY i.id_inventario DESC
        `);

        res.json({
            ok: true,
            inventario
        });

    } catch (error) {
        errorServidor(res, 'Error al obtener inventario', error);
    }
});

app.post('/api/inventario', async (req, res) => {
    const { codigo, cantidad, ubicacion } = req.body;

    if (!codigo || cantidad === undefined || cantidad === '' ||
        !Number.isInteger(Number(cantidad)) || Number(cantidad) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Ingrese un código y una cantidad válida'
        });
    }

    try {
        const [productos] = await pool.query(
            'SELECT id_producto FROM productos WHERE codigo = ?',
            [codigo]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'No existe un producto con ese código'
            });
        }

        const idProducto = productos[0].id_producto;

        const [existente] = await pool.query(
            'SELECT id_inventario FROM inventario WHERE id_producto = ?',
            [idProducto]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Ese producto ya existe en el inventario'
            });
        }

        const [resultado] = await pool.query(`
            INSERT INTO inventario (id_producto, cantidad, ubicacion)
            VALUES (?, ?, ?)
        `, [idProducto, Number(cantidad), ubicacion || null]);

        await pool.query(
            'UPDATE productos SET stock = ? WHERE id_producto = ?',
            [Number(cantidad), idProducto]
        );

        res.status(201).json({
            ok: true,
            mensaje: 'Inventario guardado correctamente',
            id_inventario: resultado.insertId
        });

    } catch (error) {
        errorServidor(res, 'Error al guardar inventario', error);
    }
});

app.put('/api/inventario/:id', async (req, res) => {
    const { id } = req.params;
    const { codigo, cantidad, ubicacion } = req.body;

    if (!codigo || cantidad === undefined || cantidad === '' ||
        !Number.isInteger(Number(cantidad)) || Number(cantidad) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Ingrese un código y una cantidad válida'
        });
    }

    try {
        const [productos] = await pool.query(
            'SELECT id_producto FROM productos WHERE codigo = ?',
            [codigo]
        );

        if (productos.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });
        }

        const idProducto = productos[0].id_producto;

        const [resultado] = await pool.query(`
            UPDATE inventario
            SET id_producto = ?,
                cantidad = ?,
                ubicacion = ?
            WHERE id_inventario = ?
        `, [idProducto, Number(cantidad), ubicacion || null, id]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Registro de inventario no encontrado'
            });
        }

        await pool.query(
            'UPDATE productos SET stock = ? WHERE id_producto = ?',
            [Number(cantidad), idProducto]
        );

        res.json({
            ok: true,
            mensaje: 'Inventario actualizado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al actualizar inventario', error);
    }
});

app.delete('/api/inventario/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [registro] = await pool.query(
            'SELECT id_producto FROM inventario WHERE id_inventario = ?',
            [id]
        );

        if (registro.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Registro de inventario no encontrado'
            });
        }

        const idProducto = registro[0].id_producto;

        await pool.query(
            'DELETE FROM inventario WHERE id_inventario = ?',
            [id]
        );

        await pool.query(
            'UPDATE productos SET stock = 0 WHERE id_producto = ?',
            [idProducto]
        );

        res.json({
            ok: true,
            mensaje: 'Inventario eliminado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al eliminar inventario', error);
    }
});

// ======================================
// SERVICIOS
// ======================================

app.get('/api/servicios', async (req, res) => {
    try {
        const [servicios] = await pool.query(`
            SELECT
                id_servicio,
                codigo,
                nombre,
                descripcion,
                precio,
                duracion_minutos,
                duracion_minutos AS duracion
            FROM servicios
            ORDER BY id_servicio DESC
        `);

        res.json({
            ok: true,
            servicios
        });

    } catch (error) {
        errorServidor(res, 'Error al obtener los servicios', error);
    }
});

app.post('/api/servicios', async (req, res) => {
    const {
        codigo,
        nombre,
        descripcion,
        precio,
        duracion_minutos,
        duracion
    } = req.body;

    const minutos = duracion_minutos !== undefined
        ? duracion_minutos
        : duracion;

    if (!codigo || !nombre || !esNumeroPositivo(precio) ||
        !Number.isInteger(Number(minutos)) || Number(minutos) <= 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Complete los datos obligatorios del servicio'
        });
    }

    try {
        const [existente] = await pool.query(
            'SELECT id_servicio FROM servicios WHERE codigo = ?',
            [codigo]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe un servicio con ese código'
            });
        }

        const [resultado] = await pool.query(`
            INSERT INTO servicios
            (codigo, nombre, descripcion, precio, duracion_minutos)
            VALUES (?, ?, ?, ?, ?)
        `, [
            codigo,
            nombre,
            descripcion || null,
            Number(precio),
            Number(minutos)
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Servicio guardado correctamente',
            id_servicio: resultado.insertId
        });

    } catch (error) {
        errorServidor(res, 'Error al guardar el servicio', error);
    }
});

app.put('/api/servicios/:id', async (req, res) => {
    const { id } = req.params;

    const {
        codigo,
        nombre,
        descripcion,
        precio,
        duracion_minutos,
        duracion
    } = req.body;

    const minutos = duracion_minutos !== undefined
        ? duracion_minutos
        : duracion;

    if (!codigo || !nombre || !esNumeroPositivo(precio) ||
        !Number.isInteger(Number(minutos)) || Number(minutos) <= 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Complete los datos obligatorios del servicio'
        });
    }

    try {
        const [resultado] = await pool.query(`
            UPDATE servicios
            SET codigo = ?,
                nombre = ?,
                descripcion = ?,
                precio = ?,
                duracion_minutos = ?
            WHERE id_servicio = ?
        `, [
            codigo,
            nombre,
            descripcion || null,
            Number(precio),
            Number(minutos),
            id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Servicio no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Servicio actualizado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al actualizar el servicio', error);
    }
});

app.delete('/api/servicios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            'DELETE FROM servicios WHERE id_servicio = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Servicio no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Servicio eliminado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al eliminar el servicio', error);
    }
});

// ======================================
// CLIENTES - ADMINISTRACIÓN
// ======================================

app.get('/api/clientes', async (req, res) => {
    try {
        const [clientes] = await pool.query(`
            SELECT
                c.id_cliente,
                c.documento,
                u.id AS id_usuario,
                u.nombre,
                u.apellido,
                u.telefono,
                u.correo,
                u.cabello,
                u.cabello AS tipo_cabello
            FROM clientes c
            INNER JOIN usuarios u
                ON c.id_usuario = u.id
            WHERE u.rol = 'cliente'
            ORDER BY c.id_cliente DESC
        `);

        res.json({
            ok: true,
            clientes
        });

    } catch (error) {
        errorServidor(res, 'Error al obtener los clientes', error);
    }
});

app.post('/api/clientes-empresa', async (req, res) => {
    const {
        documento,
        nombre,
        apellido,
        telefono,
        correo,
        cabello
    } = req.body;

    if (!documento || !nombre || !apellido || !telefono ||
        !correo || !cabello) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Complete todos los campos'
        });
    }

    if (!['ondulado', 'rizo', 'afro'].includes(cabello)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El tipo de cabello no es válido'
        });
    }

    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const [usuarios] = await conexion.query(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        );

        if (usuarios.length === 0) {
            await conexion.rollback();

            return res.status(400).json({
                ok: false,
                mensaje: 'Primero debe registrarse el usuario con ese correo'
            });
        }

        const idUsuario = usuarios[0].id;

        const [clienteExistente] = await conexion.query(
            'SELECT id_cliente FROM clientes WHERE id_usuario = ?',
            [idUsuario]
        );

        if (clienteExistente.length > 0) {
            await conexion.rollback();

            return res.status(409).json({
                ok: false,
                mensaje: 'Este cliente ya está registrado'
            });
        }

        const [documentoExistente] = await conexion.query(
            'SELECT id_cliente FROM clientes WHERE documento = ?',
            [documento]
        );

        if (documentoExistente.length > 0) {
            await conexion.rollback();

            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe un cliente con ese documento'
            });
        }

        await conexion.query(`
            UPDATE usuarios
            SET nombre = ?,
                apellido = ?,
                telefono = ?,
                cabello = ?,
                rol = 'cliente'
            WHERE id = ?
        `, [nombre, apellido, telefono, cabello, idUsuario]);

        const [resultado] = await conexion.query(`
            INSERT INTO clientes (documento, id_usuario)
            VALUES (?, ?)
        `, [documento, idUsuario]);

        await conexion.commit();

        res.status(201).json({
            ok: true,
            mensaje: 'Cliente guardado correctamente',
            id_cliente: resultado.insertId
        });

    } catch (error) {
        await conexion.rollback();
        errorServidor(res, 'Error al guardar el cliente', error);
    } finally {
        conexion.release();
    }
});

app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;

    const {
        documento,
        nombre,
        apellido,
        telefono,
        correo,
        cabello
    } = req.body;

    if (!documento || !nombre || !apellido || !telefono ||
        !correo || !cabello) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Complete todos los campos'
        });
    }

    if (!['ondulado', 'rizo', 'afro'].includes(cabello)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El tipo de cabello no es válido'
        });
    }

    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const [clientes] = await conexion.query(`
            SELECT id_usuario
            FROM clientes
            WHERE id_cliente = ?
        `, [id]);

        if (clientes.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                ok: false,
                mensaje: 'Cliente no encontrado'
            });
        }

        const idUsuario = clientes[0].id_usuario;

        const [correoExistente] = await conexion.query(
            'SELECT id FROM usuarios WHERE correo = ? AND id <> ?',
            [correo, idUsuario]
        );

        if (correoExistente.length > 0) {
            await conexion.rollback();

            return res.status(409).json({
                ok: false,
                mensaje: 'Ese correo ya está registrado'
            });
        }

        await conexion.query(`
            UPDATE usuarios
            SET nombre = ?,
                apellido = ?,
                telefono = ?,
                correo = ?,
                cabello = ?
            WHERE id = ?
        `, [
            nombre, apellido, telefono, correo, cabello, idUsuario
        ]);

        await conexion.query(`
            UPDATE clientes
            SET documento = ?
            WHERE id_cliente = ?
        `, [documento, id]);

        await conexion.commit();

        res.json({
            ok: true,
            mensaje: 'Cliente actualizado correctamente'
        });

    } catch (error) {
        await conexion.rollback();
        errorServidor(res, 'Error al actualizar el cliente', error);
    } finally {
        conexion.release();
    }
});

app.delete('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            'DELETE FROM clientes WHERE id_cliente = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Cliente no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Cliente eliminado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al eliminar el cliente', error);
    }
});

// ======================================
// EMPLEADOS
// ======================================

app.get('/api/empleados', async (req, res) => {
    try {
        const [empleados] = await pool.query(`
            SELECT
                id_empleado,
                documento,
                nombre,
                apellido,
                correo,
                telefono,
                cargo
            FROM empleados
            ORDER BY id_empleado DESC
        `);

        res.json({
            ok: true,
            empleados
        });

    } catch (error) {
        errorServidor(res, 'Error al obtener empleados', error);
    }
});

app.post('/api/empleados', async (req, res) => {
    const {
        documento,
        nombre,
        apellido,
        telefono,
        correo,
        cargo
    } = req.body;

    if (!nombre || !apellido) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El nombre y apellido son obligatorios'
        });
    }

    try {
        if (documento) {
            const [documentoExistente] = await pool.query(
                'SELECT id_empleado FROM empleados WHERE documento = ?',
                [documento]
            );

            if (documentoExistente.length > 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'Ya existe un empleado con ese documento'
                });
            }
        }

        if (correo) {
            const [correoExistente] = await pool.query(
                'SELECT id_empleado FROM empleados WHERE correo = ?',
                [correo]
            );

            if (correoExistente.length > 0) {
                return res.status(409).json({
                    ok: false,
                    mensaje: 'Ya existe un empleado con ese correo'
                });
            }
        }

        const [resultado] = await pool.query(`
            INSERT INTO empleados
            (documento, nombre, apellido, correo, telefono, cargo)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            documento || null,
            nombre,
            apellido,
            correo || null,
            telefono || null,
            cargo || null
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Empleado guardado correctamente',
            id_empleado: resultado.insertId
        });

    } catch (error) {
        errorServidor(res, 'Error al guardar empleado', error);
    }
});

app.put('/api/empleados/:id', async (req, res) => {
    const { id } = req.params;

    const {
        documento,
        nombre,
        apellido,
        telefono,
        correo,
        cargo
    } = req.body;

    if (!nombre || !apellido) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El nombre y apellido son obligatorios'
        });
    }

    try {
        const [resultado] = await pool.query(`
            UPDATE empleados
            SET documento = ?,
                nombre = ?,
                apellido = ?,
                telefono = ?,
                correo = ?,
                cargo = ?
            WHERE id_empleado = ?
        `, [
            documento || null,
            nombre,
            apellido,
            telefono || null,
            correo || null,
            cargo || null,
            id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Empleado no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Empleado actualizado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al actualizar empleado', error);
    }
});

app.delete('/api/empleados/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            'DELETE FROM empleados WHERE id_empleado = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Empleado no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Empleado eliminado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al eliminar empleado', error);
    }
});

// ======================================
// CITAS
// ======================================
// Obtener las citas de un cliente específico
app.get('/api/citas/cliente/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [citas] = await pool.query(`
            SELECT
                c.id_cita,
                c.id_cliente,
                c.id_servicio,
                s.nombre AS servicio,
                DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
                TIME_FORMAT(c.hora, '%H:%i') AS hora,
                c.estado
            FROM citas c
            INNER JOIN clientes cl
                ON c.id_cliente = cl.id_cliente
            LEFT JOIN servicios s
                ON c.id_servicio = s.id_servicio
            WHERE cl.id_usuario = ?
            ORDER BY c.fecha DESC, c.hora DESC
        `, [id]);

        res.json({
            ok: true,
            citas
        });

    } catch (error) {
        errorServidor(res, 'Error al consultar las citas del cliente', error);
    }
});

app.get('/api/citas', async (req, res) => {
    try {
        const [citas] = await pool.query(`
            SELECT
                c.id_cita,
                c.id_cliente,
                c.id_servicio,
                CONCAT(u.nombre, ' ', u.apellido) AS cliente,
                s.nombre AS servicio,
                DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
                TIME_FORMAT(c.hora, '%H:%i') AS hora,
                c.estado
            FROM citas c
            INNER JOIN clientes cl
                ON c.id_cliente = cl.id_cliente
            INNER JOIN usuarios u
                ON cl.id_usuario = u.id
            LEFT JOIN servicios s
                ON c.id_servicio = s.id_servicio
            ORDER BY c.id_cita DESC
        `);

        res.json({
            ok: true,
            citas
        });

    } catch (error) {
        errorServidor(res, 'Error al obtener las citas', error);
    }
});

app.post('/api/citas', async (req, res) => {
    const {
        cliente,
        id_cliente,
        servicio,
        id_servicio,
        fecha,
        hora,
        estado
    } = req.body;

    if (!fecha || !hora) {
        return res.status(400).json({
            ok: false,
            mensaje: 'La fecha y la hora son obligatorias'
        });
    }

    try {
        let idCliente = id_cliente;
        let idServicio = id_servicio;

        if (!idCliente && cliente) {
            const [clientes] = await pool.query(`
                SELECT c.id_cliente
                FROM clientes c
                INNER JOIN usuarios u ON c.id_usuario = u.id
                WHERE CONCAT(u.nombre, ' ', u.apellido) = ?
                LIMIT 1
            `, [cliente]);

            if (clientes.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'No se encontró el cliente seleccionado'
                });
            }

            idCliente = clientes[0].id_cliente;
        }

        if (!idCliente) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Seleccione un cliente'
            });
        }

        if (!idServicio && servicio) {
            const [servicios] = await pool.query(
                'SELECT id_servicio FROM servicios WHERE nombre = ? LIMIT 1',
                [servicio]
            );

            if (servicios.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'No se encontró el servicio seleccionado'
                });
            }

            idServicio = servicios[0].id_servicio;
        }

        const [resultado] = await pool.query(`
            INSERT INTO citas
            (id_cliente, id_servicio, fecha, hora, estado)
            VALUES (?, ?, ?, ?, ?)
        `, [
            idCliente,
            idServicio || null,
            fecha,
            hora,
            estado || 'Pendiente'
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Cita guardada correctamente',
            id_cita: resultado.insertId
        });

    } catch (error) {
        errorServidor(res, 'Error al guardar la cita', error);
    }
});

app.put('/api/citas/:id', async (req, res) => {
    const { id } = req.params;

    const {
        cliente,
        id_cliente,
        servicio,
        id_servicio,
        fecha,
        hora,
        estado
    } = req.body;

    if (!fecha || !hora) {
        return res.status(400).json({
            ok: false,
            mensaje: 'La fecha y la hora son obligatorias'
        });
    }

    try {
        let idCliente = id_cliente;
        let idServicio = id_servicio;

        if (!idCliente && cliente) {
            const [clientes] = await pool.query(`
                SELECT c.id_cliente
                FROM clientes c
                INNER JOIN usuarios u ON c.id_usuario = u.id
                WHERE CONCAT(u.nombre, ' ', u.apellido) = ?
                LIMIT 1
            `, [cliente]);

            if (clientes.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'No se encontró el cliente'
                });
            }

            idCliente = clientes[0].id_cliente;
        }

        if (!idServicio && servicio) {
            const [servicios] = await pool.query(
                'SELECT id_servicio FROM servicios WHERE nombre = ? LIMIT 1',
                [servicio]
            );

            if (servicios.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'No se encontró el servicio'
                });
            }

            idServicio = servicios[0].id_servicio;
        }

        if (!idCliente) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Seleccione un cliente'
            });
        }

        const [resultado] = await pool.query(`
            UPDATE citas
            SET id_cliente = ?,
                id_servicio = ?,
                fecha = ?,
                hora = ?,
                estado = ?
            WHERE id_cita = ?
        `, [
            idCliente,
            idServicio || null,
            fecha,
            hora,
            estado || 'Pendiente',
            id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Cita no encontrada'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Cita actualizada correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al actualizar la cita', error);
    }
});

// Cancelar una cita sin eliminarla de MySQL
app.delete('/api/citas/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            `UPDATE citas
             SET estado = 'Cancelada'
             WHERE id_cita = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Cita no encontrada'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Cita cancelada correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al cancelar la cita', error);
    }
});

// ======================================
// PROVEEDORES
// ======================================

app.get('/api/proveedores', async (req, res) => {
    try {
        const [proveedores] = await pool.query(`
            SELECT
                id_proveedor,
                nombre,
                nombre AS empresa,
                contacto,
                telefono,
                correo
            FROM proveedores
            ORDER BY id_proveedor DESC
        `);

        res.json({
            ok: true,
            proveedores
        });

    } catch (error) {
        errorServidor(res, 'Error al obtener proveedores', error);
    }
});

app.post('/api/proveedores', async (req, res) => {
    const {
        nombre,
        empresa,
        contacto,
        telefono,
        correo
    } = req.body;

    const nombreProveedor = nombre || empresa;

    if (!nombreProveedor) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Ingrese el nombre del proveedor'
        });
    }

    try {
        const [resultado] = await pool.query(`
            INSERT INTO proveedores
            (nombre, contacto, telefono, correo)
            VALUES (?, ?, ?, ?)
        `, [
            nombreProveedor,
            contacto || null,
            telefono || null,
            correo || null
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Proveedor guardado correctamente',
            id_proveedor: resultado.insertId
        });

    } catch (error) {
        errorServidor(res, 'Error al guardar proveedor', error);
    }
});

app.put('/api/proveedores/:id', async (req, res) => {
    const { id } = req.params;

    const {
        nombre,
        empresa,
        contacto,
        telefono,
        correo
    } = req.body;

    const nombreProveedor = nombre || empresa;

    if (!nombreProveedor) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Ingrese el nombre del proveedor'
        });
    }

    try {
        const [resultado] = await pool.query(`
            UPDATE proveedores
            SET nombre = ?,
                contacto = ?,
                telefono = ?,
                correo = ?
            WHERE id_proveedor = ?
        `, [
            nombreProveedor,
            contacto || null,
            telefono || null,
            correo || null,
            id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Proveedor no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Proveedor actualizado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al actualizar proveedor', error);
    }
});

app.delete('/api/proveedores/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [resultado] = await pool.query(
            'DELETE FROM proveedores WHERE id_proveedor = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Proveedor no encontrado'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Proveedor eliminado correctamente'
        });

    } catch (error) {
        errorServidor(res, 'Error al eliminar proveedor', error);
    }
});

// ======================================
// COMPRAS
// ======================================

app.get('/api/compras', async (req, res) => {
    try {
        const [compras] = await pool.query(`
            SELECT
                c.id_compra,
                c.fecha,
                c.total,
                p.nombre AS proveedor,
                pr.nombre AS producto,
                dc.id_producto,
                dc.cantidad,
                dc.precio_unitario,
                (dc.cantidad * dc.precio_unitario) AS subtotal
            FROM compras c
            LEFT JOIN proveedores p
                ON c.id_proveedor = p.id_proveedor
            LEFT JOIN detalle_compras dc
                ON c.id_compra = dc.id_compra
            LEFT JOIN productos pr
                ON dc.id_producto = pr.id_producto
            ORDER BY c.id_compra DESC
        `);

        res.json({
            ok: true,
            compras
        });

    } catch (error) {
        errorServidor(res, 'Error al obtener compras', error);
    }
});

app.post('/api/compras', async (req, res) => {
    const {
        id_proveedor,
        id_producto,
        cantidad,
        precio_unitario,
        fecha
    } = req.body;

    if (!id_producto || !esNumeroPositivo(cantidad) ||
        !esNumeroPositivo(precio_unitario)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Complete los datos de la compra'
        });
    }

    if (!Number.isInteger(Number(cantidad))) {
        return res.status(400).json({
            ok: false,
            mensaje: 'La cantidad debe ser un número entero'
        });
    }

    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const [productos] = await conexion.query(
            'SELECT id_producto FROM productos WHERE id_producto = ?',
            [id_producto]
        );

        if (productos.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                ok: false,
                mensaje: 'Producto no encontrado'
            });
        }

        const subtotal = Number(cantidad) * Number(precio_unitario);
        const fechaCompra = fecha || new Date().toISOString().slice(0, 10);

        const [compra] = await conexion.query(`
            INSERT INTO compras (id_proveedor, fecha, total)
            VALUES (?, ?, ?)
        `, [
            id_proveedor || null,
            fechaCompra,
            subtotal
        ]);

        await conexion.query(`
            INSERT INTO detalle_compras
            (id_compra, id_producto, cantidad, precio_unitario)
            VALUES (?, ?, ?, ?)
        `, [
            compra.insertId,
            id_producto,
            Number(cantidad),
            Number(precio_unitario)
        ]);

        await conexion.query(`
            UPDATE productos
            SET stock = stock + ?
            WHERE id_producto = ?
        `, [Number(cantidad), id_producto]);

        const [inventario] = await conexion.query(
            'SELECT id_inventario FROM inventario WHERE id_producto = ?',
            [id_producto]
        );

        if (inventario.length > 0) {
            await conexion.query(`
                UPDATE inventario
                SET cantidad = cantidad + ?
                WHERE id_producto = ?
            `, [Number(cantidad), id_producto]);
        } else {
            await conexion.query(`
                INSERT INTO inventario (id_producto, cantidad)
                VALUES (?, ?)
            `, [id_producto, Number(cantidad)]);
        }

        await conexion.commit();

        res.status(201).json({
            ok: true,
            mensaje: 'Compra guardada correctamente',
            id_compra: compra.insertId
        });

    } catch (error) {
        await conexion.rollback();
        errorServidor(res, 'Error al guardar la compra', error);
    } finally {
        conexion.release();
    }
});

// ======================================
// VENTAS
// ======================================


// ======================================
// VENTAS
// ======================================

// Consultar todas las ventas
app.get('/api/ventas', async (req, res) => {
    try {
        const [ventas] = await pool.query(`
            SELECT
                v.id_venta,
                v.fecha,
                v.total,
                CONCAT(u.nombre, ' ', u.apellido) AS cliente,
                p.nombre AS producto,
                dv.id_producto,
                dv.cantidad,
                dv.precio_unitario,
                (dv.cantidad * dv.precio_unitario) AS subtotal
            FROM ventas v
            LEFT JOIN clientes c
                ON v.id_cliente = c.id_cliente
            LEFT JOIN usuarios u
                ON c.id_usuario = u.id
            LEFT JOIN detalle_ventas dv
                ON v.id_venta = dv.id_venta
            LEFT JOIN productos p
                ON dv.id_producto = p.id_producto
            ORDER BY v.id_venta DESC
        `);

        res.json({ ok: true, ventas });

    } catch (error) {
        errorServidor(res, 'Error al obtener ventas', error);
    }
});

// Consultar las compras de un cliente
app.get('/api/ventas/cliente/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [compras] = await pool.query(`
            SELECT
                v.id_venta,
                DATE_FORMAT(v.fecha, '%Y-%m-%d') AS fecha,
                v.total,
                p.nombre AS producto,
                dv.id_producto,
                dv.cantidad,
                dv.precio_unitario AS precio,
                (dv.cantidad * dv.precio_unitario) AS subtotal
            FROM ventas v
            INNER JOIN clientes c
                ON v.id_cliente = c.id_cliente
            INNER JOIN detalle_ventas dv
                ON v.id_venta = dv.id_venta
            INNER JOIN productos p
                ON dv.id_producto = p.id_producto
            WHERE c.id_usuario = ?
            ORDER BY v.id_venta DESC
        `, [id]);

        res.json({
            ok: true,
            compras
        });

    } catch (error) {
        errorServidor(res, 'Error al consultar las compras del cliente', error);
    }
});

// Registrar una venta con varios productos
app.post('/api/ventas', async (req, res) => {
    const { id_usuario, id_cliente, productos } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'El carrito está vacío'
        });
    }

    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        // Obtener el cliente relacionado con el usuario
        let idCliente = id_cliente;

        if (!idCliente && id_usuario) {
            const [clientes] = await conexion.query(
                'SELECT id_cliente FROM clientes WHERE id_usuario = ?',
                [id_usuario]
            );

            if (clientes.length === 0) {
                await conexion.rollback();

                return res.status(404).json({
                    ok: false,
                    mensaje: 'No se encontró el cliente'
                });
            }

            idCliente = clientes[0].id_cliente;
        }

        if (!idCliente) {
            await conexion.rollback();

            return res.status(400).json({
                ok: false,
                mensaje: 'No se identificó el cliente'
            });
        }

        // Agrupar productos repetidos y validar cantidades
        const cantidades = new Map();

        for (const item of productos) {
            const idProducto = Number(item.id_producto);
            const cantidad = Number(item.cantidad);

            if (
                !Number.isInteger(idProducto) ||
                idProducto <= 0 ||
                !Number.isInteger(cantidad) ||
                cantidad <= 0
            ) {
                await conexion.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Hay productos o cantidades no válidas'
                });
            }

            cantidades.set(
                idProducto,
                (cantidades.get(idProducto) || 0) + cantidad
            );
        }

        let total = 0;
        const detalles = [];

        // Consultar precios y comprobar existencias directamente en MySQL
        for (const [idProducto, cantidad] of cantidades) {
            const [productosEncontrados] = await conexion.query(`
                SELECT id_producto, nombre, precio, stock
                FROM productos
                WHERE id_producto = ?
                FOR UPDATE
            `, [idProducto]);

            if (productosEncontrados.length === 0) {
                await conexion.rollback();

                return res.status(404).json({
                    ok: false,
                    mensaje: `El producto con ID ${idProducto} no existe`
                });
            }

            const producto = productosEncontrados[0];

            if (Number(producto.stock) < cantidad) {
                await conexion.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje: `No hay suficiente existencia de ${producto.nombre}. Disponible: ${producto.stock}`
                });
            }

            const precio = Number(producto.precio);
            const subtotal = precio * cantidad;

            total += subtotal;

            detalles.push({
                id_producto: idProducto,
                cantidad,
                precio,
                subtotal
            });
        }

        // Crear el registro principal de la venta
        const [venta] = await conexion.query(`
            INSERT INTO ventas (id_cliente, fecha, total)
            VALUES (?, CURDATE(), ?)
        `, [idCliente, total]);

        // Guardar cada producto y descontar su inventario
        for (const detalle of detalles) {
            await conexion.query(`
                INSERT INTO detalle_ventas
                (id_venta, id_producto, cantidad, precio_unitario)
                VALUES (?, ?, ?, ?)
            `, [
                venta.insertId,
                detalle.id_producto,
                detalle.cantidad,
                detalle.precio
            ]);

            await conexion.query(`
                UPDATE productos
                SET stock = stock - ?
                WHERE id_producto = ?
            `, [
                detalle.cantidad,
                detalle.id_producto
            ]);

            await conexion.query(`
                UPDATE inventario
                SET cantidad = GREATEST(cantidad - ?, 0)
                WHERE id_producto = ?
            `, [
                detalle.cantidad,
                detalle.id_producto
            ]);
        }

        await conexion.commit();

        res.status(201).json({
            ok: true,
            mensaje: 'Compra realizada correctamente',
            id_venta: venta.insertId,
            total
        });

    } catch (error) {
        await conexion.rollback();
        errorServidor(res, 'Error al registrar la venta', error);
    } finally {
        conexion.release();
    }
});

// ======================================
// INICIAR SERVIDOR
// ======================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Glow Curl App ejecutándose en el puerto ${PORT}`);
});
