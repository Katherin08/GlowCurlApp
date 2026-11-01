const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaLoginCamposVacios() {

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

        // Dejar los campos vacíos
        await driver.findElement(
            By.id("usuarioCliente")
        ).clear();

        await driver.findElement(
            By.id("passwordCliente")
        ).clear();

        console.log("Campos dejados vacíos.");

        // Presionar Iniciar sesión
        await driver.findElement(
            By.xpath("//button[contains(text(),'Iniciar sesión')]")
        ).click();

        // Esperar alerta
        let alerta = await driver.wait(
            until.alertIsPresent(),
            5000
        );

        let textoAlerta = await alerta.getText();

        console.log("Mensaje recibido:", textoAlerta);

        if (
            textoAlerta === "Ingrese usuario y contraseña"
        ) {

            console.log(
                "Validación de campos vacíos correcta."
            );

        } else {

            console.log(
                "La validación no coincide con el resultado esperado."
            );

        }

        await alerta.accept();

        // Captura de evidencia
        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso008.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso008.png"
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

pruebaLoginCamposVacios();
