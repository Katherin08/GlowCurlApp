const { Builder, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaAccesoSinSesion() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        // Abrir directamente la página de inicio del cliente
        await driver.get(
            "http://127.0.0.1:5500/pages/cliente/inicioCliente.html"
        );

        console.log("Página de inicio del cliente abierta directamente.");

        // Esperar unos segundos para que cargue la página
        await driver.sleep(1000);

        // Verificar usuario actual
        let usuarioActual = await driver.executeScript(`
            return localStorage.getItem("usuarioActual");
        `);

        console.log(
            "Usuario actual:",
            usuarioActual
        );

        // Verificar URL actual
        let urlActual = await driver.getCurrentUrl();

        console.log(
            "URL actual:",
            urlActual
        );

        if (usuarioActual === null) {

            console.log(
                "No existe una sesión activa."
            );

        } else {

            console.log(
                "Existe una sesión activa."
            );

        }

        // Captura de evidencia
        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso012.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso012.png"
        );

    } catch (error) {

        console.log(
            "Error en la prueba:",
            error.message
        );

    } finally {

        await driver.quit();

    }
}

pruebaAccesoSinSesion();