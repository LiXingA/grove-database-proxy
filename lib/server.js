#!/usr/bin/env node
/* eslint-disable no-console */

import http from "http";
let formidable = require('formidable');
import https from "https";
import { readFileSync, existsSync, rename, copyFile, writeFile } from "fs";
import { homedir } from "os";
import { join } from "path";
import { json, run } from "micro";
import { createHmac, timingSafeEqual } from "crypto";
import serializeErrors from "./serialize-errors";
import { notFound, unauthorized, exit } from "./errors";
import mssql from "./mssql";
import mysql from "./mysql";
import mongodb, { mongodbRouter } from "./mongodb";
import dynamodb, { dynamoRouter } from "./dynamodb";
import postgres from "./postgres";
import snowflake from "./snowflake";
import { getAwsRegions, readConfig, readDecodedConfig, writeConfig } from "./config";
import { RESP_STATUS_OK, RESP_STATUS_FAIL } from './constants';
import DatabaseType from './databaseTypes';
import _ from 'lodash';
import neo4j from "./neo4j";
import bigquery, { bigqueryRouter } from "./bigquery";
import rest from "./rest";
const { networkInterfaces } = require('os');
const { exec } = require('child_process');
const express = require('express');
const cors = require('cors')
const app = express();
const router = express.Router();

const sslcertFile = join("./java-database-proxy/src/main/java/resource", "certificate.crt");
const sslkeyFile = join("./java-database-proxy/src/main/java/resource", "privateKey.key");

const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object
const ips = ["localhost", "127.0.0.1"];
const handlerMap = new Map();
const routerMap = new Map();

