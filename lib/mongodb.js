import { json } from "micro";
import { MongoClient } from "mongodb";
import _ from 'lodash';

const util = require('util');
const JSONStream = require('JSONStream');
const pump = require('pump');
const json2mongo = require('json2mongo');
const mongojs = require('mongojs');
const express = require('express');


const OperationType = {
  listCollectionNames: 0, runCommand: 1, find: 2, listFields: 3
}
const objectId = /^[a-f\d]{24}$/i;
const number = /^\d+$/


const objectify = function (json) {
  if ('$oid' in json)
    return mongojs.ObjectId(json['$oid']);
  Object.keys(json).forEach(function (key) {
    const value = json[key];
    if (typeof value === 'object')
      json[key] = objectify(value);
  });
  return json;
};

const parseJSON = function (json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return {};
  }
};
/**
 * @param {string} url
 */
const MongodbClient = function (url) {
  this.connString = url;
  this.db = mongojs(url)
}
MongodbClient.prototype.getCursor = function (collection, options) {
  let query = json2mongo(parseJSON(options.q)),
    filter = parseJSON(options.filter),
    sort = parseJSON(options.sort),
    limit = parseInt(options.limit || 0, 10),
    skip = parseInt(options.skip || 0, 10),
    cursor;
  collection = this.db.collection(collection);
  query = objectify(query);
  console.log('querying: ' + util.inspect(query, false, null));
  cursor = collection.find(query, filter).sort(sort).skip(skip);
  if (limit) cursor.limit(limit);
  return cursor;
};

MongodbClient.prototype.queryAll = function (collection, options, res) {
  const cursor = this.getCursor(collection, options);
  pump(cursor, JSONStream.stringify(`{"data":[`, ",", "]}"), res, function (err) {
    console.log('pipe finished', err)
    cursor.destroy();
  });
};

MongodbClient.prototype.queryById = function (collection, id, options, res) {
  if (objectId.test(id)) id = this.db.ObjectId(id);
  else if (number.test(id)) id = parseInt(id, 10);
  this.db.collection(collection).findOne({ _id: id }, function (err, doc) {
    if (err) {
      console.error(err)
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    if (!doc) {
      res.end(JSON.stringify({ data: [] }));
      return;
    }
    res.end(JSON.stringify({ data: [{ data: doc }] }));
  });
};

/**
 * 
 * @param {object} obj 
 */
MongodbClient.prototype.extractValue = function (obj) {
  if (typeof obj === 'object') {
    _.map(obj, (v, k) => {
      let match;
      if (typeof v === 'object') {
        return this.extractValue(v);
      } else if (typeof v === 'string' && (match = v.match(/^ObjectId:(.*)$/))) {
        obj[k] = this.db.ObjectId(match[1]);
      }
    })
  }
  return obj;
}

MongodbClient.prototype.query = async function (req, res) {
  const { sql } = await json(req);
  const sqlJSON = JSON.parse(sql);
  const { operationType, collectionName, id, command } = sqlJSON;
  console.log(sql)
  console.log(req.method, req.url);
  if (!this.db) {
    res.end(JSON.stringify({ error: "server busy!" }));
    return;
  }
  switch (operationType || _.values(OperationType)[0]) {
    case OperationType.listCollectionNames:
      this.db.getCollectionNames((err, doc) => {
        res.end(JSON.stringify({ data: doc }));
      });
      return;

    case OperationType.runCommand:
      this.db.runCommand(command, (err, doc) => {
        res.end(JSON.stringify({ data: doc }));
      });
      return;
    case OperationType.listFields:
      this.db.collection(collectionName).findOne({}, {}, (err, doc) => {
        res.end(JSON.stringify({
          data: _.reduce(doc, (prev, v, k) => {
            prev.push({
              Field: k,
              Type: typeof v
            });
            return prev;
          }, [])
        }));
      });
      return;
    case OperationType.find:
      const find = async (collectionName, filterJSON, projectionJSON, mongodbColumnMeta,
        lowerBound, upperBound, isObjectId, limit, sortJSON, skip) => {
        if (!lowerBound || !upperBound) {
          res.end(JSON.stringify({ error: "params error!" }));
          return;
        }
        let filter = {};
        if (lowerBound === "min") {
          if (upperBound !== "max") {
            filter._id = { "$lt": isObjectId ? this.db.ObjectId(JSON.stringify(upperBound)) : upperBound };
          }
        } else if (upperBound === "max") {
          filter._id = { "$gte": isObjectId ? this.db.ObjectId(JSON.stringify(lowerBound)) : lowerBound };
        } else {
          filter._id = {
            "$gte": isObjectId ? this.db.ObjectId(JSON.stringify(lowerBound)) : lowerBound,
            "$lt": isObjectId ? this.db.ObjectId(JSON.stringify(upperBound)) : upperBound
          };
        }
        if (filterJSON) {
          filter = _.assign({}, filter, this.extractValue(filterJSON));
        }
        return await this.db.collection(collectionName).find(filter, projectionJSON).sort(sortJSON).limit(limit).skip(skip).toArray(function (err, doc) {
          if (doc) {
            res.end(JSON.stringify({ data: doc }));
          } else {
            res.end(JSON.stringify({ error: err }));
          }
        });
      }
      const { filter, projection, column, lowerBound, upperBound, isObjectId, limit, sort, skip } = sqlJSON;
      if (!collectionName) {
        res.end(JSON.stringify({ error: "collectionName empty!" }));
        return;
      }
      await find(collectionName, filter,
        projection || {}, column || [],
        lowerBound || "min", upperBound || "max",
        undefined === isObjectId ? true : isObjectId, limit || 1000, sort || {},
        skip || 0);
      return;
    default:
      // res.end(JSON.stringify({ error: "Operation type not support!" }));
      // return;
      break;
  }


  if (undefined !== collectionName) {
    if (undefined !== id) {
      this.queryById(collectionName, id, sql, res);
    } else {
      this.queryAll(collectionName, sql, res);
    }
  } else {
    res.end(JSON.stringify({ error: "params error!" }));
  }
  // try {
  //   let content = { fileds: [], results }
  //   res.end(JSON.stringify({ fileds: [], data: results }));
  // } catch (e) {
  //   res.end(JSON.stringify({ error: e.message }));
  // }
};

MongodbClient.prototype.close = function () {
  if (!this.db) {
    return;
  }
  this.db.close();
  console.log(` ${this.connString} have ended`);
}

export function mongodbRouter(getHandler =
  /**@returns {MongodbClient} */ () => { }) {
  let r = express.Router();
  r.post('/:name/datasets', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.datasets(req, res);
  })
  r.post('/:name/datasets/:datasetId/tables', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.datasetsDatasetIdTables(req, res);
  })
  r.post('/:name/datasets/:datasetId/tables/:tableId', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.datasetsDatasetIdTablesTableId(req, res);
  })
  r.post('/:name/datasets/:datasetId/tables/:tableId/data', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.datasetsDatasetIdTablesTableIdData(req, res);
  })
  r.post('/:name/query', function (req, res) {
    let handler = getHandler(req, res);
    if (!handler) {
      return;
    }
    return handler.queryApi(req, res);
  })
  return r;
}

export default MongodbClient;