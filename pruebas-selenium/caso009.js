const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaLimpiarLogin() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "http://127.0.0.1:5500/pages/auth/loginCliente.html"
        );

        await driver.wait(
            until.elementLocated(By.id("usuarioCliente")),
            5000
        );

        console.log("Página de login cargada.");

        // Ingresar datos de prueba
        await driver.findElement(
            By.id("usuarioCliente")
        ).sendKeys("selenium009@gmail.com");

        await driver.findElement(
            By.id("passwordCliente")
        ).sendKeys("Prueba123!");

        console.log("Datos ingresados.");

        // Presionar botón Limpiar
        await driver.findElement(
            By.xpath("//button[contains(text(),'Limpiar')]")
        ).click();

        console.log("Botón Limpiar presionado.");

        // Obtener valores después de limpiar
        let usuario = await driver.findElement(
            By.id("usuarioCliente")
        ).getAttribute("value");

        let password = await driver.findElement(
            By.id("passwordCliente")
        ).getAttribute("value");

        console.log("Correo después de limpiar:", usuario);
        console.log("Contraseña después de limpiar:", password);

        if (usuario === "" && password === "") {

            console.log(
                "Validación del botón Limpiar correcta."
            );

        } else {

            console.log(
                "La validación del botón Limpiar no coincide con el resultado esperado."
            );

        }

        // Captura de evidencia
        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso009.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso009.png"
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

pruebaLimpiarLogin();
