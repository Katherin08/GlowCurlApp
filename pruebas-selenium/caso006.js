const { Builder, By, until } = require("selenium-webdriver");

const fs = require("fs");

async function pruebaLoginCliente() {

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

        await driver.findElement(By.id("usuarioCliente"))
            .sendKeys("katherin.prueba2026@gmail.com");

        await driver.findElement(By.id("passwordCliente"))
            .sendKeys("Prueba123!");

        await driver.findElement(By.css("button"))
            .click();

        await driver.wait(
            until.urlContains("inicioCliente.html"),
            5000
        );

        console.log("Inicio de sesión realizado correctamente.");

        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso006.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso006.png"
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

pruebaLoginCliente();