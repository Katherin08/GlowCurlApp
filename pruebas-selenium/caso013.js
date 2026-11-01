const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaReservarSinSesion() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        await driver.get(
            "http://127.0.0.1:5500/pages/cliente/serviciosCliente.html"
        );

        console.log("Página de servicios cargada.");

        // Asegurar que no exista una sesión
        await driver.executeScript(`
            localStorage.removeItem("usuarioActual");
        `);

        console.log("Sesión eliminada.");

        await driver.navigate().refresh();

        // Buscar botones de reserva
        let botones = await driver.findElements(
            By.xpath("//button[contains(@onclick,'reservar')]")
        );

        console.log(
            "Botones de reserva encontrados:",
            botones.length
        );

        if (botones.length === 0) {

            console.log(
                "No se encontraron botones de reserva."
            );

        } else {

            // Presionar el primer botón de reserva
            await botones[0].click();

            console.log(
                "Botón de reservar presionado."
            );

            // Esperar alerta
            let alerta = await driver.wait(
                until.alertIsPresent(),
                5000
            );

            let textoAlerta = await alerta.getText();

            console.log(
                "Mensaje recibido:",
                textoAlerta
            );

            if (textoAlerta === "Debe iniciar sesión.") {

                console.log(
                    "Validación de reserva sin sesión correcta."
                );

            } else {

                console.log(
                    "La validación no coincide con el resultado esperado."
                );

            }

            await alerta.accept();
        }

        // Captura
        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso013.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso013.png"
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

pruebaReservarSinSesion();