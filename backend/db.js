const mysql = require('mysql2/promise');

// Variables de Railway o configuración local
const host = process.env.MYSQLHOST || process.env.DB_HOST;
const user = process.env.MYSQLUSER || process.env.DB_USER;
const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD;
const database = process.env.MYSQLDATABASE || process.env.DB_NAME;
const port = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);

if (!host || !user || !database) {
    throw new Error('Faltan variables de conexión MySQL');
}

const esLocal = ['localhost', '127.0.0.1'].includes(host);

const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: esLocal ? undefined : {
        rejectUnauthorized: false
    }
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('¡Conexión exitosa a MySQL!');
        connection.release();
    } catch (error) {
        console.error('Error al conectar a MySQL:', error.message);
    }
})();

module.exports = pool;