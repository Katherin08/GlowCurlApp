const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaMostrarOcultarPassword() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "http://127.0.0.1:5500/pages/auth/loginCliente.html"
        );

        await driver.wait(
            until.elementLocated(By.id("passwordCliente")),
            5000
        );

        console.log("Página de login cargada.");

        // Escribir contraseña
        await driver.findElement(
            By.id("passwordCliente")
        ).sendKeys("Prueba123!");

        console.log("Contraseña ingresada.");

        // Comprobar que inicialmente esté oculta
        let tipoInicial = await driver.findElement(
            By.id("passwordCliente")
        ).getAttribute("type");

        console.log(
            "Tipo inicial del campo:",
            tipoInicial
        );

        if (tipoInicial === "password") {

            console.log(
                "La contraseña está oculta correctamente."
            );

        } else {

            console.log(
                "La contraseña no está oculta inicialmente."
            );

        }

        // Buscar el checkbox de Mostrar contraseña
        let checkbox = await driver.findElement(
            By.css("input[type='checkbox']")
        );

        // Marcar checkbox
        await checkbox.click();

        console.log(
            "Opción Mostrar contraseña activada."
        );

        // Comprobar que ahora sea visible
        let tipoVisible = await driver.findElement(
            By.id("passwordCliente")
        ).getAttribute("type");

        console.log(
            "Tipo después de mostrar:",
            tipoVisible
        );

        if (tipoVisible === "text") {

            console.log(
                "Mostrar contraseña funciona correctamente."
            );

        } else {

            console.log(
                "Mostrar contraseña no funciona correctamente."
            );

        }

        // Desmarcar checkbox
        await checkbox.click();

        console.log(
            "Opción Mostrar contraseña desactivada."
        );

        // Comprobar que vuelva a ocultarse
        let tipoOculto = await driver.findElement(
            By.id("passwordCliente")
        ).getAttribute("type");

        console.log(
            "Tipo después de ocultar:",
            tipoOculto
        );

        if (tipoOculto === "password") {

            console.log(
                "Ocultar contraseña funciona correctamente."
            );

        } else {

            console.log(
                "La contraseña no volvió a ocultarse."
            );

        }

        // Captura de evidencia
        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso010.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso010.png"
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

pruebaMostrarOcultarPassword();