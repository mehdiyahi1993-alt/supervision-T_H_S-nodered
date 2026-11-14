const http = require('http');
const express = require('express');
const RED = require('node-red');

// 1. Création de l'application Express et du serveur HTTP
const app = express();
const server = http.createServer(app);

// 2. Configuration des paramètres de Node-RED
const settings = {
    httpAdminRoot: "/red",
    httpNodeRoot: "/",
    userDir: "./data",
    flowFile: "flows.json",
    credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || "supervision-iot-secret-2026",
    functionGlobalContext: { }
};

// 3. Initialisation de Node-RED
RED.init(server, settings);

// 4. Liaison des routes web
app.use(settings.httpAdminRoot, RED.httpAdmin);
app.use(settings.httpNodeRoot, RED.httpNode);

// 5. Démarrage du serveur sur le port 1880
const port = process.env.PORT || 1880;
server.listen(port, function() {
    console.log("Serveur Node-RED démarré sur http://localhost:" + port + "/red");
    console.log("Dashboard accessible sur http://localhost:" + port + "/dashboard");
});

// 6. Lancement du moteur d'exécution des flux
RED.start();
