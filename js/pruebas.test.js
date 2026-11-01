const {
    validarNombre,
    validarCampo,
    validarCorreo
} = require("./pruebas");

// Prueba 1: nombre válido
test("Debe aceptar un nombre válido", () => {
    expect(validarNombre("Katherin")).toBe(true);
});

// Prueba 2: campo vacío
test("Debe rechazar un campo vacío", () => {
    expect(validarCampo("")).toBe(false);
});

// Prueba 3: correo válido
test("Debe aceptar un correo válido", () => {
    expect(validarCorreo("correo@gmail.com")).toBe(true);
});
// Prueba 4: correo inválido
test("Debe rechazar un correo inválido", () => {
    expect(validarCorreo("correo")).toBe(false);
});