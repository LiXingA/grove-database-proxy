#!/usr/bin/env node
/* eslint-disable no-console */

const jwt = require('jsonwebtoken');
const _ = require('lodash');
const http = require("http");
const https = require("https");
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors')
const app = express();
const router = express.Router();
const { networkInterfaces } = require('os');
const ips = ["localhost", "127.0.0.1"];
const results = Object.create(null); // Or just '{}', an empty object
const nets = networkInterfaces();

let consoleFunc = function (oriLogFunc, depth) {
    return function () {
        if (!(arguments.length > 1 && typeof arguments[0] === 'string')) {
            let now = new Date();
            let $depth = depth || 2;
            let line = (new Error).stack.split("\n")[$depth].replace(/\s+at\s+/, "");
            let xx = line.indexOf("(");
            if (xx != -1) {
                line = line.substring(line.indexOf("("));
            } else {
                line = "(" + line + ")";
            }
            let msg = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} ${line} ${_.join(_.map(arguments, (value, index) => { return value instanceof Object ? JSON.stringify(value) : value }), " ")}`;
            oriLogFunc.call(console, msg);
        } else {
            oriLogFunc.call(console, ...arguments);
        }
    }
};

const logFunc = console.log;
console.log = consoleFunc(logFunc);

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
            ips.push(net.address)
        }
    }
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {*} next 
 * @returns 
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        console.log(err)

        if (err) return res.sendStatus(403)

        req.user = user

        next()
    })
}

function server(config) {
    // get config vars
    dotenv.config();

    // access config var
    process.env.TOKEN_SECRET;
    function generateAccessToken(username) {
        return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
    }
    app.use(cors())
    app.get('/api/createNewUser', (req, res) => {
        // ...
        const token = generateAccessToken({ username: req.query.username });
        res.json(token);
        // ...
    });

    app.get('/api/userOrders', authenticateToken, (req, res) => {
        // executes after authenticateToken
        // ...
        res.json("success")
    })


    const development = process.env.NODE_ENV === "development";
    const developmentOrigin = "http://localhost:9000";

    const {
        ssl = "disabled",
        port = 2899,
        sslcert,
        sslkey,
    } = config;

    let server;
    const useSSL = ssl === "required";
    if (useSSL && (!(sslcert || existsSync(sslcertFile)) || !(sslkey || existsSync(sslkeyFile)))) {
        return exit(
            "SSL required, but no SSL certificate or private key configured"
        );
    }

    if (useSSL) {
        const sslcertData = readFileSync(sslcert || sslcertFile);
        const sslkeyData = readFileSync(sslkey || sslkeyFile);
        server = https.createServer({ cert: sslcertData, key: sslkeyData }, app);
    } else {
        server = http.createServer(app);
    }

    server.listen(port, () => {
        console.log(
            `Database Proxy Server running at \n${_.map(ips, (host) => `http${useSSL ? `s` : ``}://${host}:${port}`).join("\n")}, CORS-enabled`
        );
    });
}
server({})

// let token = require('crypto').randomBytes(64).toString('hex')
// console.log(token);