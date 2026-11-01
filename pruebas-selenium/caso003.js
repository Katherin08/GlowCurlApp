const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaCamposObligatorios() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "http://127.0.0.1:5500/pages/auth/registroCliente.html"
        );

        await driver.wait(
            until.elementLocated(By.id("nombre")),
            5000
        );

        // No se diligencian los campos.
        // Se presiona directamente el botón Registrarse.

        await driver.findElement(By.css("button"))
            .click();

        // Esperar la alerta de validación
        let alerta = await driver.wait(
            until.alertIsPresent(),
            5000
        );

        let textoAlerta = await alerta.getText();

        console.log("Mensaje recibido:", textoAlerta);

        if (textoAlerta === "Complete todos los campos") {

            console.log("Validación de campos obligatorios correcta.");

        } else {

            console.log("La validación no coincide con el resultado esperado.");

        }

        await alerta.accept();

        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso003.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso003.png"
        );

    } catch (error) {

        console.log("Error en la prueba:", error.message);

    } finally {

        await driver.quit();

    }
}

pruebaCamposObligatorios();