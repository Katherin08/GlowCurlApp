const { Builder } = require("selenium-webdriver");
const fs = require("fs");

async function pruebaPaginaPrincipal() {
    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {
        await driver.get("http://127.0.0.1:5500/index.html");

        console.log("Página principal cargada correctamente.");

        const imagen = await driver.takeScreenshot();

        fs.writeFileSync("evidencia-caso001.png", imagen, "base64");

        console.log("Captura guardada como evidencia-caso001.png");

    } finally {
        await driver.quit();
    }
}

pruebaPaginaPrincipal();