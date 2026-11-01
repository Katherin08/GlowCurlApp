const mysql = require('mysql2/promise'); // <--- ¡Asegúrate de agregar el /promise aquí!

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'glow_curl_db',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificación de conexión rápida al iniciar
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('¡Conectado exitosamente a la base de datos de Glow Curl App! ID de conexión:', connection.threadId);
        connection.release();
    } catch (err) {
        console.error('Error al conectar a la base de datos MySQL:', err.message);
    }
})();

module.exports = pool;
