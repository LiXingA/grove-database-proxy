import { json } from "micro";
import { Pool } from "pg";
import QueryStream from "pg-query-stream";
import JSONStream from "JSONStream";

const PostgresClient = function (url, proxyConfig) {
  this.proxyConfig = proxyConfig;
  this.pool = new Pool({ connectionString: url });
}

PostgresClient.prototype.query = async function (req, res) {
  const { sql, params } = await json(req);
  console.log(sql)
  console.log(params)
  let client;
  try {
    client = await this.pool.connect();
    const queryStream = new QueryStream(sql, params);
    const stream = await client.query(queryStream);

    await new Promise((resolve, reject) => {
      stream
        .on("end", resolve)
        .on("error", reject)
        .pipe(JSONStream.stringify(`{"data":[`, ",", "]"))
        .pipe(
          res,
          { end: false }
        );
    });

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: queryStream.cursor._result.fields.reduce(
          (schema, { name, dataTypeID }) => (
            (schema[name] = dataTypeSchema(dataTypeID)), schema
          ),
          {}
        )
      }
    };
    res.end(`,"schema":${JSON.stringify(schema)}}`);
  } catch (error) {
    console.error(error);
    res.end(JSON.stringify({ error: error.message }));
  } finally {
    client && client.release();
  }
};
PostgresClient.prototype.close = function () {
  if (!this.pool) {
    return;
  }
  this.pool.end().then(() => {
    console.log(` ${this.proxyConfig.name} ${this.proxyConfig.type} have ended`);
  });
}
export default PostgresClient;

// https://www.postgresql.org/docs/9.6/datatype.html
const array = ["null", "array"],
  boolean = ["null", "boolean"],
  integer = ["null", "integer"],
  number = ["null", "number"],
  object = ["null", "object"],
  string = ["null", "string"];
function dataTypeSchema(dataTypeID) {
  switch (dataTypeID) {
    // https://github.com/brianc/node-pg-types/blob/master/lib/textParsers.js#L166
    case 20: //parseBigInteger // int8
      return { type: string, bigint: true };
    case 21: //parseInteger // int2
    case 23: //parseInteger // int4
    case 26: //parseInteger // oid
      return { type: integer };
    case 700: //parseFloat // float4/real
    case 701: //parseFloat // float8/double
      return { type: number };
    case 16: //parseBool
      return { type: boolean };
    case 1082: //parseDate // date
    case 1114: //parseDate // timestamp without timezone
    case 1184: //parseDate // timestamp
      return { type: string, date: true };
    case 600: //parsePoint // point
      return { type: object };
    case 651: //parseStringArray // cidr[]
      return { type: array, items: { type: string } };
    case 718: //parseCircle // circle
      return { type: object };
    case 1000: //parseBoolArray
      return { type: array, items: { type: boolean } };
    case 1001: //parseByteAArray
      return { type: array, items: { type: object, buffer: true } };
    case 1005: //parseIntegerArray // _int2
    case 1007: //parseIntegerArray // _int4
    case 1028: //parseIntegerArray // oid[]
      return { type: array, items: { type: integer } };
    case 1016: //parseBigIntegerArray // _int8
      return { type: array, items: { type: string, bigint: true } };
    case 1017: //parsePointArray // point[]
      return { type: array, items: { type: object } };
    case 1021: //parseFloatArray // _float4
    case 1022: //parseFloatArray // _float8
    case 1231: //parseFloatArray // _numeric
      return { type: array, items: { type: number } };
    case 1014: //parseStringArray //char
    case 1015: //parseStringArray //varchar
    case 1008: //parseStringArray
    case 1009: //parseStringArray
    case 1040: //parseStringArray // macaddr[]
    case 1041: //parseStringArray // inet[]
      return { type: array, items: { type: string } };
    case 1115: //parseDateArray // timestamp without time zone[]
    case 1182: //parseDateArray // _date
    case 1185: //parseDateArray // timestamp with time zone[]
      return { type: array, items: { type: string, date: true } };
    case 1186: //parseInterval
      return { type: object };
    case 1187: //parseIntervalArray
      return { type: array, items: { type: object } };
    case 17: //parseByteA
      return { type: object, buffer: true };
    case 114: //JSON.parse.bind(JSON) // json
    case 3802: //JSON.parse.bind(JSON) // jsonb
      return { type: object };
    case 199: //parseJsonArray // json[]
    case 3807: //parseJsonArray // jsonb[]
      return { type: array, items: { type: object } };
    case 3907: //parseStringArray // numrange[]
    case 2951: //parseStringArray // uuid[]
    case 791: //parseStringArray // money[]
    case 1183: //parseStringArray // time[]
    case 1270: //parseStringArray // timetz[]
      return { type: array, items: { type: string } };
    // https://github.com/brianc/node-pg-types/blob/master/lib/binaryParsers.js#L236
    case 1700: //parseNumeric
      return { type: number };
    case 25: //parseText
    default:
      return { type: string };
  }
}
