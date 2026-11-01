const { Builder, By, until } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaMisCitas() {

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
                    correo: "selenium015@gmail.com",
                    telefono: "3000000000",
                    cabello: "Rizado",
                    password: "Prueba123!"
                }
            ]));

            localStorage.setItem("citas", JSON.stringify([
                {
                    id: 1501,
                    correo: "selenium015@gmail.com",
                    servicio: "Corte para Rizos",
                    fecha: "2026-09-17",
                    hora: "10:00 AM",
                    estado: "Pendiente"
                }
            ]));
        `);

        console.log("Usuario y cita de prueba creados.");

        // 3. Ingresar correo
        await driver.findElement(
            By.id("usuarioCliente")
        ).sendKeys("selenium015@gmail.com");

        // 4. Ingresar contraseña
        await driver.findElement(
            By.id("passwordCliente")
        ).sendKeys("Prueba123!");

        // 5. Iniciar sesión
        await driver.findElement(
            By.xpath("//button[contains(text(),'Iniciar sesión')]")
        ).click();

        // 6. Esperar página principal
        await driver.wait(
            until.urlContains("inicioCliente.html"),
            5000
        );

        console.log(
            "Inicio de sesión realizado correctamente."
        );

        // 7. Abrir Mis citas
        await driver.get(
            "http://127.0.0.1:5500/pages/cliente/citasCliente.html"
        );

        await driver.sleep(1000);

        console.log(
            "Página Mis citas cargada."
        );

        // 8. Buscar contenido relacionado con la cita
        let pagina = await driver.findElement(
            By.tagName("body")
        ).getText();

        console.log(
            "Contenido de la página:"
        );

        console.log(pagina);

        // 9. Verificar que aparezca el servicio
        if (pagina.includes("Corte para Rizos")) {

            console.log(
                "La cita aparece correctamente en Mis citas."
            );

        } else {

            console.log(
                "La cita no aparece en Mis citas."
            );
        }

        // 10. Captura
        const imagen = await driver.takeScreenshot();

        fs.writeFileSync(
            "evidencia-caso015.png",
            imagen,
            "base64"
        );

        console.log(
            "Captura guardada como evidencia-caso015.png"
        );

    } catch (error) {

        console.log(
            "Error en el caso015:",
            error.message
        );

    } finally {

        await driver.quit();
    }
}

pruebaMisCitas();