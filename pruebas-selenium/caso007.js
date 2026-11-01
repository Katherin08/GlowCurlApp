const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaLoginPasswordIncorrecta() {

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

        // Crear usuario de prueba
        await driver.executeScript(`
            localStorage.setItem("usuarios", JSON.stringify([
                {
                    nombre: "Prueba",
                    apellido: "Selenium",
                    correo: "selenium007@gmail.com",
                    telefono: "3000000000",
                    cabello: "Rizado",
                    password: "Prueba123!"
                }
            ]));

            localStorage.removeItem("usuarioActual");
        `);

        console.log("Usuario de prueba creado.");

        // Recargar la página
        await driver.navigate().refresh();

        await driver.wait(
            until.elementLocated(By.id("usuarioCliente")),
            5000
        );

        // Correo correcto
        await driver.findElement(
            By.id("usuarioCliente")
        ).sendKeys("selenium007@gmail.com");

        // Contraseña INCORRECTA
        await driver.findElement(
            By.id("passwordCliente")
        ).sendKeys("ContraseñaIncorrecta");

        console.log("Datos ingresados.");

        // Clic en Iniciar sesión
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
            textoAlerta === "Correo o contraseña incorrectos"
        ) {

            console.log(
                "Validación de contraseña incorrecta correcta."
            );

        } else {

            console.log(
                "La validación no coincide con el resultado esperado."
            );

        }

        await alerta.accept();

        // Captura
        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso007.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso007.png"
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

pruebaLoginPasswordIncorrecta();