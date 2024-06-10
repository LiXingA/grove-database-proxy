import {
  DynamoDBClient, ScanCommand, ListTablesCommand, DescribeTableCommand,
  QueryCommand, ExecuteStatementCommand, BatchExecuteStatementCommand
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import _ from 'lodash';
import { existsSync, readFileSync, createReadStream } from "fs";
import { join } from "path";
import { getJSON } from './util/helpers';

const csv = require('csv-parser')
const express = require('express');
const util = require('util');
const JSONStream = require('JSONStream');
const pump = require('pump');


const OperationType = {
  ListTables: 0, DescribeTable: 1, Query: 2, ExecuteStatement: 3, BatchExecuteStatement: 4, Scan: 5,
}

const parseJSON = function (json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

/**
 * @param {string} url
 */
const DynamoClient = function (url, proxyConfig) {
  this.connString = url;
  this.proxyConfig = proxyConfig;
  let configFile = join(__dirname, '../upload', this.proxyConfig.file);
  if (!existsSync(configFile)) {
    throw new Error("access key file not found!");
  }
  let config = [];
  createReadStream(configFile)
    .pipe(csv())
    .on('data', (data) => config.push(data))
    .on('end', () => {
      if (config.length !== 1) {
        throw new Error("csv file error!");
      }
      this.db = new DynamoDBClient({
        credentials: {
          accessKeyId: config[0]['Access key ID'],
          secretAccessKey: config[0]['Secret access key'],
        }, region: this.proxyConfig.region
      })
      const marshallOptions = {
        // Whether to automatically convert empty strings, blobs, and sets to `null`.
        convertEmptyValues: false, // false, by default.
        // Whether to remove undefined values while marshalling.
        removeUndefinedValues: false, // false, by default.
        // Whether to convert typeof object to map attribute.
        convertClassInstanceToMap: false, // false, by default.
      };

      const unmarshallOptions = {
        // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
        wrapNumbers: false, // false, by default.
      };

      const translateConfig = { marshallOptions, unmarshallOptions };
      // Create the DynamoDB document client.
      this.ddbDocClient = DynamoDBDocumentClient.from(this.db, translateConfig);
    });

}

DynamoClient.prototype.tables = async function (req, res) {
  try {
    let source = await getJSON(req);
    const data = await this.db.send(new ListTablesCommand(source));
    res.end(JSON.stringify({ data: data.TableNames }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
  }
}
/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
DynamoClient.prototype.tablesTableId = async function (req, res) {
  try {
    let tableId = req.params.tableId;
    const data = await this.db.send(new DescribeTableCommand({ TableName: tableId }));
    res.end(JSON.stringify({ data: data.Table }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
  }
}
DynamoClient.prototype.tablesTableIdData = async function (req, res) {
  try {
    let tableId = req.params.tableId;
    const source = await getJSON(req);
    const data = await this.ddbDocClient.send(new ExecuteStatementCommand(_.assign({
      Statement: `SELECT * FROM "${tableId}"`,
      ConsistentRead: true,
    }, source)));
    res.end(JSON.stringify({ data: data }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
  }
}
DynamoClient.prototype.queryApi = async function (req, res) {
  try {
    const source = await getJSON(req);
    const data = await this.ddbDocClient.send(new QueryCommand(source));
    res.end(JSON.stringify({ data: data }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
  }
}
DynamoClient.prototype.excute = async function (req, res) {
  try {
    const source = await getJSON(req);
    const data = await this.ddbDocClient.send(new ExecuteStatementCommand(source));
    res.end(JSON.stringify({ data: data }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
  }
}
DynamoClient.prototype.batchExcute = async function (req, res) {
  try {
    const source = await getJSON(req);
    const data = await this.ddbDocClient.send(new BatchExecuteStatementCommand(source));
    res.end(JSON.stringify({ data: data.Responses }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
  }
}
DynamoClient.prototype.scan = async function (req, res) {
  try {
    const source = await getJSON(req);
    const data = await this.ddbDocClient.send(new ScanCommand(source));
    res.end(JSON.stringify({ data: data }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
  }
}
DynamoClient.prototype.dlInfo = async function (req, res) {
  try {
    const data = await this.ddbDocClient.send(new ScanCommand({
      TableName: "DL_Static_info",
    }));
    res.end(JSON.stringify({ data: data }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
  }
}
DynamoClient.prototype.latestData = async function (req, res) {
  try {
    const data = await this.ddbDocClient.send(new ScanCommand({
      Statement: "SELECT * FROM DL_test where sample_time > ?",
      Parameters: [{ N: "" + (new Date().getTime() - 5 * 60 * 1000) }],
      ConsistentRead: true,
    }));
    res.end(JSON.stringify({ data: data }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
  }
}
DynamoClient.prototype.query = async function (req, res) {
  let { sql } = await getJSON(req);
  sql = sql.trim();
  if (/^select\s+/i.test(sql)) {
    try {
      let match = sql.match(/(\s+limit\s+(\d+))$/i)
      let limit;
      if (null !== match && match.length === 3) {
        limit = parseInt(match[2])
        sql = sql.substring(0, sql.length - match[0].length);
      }
      const data = await this.ddbDocClient.send(new ExecuteStatementCommand(_.assign({
        Statement: sql,
        ConsistentRead: true,
      }, limit ? { Limit: limit } : {})));
      res.end(JSON.stringify({ data: data }));
    } catch (err) {
      res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
    }
    return;
  }
  const sqlJSON = parseJSON(sql);
  if (!sqlJSON) {
    res.end(JSON.stringify({ error: "Sql Error!" }));
    return;
  }
  const { operationType, tableName, params } = sqlJSON;
  console.log(sql)
  console.log(req.method, req.url);
  if (!this.db) {
    res.end(JSON.stringify({ error: "Server Busy!" }));
    return;
  }
  switch (operationType || _.values(OperationType)[0]) {
    case OperationType.ListTables:
      try {
        const data = await this.db.send(new ListTablesCommand(params));
        res.end(JSON.stringify({ data: data.TableNames }));
      } catch (err) {
        res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
      }
      return;
    case OperationType.DescribeTable:
      try {
        const data = await this.db.send(new DescribeTableCommand({ TableName: tableName }));
        res.end(JSON.stringify({ data: data.Table }));
      } catch (err) {
        res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
      }
      return;
    case OperationType.Query:
      try {
        const data = await this.db.send(new QueryCommand(params));
        res.end(JSON.stringify({ data: data }));
        return data;
      } catch (err) {
        res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
      }
      return;
    case OperationType.ExecuteStatement:
      try {
        const data = await this.ddbDocClient.send(new ExecuteStatementCommand(params));
        res.end(JSON.stringify({ data: data }));
      } catch (err) {
        res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
      }
      return;

    case OperationType.BatchExecuteStatement:
      try {
        const data = await this.ddbDocClient.send(new BatchExecuteStatementCommand(params));
        res.end(JSON.stringify({ data: data.Responses }));
      } catch (err) {
        res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
      }
      return;
    case OperationType.Scan:
      try {
        const data = await this.db.send(new ScanCommand(params));
        res.end(JSON.stringify({ data: data }));
        return data;
      } catch (err) {
        res.end(JSON.stringify({ error: err.message || JSON.stringify(err) }));
      }
      return;
    default:
      // res.end(JSON.stringify({ error: "Operation type not support!" }));
      // return;
      break;
  }
};

DynamoClient.prototype.close = function () {
  if (!this.db) {
    return;
  }
  this.ddbDocClient.destroy();
  this.db.destroy();
  console.log(` ${this.connString} have ended`);
}

export function dynamoRouter(getHandler =
  /**@returns {DynamoClient} */ () => { }) {
  let r = express.Router();
  r.post('/:name/tables', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.tables(req, res);
  })
  r.post('/:name/tables/:tableId', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.tablesTableId(req, res);
  })
  r.post('/:name/tables/:tableId/data', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.tablesTableIdData(req, res);
  })
  r.post('/:name/query', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.queryApi(req, res);
  })
  r.post('/:name/excute', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.excute(req, res);
  })
  r.post('/:name/batchExcute', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.batchExcute(req, res);
  })
  r.post('/:name/scan', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.scan(req, res);
  })
  r.post('/:name/dlInfo', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.dlInfo(req, res);
  })
  r.post('/:name/latestData', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.latestData(req, res);
  })
  return r;
}

export default DynamoClient;