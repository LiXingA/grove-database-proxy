import { json } from "micro";
import _ from 'lodash';

const boltMapping = require('./bolt/boltMapping')
const neo4j = require('neo4j-driver');
/**
 * @param {string} url
 */
const Neo4jClient = function (url, proxyConfig) {
  const { user, password } = proxyConfig;
  this.driver = neo4j.driver(
    url,
    neo4j.auth.basic(user, password)
  )
  this.proxyConfig = proxyConfig;
};
Neo4jClient.prototype.query = async function (req, res) {
  const { sql, params } = await json(req);
  console.log(sql)
  console.log(params)
  if (!this.driver) {
    res.end(JSON.stringify({ error: "server busy!" }));
    return;
  }
  try {
    let session = this.driver.session({ defaultAccessMode: neo4j.session.READ })
    // Run a Cypher statement, reading the result in a streaming manner as records arrive:
    session
      .run(sql, params)
      .then(result => {
        // let data = boltMapping.convertData(result);
        //neo4j driver 5 is agent
        // data.summary = {
        //   version: result.summary.server.agent || result.summary.server.version
        // }
        // console.log(JSON.stringify(result))
        res.end(JSON.stringify({ data: result }));
        session.close();
      }).catch((e) => {
        console.error(e);
        res.end(JSON.stringify({ error: e.message }));
        session.close();
      })
  } catch (e) {
    res.end(JSON.stringify({ error: e.message }));
  }
};

Neo4jClient.prototype.close = function () {
  if (!this.driver) {
    return;
  }
  this.driver.close().then(() => {
    console.log(` ${this.proxyConfig.name} ${this.proxyConfig.type} have ended`);
  });
}

export default Neo4jClient;