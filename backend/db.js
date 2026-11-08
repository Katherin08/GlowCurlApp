
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('¡Conectado exitosamente a MySQL de Railway!');
        connection.release();
    } catch (err) {
        console.error('Error al conectar a MySQL:', err.message);
    }
})();

module.exports = pool;