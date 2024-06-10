import { existsSync, readFileSync, writeFileSync, createReadStream } from "fs";
import { homedir } from "os";
import { join } from "path";
import { exit } from "./errors";

const csv = require('csv-parser')
const configFile = "config.json";
const awsRegionsFile = join(__dirname, "files", "aws_regions.csv");
const PROXY_KEY = `database-proxy`;

export const config = {
  "encryption": {
    "password": "asdf1234",
  },
}
var rawConfigData = null;
var awsRegions = null;

export async function getAwsRegions() {
  if (awsRegions) {
    return awsRegions;
  } else {
    if (!existsSync(awsRegionsFile)) {
      return [];
    }
    awsRegions = [];
    return await new Promise((resolve, reject) => {
      createReadStream(awsRegionsFile)
        .pipe(csv())
        .on('data', (data) => awsRegions.push(data))
        .on('end', () => {
          resolve(awsRegions);
        });
    })
  }
}

export function rawConfig() {
  if (rawConfigData) {
    return rawConfigData;
  } else {
    if (!existsSync(configFile)) {
      rawConfigData = {
        "ssl": "disabled",
        "port": 2901,
        "database-proxy": {
        }
      };
      writeFileSync(configFile, JSON.stringify(rawConfigData, null, 2), { mode: 0o600 });
      return rawConfigData;
    }
    rawConfigData = JSON.parse(readFileSync(configFile));
    return rawConfigData;
  }
}

/**
 * @returns {object}
 */
export function readConfig() {
  const config = rawConfig();
  return config ? config[PROXY_KEY] : {};
}

export function readDecodedConfig() {
  const config = readConfig();
  return Object.values(config);
}

export function writeConfig(proxyConfig) {
  const config = rawConfig() || {};
  config[PROXY_KEY] = proxyConfig;
  writeFileSync(configFile, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function decodeSecret(secret) {
  try {
    return JSON.parse(Buffer.from(secret, "base64"));
  } catch (error) {
    exit(error);
  }
}
