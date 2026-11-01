const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaCerrarSesion() {

    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {

        // Abrir login
        await driver.get(
            "http://127.0.0.1:5500/pages/auth/loginCliente.html"
        );

        await driver.wait(
            until.elementLocated(By.id("usuarioCliente")),
            5000
        );

        console.log("Página de login cargada.");

        // Crear usuario de prueba
        await driver.executeScript(`
            localStorage.setItem("usuarios", JSON.stringify([
                {
                    nombre: "Prueba",
                    apellido: "Selenium",
                    correo: "selenium011@gmail.com",
                    telefono: "3000000000",
                    cabello: "Rizado",
                    password: "Prueba123!"
                }
            ]));
        `);

        console.log("Usuario de prueba creado.");

        // Ingresar correo
        await driver.findElement(By.id("usuarioCliente"))
            .sendKeys("selenium011@gmail.com");

        // Ingresar contraseña
        await driver.findElement(By.id("passwordCliente"))
            .sendKeys("Prueba123!");

        // Presionar iniciar sesión
        await driver.findElement(
            By.xpath("//button[contains(text(),'Iniciar sesión')]")
        ).click();

        // Esperar que cargue la página del cliente
        await driver.wait(
            until.urlContains("inicioCliente.html"),
            5000
        );

        console.log("Inicio de sesión realizado correctamente.");

        // Verificar que exista usuarioActual
        let usuarioActual = await driver.executeScript(`
            return localStorage.getItem("usuarioActual");
        `);

        console.log(
            "Usuario actual antes de cerrar sesión:",
            usuarioActual
        );

        // Buscar botón de cerrar sesión
        let botonCerrar = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//*[contains(text(),'Cerrar sesión') or contains(text(),'Cerrar Sesión')]"
                )
            ),
            5000
        );

        await botonCerrar.click();

        console.log("Botón Cerrar sesión presionado.");

        // Esperar regreso al login
        await driver.wait(
            until.urlContains("loginCliente.html"),
            5000
        );

        // Verificar que usuarioActual haya sido eliminado
        let usuarioDespues = await driver.executeScript(`
            return localStorage.getItem("usuarioActual");
        `);

        console.log(
            "Usuario actual después de cerrar sesión:",
            usuarioDespues
        );

        if (usuarioDespues === null) {

            console.log(
                "Cierre de sesión validado correctamente."
            );

        } else {

            console.log(
                "La sesión no se cerró correctamente."
            );

        }

        // Captura
        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso011.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso011.png"
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

pruebaCerrarSesion();