import { json } from "micro";
import { URL } from "url";
import JSONStream from "JSONStream";
import snowflake from "snowflake-sdk";

const SnowflakeClient = function (url, proxyConfig) {
  this.proxyConfig = proxyConfig;
  url = new URL(url);
  const { host, username, password, pathname, searchParams } = new URL(
    url
  );
  this.connection = snowflake.createConnection({
    account: host,
    username,
    password,
    database: pathname.slice(1),
    schema: searchParams.get("schema"),
    warehouse: searchParams.get("warehouse"),
    role: searchParams.get("role")
  });

  this.connecting = new WeakSet();
}
SnowflakeClient.prototype.query = async function (req, res) {
  const body = await json(req);
  const { sql, params } = body;

  const client = await new Promise((resolve, reject) => {
    if (this.connection.isUp() || this.connecting.has(this.connection))
      return resolve(this.connection);
    snowflake.configure({ ocspFailOpen: false });
    this.connection.connect((err, conn) => {
      if (err) reject(err);
      else resolve(conn);
    });
    this.connecting.add(this.connection);
  });

  try {
    const statement = client.execute({ sqlText: sql, binds: params });
    const stream = statement.streamRows();

    await new Promise((resolve, reject) => {
      stream
        .once("end", resolve)
        .on("error", reject)
        .pipe(JSONStream.stringify(`{"data":[`, ",", "]"))
        .pipe(res, { end: false });
    });

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: statement
          .getColumns()
          .reduce(
            (schema, column) => (
              (schema[column.getName()] = dataTypeSchema(column)), schema
            ),
            {}
          )
      }
    };
    res.end(`,"schema":${JSON.stringify(schema)}}`);
  } catch (error) {
    // if (!error.statusCode) error.statusCode = 400;
    // throw error;
    console.error(error);
    res.end(JSON.stringify({ error: error.message }));
  }
};
SnowflakeClient.prototype.close = function () {
  if (this.connection.isUp() || this.connecting.has(this.connection)) {
    this.connection.destroy((err) => {
      console.log(` ${this.proxyConfig.name} ${this.proxyConfig.type} have ended`, err);
    })
  }
}
export default SnowflakeClient;

// https://github.com/snowflakedb/snowflake-connector-nodejs/blob/master/lib/connection/result/data_types.js
const array = ["null", "array"],
  boolean = ["null", "boolean"],
  integer = ["null", "integer"],
  number = ["null", "number"],
  object = ["null", "object"],
  string = ["null", "string"];
function dataTypeSchema(column) {
  switch (column.getType()) {
    case "binary":
      return { type: object, buffer: true };
    case "boolean":
      return { type: boolean };
    case "fixed":
    case "real":
      return { type: column.getScale() ? number : integer };
    case "date":
    case "timestamp_ltz":
    case "timestamp_ntz":
    case "timestamp_tz":
      return { type: string, date: true };
    case "variant":
    case "object":
      return { type: object };
    case "array":
      return { type: array, items: { type: object } };
    case "time":
    case "text":
    default:
      return { type: string };
  }
}
