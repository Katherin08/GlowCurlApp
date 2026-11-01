const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaRegistroCliente() {

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
            .sendKeys("katherin.prueba2026@gmail.com");

        await driver.findElement(By.id("telefono"))
            .sendKeys("3001234567");

        await driver.findElement(By.id("cabello"))
            .sendKeys("Rizado");

        await driver.findElement(By.id("password"))
            .sendKeys("Prueba123!");

        await driver.findElement(By.id("confirmar"))
            .sendKeys("Prueba123!");

        await driver.findElement(By.css("button"))
            .click();

        let alerta = await driver.wait(
            until.alertIsPresent(),
            5000
        );

        let textoAlerta = await alerta.getText();

        console.log("Mensaje recibido:", textoAlerta);

        await alerta.accept();

        console.log("Registro realizado correctamente.");

        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso002.png",
            imagen,
            "base64"
        );

        console.log("Captura guardada como evidencia-caso002.png");

    } catch (error) {

        console.log("Error en la prueba:", error.message);

    } finally {

        await driver.quit();

    }
}

pruebaRegistroCliente();