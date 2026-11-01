const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaContraseñasDiferentes() {

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

        await driver.findElement(By.id("nombre"))
            .sendKeys("Katherin");

        await driver.findElement(By.id("apellido"))
            .sendKeys("Villegas");

        await driver.findElement(By.id("correo"))
            .sendKeys("prueba004@gmail.com");

        await driver.findElement(By.id("telefono"))
            .sendKeys("3001234567");

        await driver.findElement(By.id("cabello"))
            .sendKeys("Rizado");

        // Contraseña
        await driver.findElement(By.id("password"))
            .sendKeys("Prueba123!");

        // Contraseña diferente
        await driver.findElement(By.id("confirmar"))
            .sendKeys("Prueba456!");

        await driver.findElement(By.css("button"))
            .click();

        let alerta = await driver.wait(
            until.alertIsPresent(),
            5000
        );

        let textoAlerta = await alerta.getText();

        console.log("Mensaje recibido:", textoAlerta);

        if (textoAlerta === "Las contraseñas no coinciden") {

            console.log(
                "Validación de contraseñas correcta."
            );

        } else {

            console.log(
                "La validación no coincide con el resultado esperado."
            );

        }

        await alerta.accept();

        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso004.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso004.png"
        );

    } catch (error) {

        console.log("Error en la prueba:", error.message);

    } finally {

        await driver.quit();

    }
}

pruebaContraseñasDiferentes();