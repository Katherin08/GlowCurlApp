
const bcrypt = require('bcryptjs');

const ROUNDS = 12;

// Generar un hash seguro para una contraseña
async function hashPassword(password) {
    if (typeof password !== 'string' || !password.trim()) {
        throw new Error('La contraseña es obligatoria');
    }

    return await bcrypt.hash(password, ROUNDS);
}

// Verificar una contraseña
async function verifyPassword(password, storedPassword) {
    if (
        typeof password !== 'string' ||
        typeof storedPassword !== 'string'
    ) {
        return {
            valid: false,
            needsRehash: false
        };
    }

    // Comprobar si ya está almacenada como hash bcrypt
    const esHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);

    if (esHash) {
        const valid = await bcrypt.compare(
            password,
            storedPassword
        );

        return {
            valid,
            needsRehash: false
        };
    }

    // Compatibilidad temporal con contraseñas antiguas
    const valid = password === storedPassword;

    return {
        valid,
        needsRehash: valid
    };
}

module.exports = {
    hashPassword,
    verifyPassword
};
