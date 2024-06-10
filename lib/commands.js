/* eslint-disable no-console */

import { createInterface } from "readline";
import open from "open";
import {
  readConfig,
  readDecodedConfig,
  rawConfig,
  writeConfig
} from "./config";
import DatabaseType from './databaseTypes';
import { server } from "./server";
import { exit } from "./errors";
import _ from 'lodash';

export function start() {
  const config = rawConfig();
  server(config);
}

export async function add(argv, reset = false) {
  const { name, sslkey, sslcert } = argv;
  let config = readConfig();
  let url;
  if (config[name] && !reset)
    exit(`A database proxy for "${name}" already exists`);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const question = query => new Promise(resolve => rl.question(query, resolve));

  if (reset) {
    if (!config[name]) exit(`No configuration found for "${name}"`);
    url = config[name].url;
  }
  let arr = _.keys(DatabaseType)
  let str = _.reduce(arr, (prev, t, index) => {
    prev += ` ${index}.${t}`
    return prev;
  }, "");
  const type = DatabaseType[arr[await question(`Select database type, ${str} :`)]]
  let fields = {};
  if (!reset) {
    for (let i = 0; i < _.keys(type.fields).length; i++) {
      let k = _.keys(type.fields)[i];
      let v = type.fields[k];
      fields[k] = await question(`${k}${v !== "" ? `(default:${v})` : ""}:`)
      fields[k] = fields[k] || v;
      fields[k] = typeof v === "number" ? parseInt(fields[k]) : (
        typeof v === "boolean" ? (fields[k] + "").toLowerCase() === "true" : fields[k]
      )
    }
  }
  rl.close();
  if (!config) config = {};
  config[name] = { name, type: type.name, ...fields };
  writeConfig(config);

  console.log(`Configuration ${reset ? `reset` : `added`} for "${name}"`);
}

export function reset(argv) {
  add(argv, true);
}

export function remove(argv) {
  const { name } = argv;
  const config = readConfig();
  if (!config) exit(`No database proxies configured`);
  if (!config[name]) exit(`No configuration found for "${name}"`);
  delete config[name];
  writeConfig(config);
  console.log(`Removed database proxy "${name}"`);
}

export function list() {
  const config = readDecodedConfig();
  if (!config) exit(`No database proxies configured`);
  console.log(
    config
      .map(c => `${c.name} (${c.type}) ${c.ssl === "required" ? `(SSL)` : ``}`)
      .join("\n")
  );
}