app.use(cors())
app.use(express.static(__dirname + "/../java-database-proxy/src/main/webapp/"));

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
export function server(config) {
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

  function getConstructor(type) {
    const HandlerConstructor =
      type === DatabaseType.Mysql.name
        ? mysql
        : type === DatabaseType.PostgreSQL.name
          ? postgres
          : type === DatabaseType.Snowflake.name
            ? snowflake
            : type === DatabaseType.MSSQL.name
              ? mssql
              : type === DatabaseType.MongoDB.name
                ? mongodb
                : type === DatabaseType.Neo4j.name
                  ? neo4j
                  : type === DatabaseType.BigQuery.name
                    ? bigquery
                    : type === DatabaseType.DynamoDB.name
                      ? dynamodb
                      : null;
    return HandlerConstructor;
  }

  function getHandler(req, res) {
    let name = req.params.name;
    let config = readConfig();
    const proxyConfig = config[name];
    if (!proxyConfig) {
      res.send(JSON.stringify({ error: "Can't find config!" }));
      return;
    }
    const handler = handlerMap.get(name)
    if (!handler) {
      res.send(JSON.stringify({ error: "Can't find handler!" }));
      return;
    }
    // CORS
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") {
      // Don't have an authorization header to check yet, so be permissive
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || req.headers.host);
      return;
    }
    // Authorization
    // const [, authorization] = (req.headers.authorization || "").split(/\s+/);
    // if (!authorization) throw unauthorized("Missing authorization header");

    // const [payload, hmac] = authorization
    //   .split(".")
    //   .map(encoded => Buffer.from(encoded, "base64"));
    // const { name } = JSON.parse(payload);
    // if (proxyConfig.name !== name) throw notFound();
    // const { origin, secret } = proxyConfig;

    // if (development) {
    //   res.setHeader("Access-Control-Allow-Origin", developmentOrigin);
    // } else {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || req.headers.host);
    // }

    // const valid = createHmac("sha256", Buffer.from(secret, "hex"))
    //   .update(payload)
    //   .digest();
    // if (!timingSafeEqual(hmac, valid)) throw unauthorized("Invalid HMAC");

    // Authorized CORS
    // if (
    //   (req.headers.origin || req.headers.host) !== origin &&
    //   !(development && (req.headers.origin || req.headers.host) === developmentOrigin)
    // )
    //   throw unauthorized("Invalid CORS origin");

    // Expose type
    if (req.method === "GET") {
      res.send(JSON.stringify({ error: { type: proxyConfig.type } }));
      return;
    }
    if (proxyConfig.disabled) {
      res.send(JSON.stringify({ error: "Stop the service!" }));
      return;
    }
    return handler;
  }

  function createRouter(type) {
    if (type === DatabaseType.DynamoDB.name) {
      return dynamoRouter(getHandler);
    } else if (type === DatabaseType.BigQuery.name) {
      return bigqueryRouter(getHandler);
    } else if (type === DatabaseType.MongoDB.name) {
      return mongodbRouter(getHandler);
    }
  }

  function getAndLoadRouter(type) {
    if (!routerMap.has(type)) {
      let r = createRouter(type);
      if (!r) {
        return;
      }
      console.log("support api router： " + type);
      routerMap.set(type, r);
    }
    return routerMap.get(type);
  }

  function restTypeIndex(type) {
    const HandlerConstructor = getConstructor(type);
    if (!HandlerConstructor) {
      return exit(`Unknown database type: ${type}`);
    }
    return getAndLoadRouter(type);
  }

  function getAndLoadHandler(proxyConfig) {
    const { type, name } = proxyConfig;
    const HandlerConstructor = getConstructor(type);
    if (!HandlerConstructor) {
      return exit(`Unknown database type: ${type}`);
    }
    if (!handlerMap.has(name)) {
      let databaseType = DatabaseType[type];
      let url = _.reduce(proxyConfig, (prev, v, k) => {
        prev = prev.replace(`{${k}}`, v)
        return prev;
      }, databaseType.template);
      // console.log(url);
      const handler = new HandlerConstructor(url, proxyConfig);
      handlerMap.set(name, handler);
    }
    return handlerMap.get(name);
  }

  function typeIndex(type) {
    const HandlerConstructor = getConstructor(type);
    if (!HandlerConstructor) {
      res.send(JSON.stringify({ error: `Unknown database type: ${type}` }));
      return;
    }
    return function (req, res) {
      let handler = getHandler(req, res);
      if (!handler) {
        return;
      }
      // Make requests
      return handler.query(req, res);
    }
  }

  const routeDatabase = (type) => {
    let databaseType = DatabaseType[type];
    app.post(`/${databaseType.shortName}/:name`, typeIndex(type));
    let childRouter = restTypeIndex(type);
    if (childRouter) {
      router.use(`/${databaseType.shortName}`, childRouter);
    }
  };

  _.map(_.keys(DatabaseType), routeDatabase)
  router.use('/', function (req, res) {
    res.send({ error: 'API' })
  })
  app.use('/api', router);
  _.map(readConfig(), (value, key) => {
    getAndLoadHandler(value);
  })
  app.get("/databases", async function (req, res) {
    res.send(JSON.stringify({ status: RESP_STATUS_OK, awsRegions: await getAwsRegions(), data: _.filter(readDecodedConfig(), v => { return !v.disabled }) }));
  })
  app.post("/addDatabase", async function (req, res) {
    const { name, type, edit, ...fields } = await json(req);
    let config = readConfig();
    if (config[name] && !config[name].disabled && !edit) {
      return res.send(JSON.stringify({ status: RESP_STATUS_FAIL, error: `A database proxy for "${name}" already exists` }));
    }
    let databaseType = DatabaseType[type];
    let errorParams = _.filter(_.keys(databaseType.fields), (fieldName, index) => {
      return !(~databaseType.OptionFields.indexOf(fieldName) || !~databaseType.OptionFields.indexOf(fieldName) && typeof databaseType.fields[fieldName] === typeof fields[fieldName] && (fields[fieldName] || typeof fields[fieldName] === 'boolean'))
    });
    if (errorParams.length > 0) {
      return res.send(JSON.stringify({ status: RESP_STATUS_FAIL, error: `Fields: ${JSON.stringify(errorParams)} Params Error!` }));
    }
    if (config[name]) {
      delete config[name].disabled;
      _.assign(config[name], { name, type, ...fields })
      if (handlerMap.get(name)) {
        handlerMap.get(name).close();
        handlerMap.delete(name);
      }
    } else {
      config[name] = { name, type, ...fields };
    }
    writeConfig(config);
    getAndLoadHandler(config[name]);
    console.log(`Configuration ${edit ? `edit` : `added`} for "${name}"`);
    res.send(JSON.stringify({ status: RESP_STATUS_OK, msg: `Configuration ${edit ? `edit` : `added`} for "${name}" success`, data: Object.values(config) }));
  })

  app.post("/removeDatabase", async function (req, res) {
    const { name } = await json(req);
    let config = readConfig();
    if (!config[name]) {
      return res.send({ status: RESP_STATUS_FAIL, error: `A database proxy for "${name}" not exists` });
    }
    config[name].disabled = true;
    handlerMap.get(name).close();
    handlerMap.delete(name);
    writeConfig(config);
    res.send(JSON.stringify({ status: RESP_STATUS_OK, msg: `Configuration removed for "${name}" success`, data: Object.values(config) }));
  })
  app.post("/uploadFile", async function (req, res) {
    // const { fileName, data } = await json(req);
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      let fileDir = join(__dirname, './../upload');
      let filePath = join(fileDir, fields.fileName);
      writeFile(filePath, fields.data, 'utf8', function (err) {
        if (err) {
          console.error("/uploadFile :", err);
          res.send({ status: RESP_STATUS_FAIL, error: `File Upload Fail!` });
        } else {
          res.send(JSON.stringify({ status: RESP_STATUS_OK, msg: `File Upload Success` }));
        }
      });
    })


    // //Create an instance of the form object
    // let form = new formidable.IncomingForm();
    // //Process the file upload in Node
    // form.parse(req, function (error, fields, file) {
    //   let filepath = file.file.filepath;
    //   let newpath = join(__dirname, '../upload', file.file.originalFilename);
    //   //Copy the uploaded file to a custom folder
    //   copyFile(filepath, newpath, function () {
    //     //Send a NodeJS file upload confirmation message
    //     res.write('NodeJS File Upload Success!');
    //     res.send();
    //   });
    // });
  })
  app.get('/static', express.static(join(__dirname, '../upload')))

  app.use("/rest", rest);
  // Open the default browser on Windows
  if (process.platform === 'win32') {
    exec(`start "" "http://${ips[0]}:${port}"`);
  }

}
