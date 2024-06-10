import { json } from "micro";
import types from "mysql/lib/protocol/constants/types";
import JSONStream from "JSONStream";
import { join } from "path";
import _ from 'lodash';
import { getJSON } from "./util/helpers";
const { BigQuery } = require('@google-cloud/bigquery');
const express = require('express');

const BigQueryClient = function (url, proxyConfig) {
  this.proxyConfig = proxyConfig;
  this.bigquery = new BigQuery({
    keyFilename: join(__dirname, '../upload', this.proxyConfig.file),
    // projectId: 'red-shape-384801',
  });
  const queryF = async () => {
    this.bigquery.getDatasets((err, datasets) => {
      if (err) {
        return;
      }
      console.log('Datasets:');
      datasets.forEach(dataset => console.log(dataset.id, dataset.location));
      this.setDatasets(datasets);
    });
  }
  queryF();
}
BigQueryClient.prototype.setDatasets = function (datasets) {
  this.datasetsCache = datasets;
}
BigQueryClient.prototype.datasets = async function (req, res) {
  await this.bigquery.getDatasets((err, datasets) => {
    if (err) {
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    this.setDatasets(datasets);
    res.end(JSON.stringify({ data: datasets }))
  });
}
BigQueryClient.prototype.datasetsDatasetIdTables = async function (req, res) {
  let datasetId = req.params.datasetId;
  const source = await getJSON(req);
  if (!datasetId) {
    res.end(JSON.stringify({ error: "Params Error!" }));
    return;
  }
  const dataset = this.bigquery.dataset(datasetId);
  await dataset.getTables(source, function (err, tables) {
    if (err) {
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    res.end(JSON.stringify({ data: tables }))
  });
}
BigQueryClient.prototype.datasetsDatasetIdTablesTableId = async function (req, res) {
  let datasetId = req.params.datasetId;
  let tableId = req.params.tableId;
  if (!datasetId || !tableId) {
    res.end(JSON.stringify({ error: "Params Error!" }));
    return;
  }
  const table = this.bigquery.dataset(datasetId).table(tableId);
  await table.getMetadata(function (err, metadata) {
    if (err) {
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    res.end(JSON.stringify({ data: metadata }))
  });
}
BigQueryClient.prototype.datasetsDatasetIdTablesTableIdData = async function (req, res) {
  let datasetId = req.params.datasetId;
  let tableId = req.params.tableId;
  if (!datasetId || !tableId) {
    res.end(JSON.stringify({ error: "Params Error!" }));
    return;
  }
  const { limit, offset, location } = await getJSON(req);
  // Run the query as a job
  await this.bigquery.createQueryJob({ query: `SELECT *  FROM \`${datasetId}.${tableId}\` LIMIT ${undefined === limit ? 100 : limit} OFFSET ${undefined === offset ? 0 : offset}`, location: location },
    async function (err, job) {
      if (err) {
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      console.log(`Job ${job.id} started.`);
      // Wait for the query to finish
      await job.getQueryResults((err, rows) => {
        if (err) {
          // rows is an array of results.
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        res.end(JSON.stringify({ data: rows }))
      });
    });
}
BigQueryClient.prototype.queryApi = async function (req, res) {
  const source = await getJSON(req);
  // Run the query as a job
  await this.bigquery.createQueryJob(source, async function (err, job) {
    if (err) {
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    console.log(`Job ${job.id} started.`);
    // Wait for the query to finish
    await job.getQueryResults((err, rows) => {
      if (err) {
        // rows is an array of results.
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      res.end(JSON.stringify({ data: rows }))
    });
  });
}
BigQueryClient.prototype.query = async function (req, res) {
  const { sql, params } = await getJSON(req);

  // Queries the U.S. given names dataset for the state of Texas.

  const query = sql;

  if (query === "getDatasets") {
    await this.bigquery.getDatasets(function (err, datasets) {
      if (err) {
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      res.end(JSON.stringify({
        data: _.reduce(datasets, (prev, curr) => {
          const { id, location } = curr;
          prev.push({ id, location })
          return prev;
        }, [])
      }))
    });
    return;
  } else if (query === "getTables") {
    const { datasetId } = params;
    if (!datasetId) {
      res.end(JSON.stringify({ error: "Params Error!" }));
      return;
    }
    const dataset = this.bigquery.dataset(datasetId);
    await dataset.getTables(function (err, tables) {
      if (err) {
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      res.end(JSON.stringify({
        data: _.reduce(tables, (prev, curr) => {
          const { id } = curr;
          prev.push({ name: id, schema: datasetId })
          return prev;
        }, [])
      }))
    });
    return;
  } else if (query === "getMetadata") {
    const { datasetId, tableId } = params;
    if (!datasetId || !tableId) {
      res.end(JSON.stringify({ error: "Params Error!" }));
      return;
    }
    const table = this.bigquery.dataset(datasetId).table(tableId);
    await table.getMetadata(function (err, metadata) {
      if (err) {
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      res.end(JSON.stringify({ data: metadata.schema.fields }))
    });
    return;
  }

  // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
  const options = {
    query: query,
    // Location must match that of the dataset(s) referenced in the query.
    location: params && params.location,
  };

  // Run the query as a job
  await this.bigquery.createQueryJob(options, async function (err, job) {
    if (err) {
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    console.log(`Job ${job.id} started.`);
    // Wait for the query to finish
    await job.getQueryResults((err, rows) => {
      if (err) {
        // rows is an array of results.
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      res.end(JSON.stringify({ data: rows }))
    });
  });
};

BigQueryClient.prototype.close = function () {
}

export function bigqueryRouter(getHandler =
  /**@returns {BigQueryClient} */ () => { }) {
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
export default BigQueryClient;