// Valida que el nombre tenga información
function validarNombre(nombre) {
    return nombre.trim() !== "";
}

// Valida que un campo no esté vacío
function validarCampo(campo) {
    return campo.trim() !== "";
}

// Valida que el correo tenga un formato básico válido
function validarCorreo(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

module.exports = {
    validarNombre,
    validarCampo,
    validarCorreo
};