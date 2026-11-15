const http = require('http');
const express = require('express');
const RED = require('node-red');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);

// --- CONFIGURATION DES IDENTIFIANTS ---
// Modifiables ici ou via les variables d'environnement APP_USER et APP_PASS sur Render
const UTILISATEUR = process.env.APP_USER || "Yahi";
const MOT_DE_PASSE = process.env.APP_PASS || "dashboard.2026";

// Chiffrement du mot de passe pour l'éditeur Node-RED
const motDePasseChiffre = bcrypt.hashSync(MOT_DE_PASSE, 8);

// 1. Paramètres de sécurité pour l'éditeur (/red)
const settings = {
    httpAdminRoot: "/red",
    httpNodeRoot: "/",
    userDir: "./data",
    flowFile: "flows.json",
    credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || "supervision-iot-secret-2026",
    adminAuth: {
        type: "credentials",
        users: [{
            username: UTILISATEUR,
            password: motDePasseChiffre,
            permissions: "*"
        }]
    },
    functionGlobalContext: { }
};

// 2. Sécurité pour le Dashboard (/dashboard) et la carte (/worldmap)
function verifierAccesDashboard(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Supervision IoT"');
        return res.status(401).send('Acces refuse : identifiant et mot de passe requis.');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8').split(':');
    const user = credentials[0];
    const pass = credentials[1];

    if (user === UTILISATEUR && pass === MOT_DE_PASSE) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Supervision IoT"');
        return res.status(401).send('Identifiants incorrects.');
    }
}

// Application de la protection sur les pages publiques
app.use('/dashboard', verifierAccesDashboard);
app.use('/worldmap', verifierAccesDashboard);

// Redirection automatique de la racine vers le Dashboard protégé
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// 3. Initialisation et liaison des routes Node-RED
RED.init(server, settings);
app.use(settings.httpAdminRoot, RED.httpAdmin);
app.use(settings.httpNodeRoot, RED.httpNode);

const port = process.env.PORT || 1880;
server.listen(port, function() {
    console.log("Serveur Node-RED sécurisé démarré sur le port " + port);
});

RED.start();
