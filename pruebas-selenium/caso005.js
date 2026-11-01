const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaCorreoDuplicado() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        // ==========================
        // PRIMER REGISTRO
        // ==========================

        await driver.get(
            "http://127.0.0.1:5500/pages/auth/registroCliente.html"
        );

        await driver.wait(
            until.elementLocated(By.id("nombre")),
            5000
        );

        await driver.findElement(By.id("nombre"))
            .sendKeys("Cliente");

        await driver.findElement(By.id("apellido"))
            .sendKeys("Prueba");

        await driver.findElement(By.id("correo"))
            .sendKeys("duplicado005@gmail.com");

        await driver.findElement(By.id("telefono"))
            .sendKeys("3005555555");

        await driver.findElement(By.id("cabello"))
            .sendKeys("Rizado");

        await driver.findElement(By.id("password"))
            .sendKeys("Prueba123!");

        await driver.findElement(By.id("confirmar"))
            .sendKeys("Prueba123!");

        await driver.findElement(By.css("button"))
            .click();

        // Esperar alerta del primer registro

        let alerta = await driver.wait(
            until.alertIsPresent(),
            5000
        );

        console.log(
            "Primer registro:",
            await alerta.getText()
        );

        await alerta.accept();

        // Esperar que vuelva al login

        await driver.sleep(1000);

        // ==========================
        // SEGUNDO REGISTRO
        // ==========================

        await driver.get(
            "http://127.0.0.1:5500/pages/auth/registroCliente.html"
        );

        await driver.wait(
            until.elementLocated(By.id("nombre")),
            5000
        );

        await driver.findElement(By.id("nombre"))
            .sendKeys("Otro");

        await driver.findElement(By.id("apellido"))
            .sendKeys("Cliente");

        await driver.findElement(By.id("correo"))
            .sendKeys("duplicado005@gmail.com");

        await driver.findElement(By.id("telefono"))
            .sendKeys("3006666666");

        await driver.findElement(By.id("cabello"))
            .sendKeys("Afro");

        await driver.findElement(By.id("password"))
            .sendKeys("Prueba456!");

        await driver.findElement(By.id("confirmar"))
            .sendKeys("Prueba456!");

        await driver.findElement(By.css("button"))
            .click();

        // Esperar segunda alerta

        alerta = await driver.wait(
            until.alertIsPresent(),
            5000
        );

        let textoAlerta = await alerta.getText();

        console.log(
            "Mensaje recibido:",
            textoAlerta
        );

        if (
            textoAlerta ===
            "Ya existe un usuario con ese correo."
        ) {

            console.log(
                "Validación de correo duplicado correcta."
            );

        } else {

            console.log(
                "La validación no coincide con el resultado esperado."
            );

        }

        await alerta.accept();

        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso005.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso005.png"
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

pruebaCorreoDuplicado();