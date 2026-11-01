const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaReservarCita() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        // 1. Abrir login
        await driver.get(
            "http://127.0.0.1:5500/pages/auth/loginCliente.html"
        );

        await driver.wait(
            until.elementLocated(By.id("usuarioCliente")),
            5000
        );

        console.log("Página de login cargada.");

        // 2. Crear usuario de prueba
        await driver.executeScript(`
            localStorage.setItem("usuarios", JSON.stringify([
                {
                    nombre: "Prueba",
                    apellido: "Selenium",
                    correo: "selenium014@gmail.com",
                    telefono: "3000000000",
                    cabello: "Rizado",
                    password: "Prueba123!"
                }
            ]));
        `);

        console.log("Usuario de prueba creado.");

        // 3. Ingresar correo
        await driver.findElement(
            By.id("usuarioCliente")
        ).sendKeys("selenium014@gmail.com");

        // 4. Ingresar contraseña
        await driver.findElement(
            By.id("passwordCliente")
        ).sendKeys("Prueba123!");

        // 5. Iniciar sesión
        await driver.findElement(
            By.xpath("//button[contains(text(),'Iniciar sesión')]")
        ).click();

        // 6. Esperar página del cliente
        await driver.wait(
            until.urlContains("inicioCliente.html"),
            5000
        );

        console.log("Inicio de sesión realizado correctamente.");

        // 7. Ir a servicios
        await driver.get(
            "http://127.0.0.1:5500/pages/cliente/serviciosCliente.html"
        );

        await driver.wait(
            until.elementLocated(By.id("fecha1")),
            5000
        );

        console.log("Página de servicios cargada.");

        // 8. Buscar campos de fecha
        let fechas = await driver.findElements(
            By.css("input[type='date']")
        );

        console.log(
            "Campos de fecha encontrados:",
            fechas.length
        );

        // 9. Buscar campos de hora
        let horas = await driver.findElements(
            By.css("select[id^='hora']")
        );

        console.log(
            "Campos de hora encontrados:",
            horas.length
        );

        // 10. Seleccionar fecha futura
        let fecha = fechas[0];

        await fecha.sendKeys("2026-09-17");

        console.log(
            "Fecha seleccionada: 2026-09-17"
        );

        // 11. Seleccionar hora
        let hora = horas[0];

        await hora.findElement(
            By.xpath(".//option[contains(text(),'10:00 AM')]")
        ).click();

        console.log(
            "Hora seleccionada: 10:00 AM"
        );

        // 12. Buscar botones de reservar
        let botones = await driver.findElements(
            By.xpath("//button[contains(text(),'Reservar')]")
        );

        console.log(
            "Botones de reservar encontrados:",
            botones.length
        );

        // 13. Presionar reservar
        await botones[0].click();

        console.log(
            "Botón Reservar presionado."
        );

        // 14. Aceptar el alert
        try {

            await driver.wait(
                until.alertIsPresent(),
                3000
            );

            let alerta = await driver.switchTo().alert();

            console.log(
                "Mensaje recibido:",
                await alerta.getText()
            );

            await alerta.accept();

            console.log(
                "Alerta aceptada correctamente."
            );

        } catch (error) {

            console.log(
                "No apareció alerta."
            );
        }

        // 15. Verificar que la cita se haya guardado
        let citas = await driver.executeScript(`
            return localStorage.getItem("citas");
        `);

        console.log(
            "Citas guardadas:",
            citas
        );

        if (citas !== null) {

            console.log(
                "La cita fue almacenada correctamente."
            );

        } else {

            console.log(
                "La cita no fue almacenada."
            );
        }

        // 16. Captura
        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso014.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso014.png"
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

pruebaReservarCita();