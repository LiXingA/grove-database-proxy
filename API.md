## Send query example (for dynamodb)
### AttributeValue
Grammer:
```
{
  S: "STRING_VALUE",
  N: "STRING_VALUE",
  B: "BLOB_VALUE",
  SS: [ // StringSetAttributeValue
    "STRING_VALUE",
  ],
  NS: [ // NumberSetAttributeValue
    "STRING_VALUE",
  ],
  BS: [ // BinarySetAttributeValue
    "BLOB_VALUE",
  ],
  M: { // MapAttributeValue
    "<keys>": {//  Union: only one key present
      S: "STRING_VALUE",
      N: "STRING_VALUE",
      B: "BLOB_VALUE",
      SS: [
        "STRING_VALUE",
      ],
      NS: [
        "STRING_VALUE",
      ],
      BS: [
        "BLOB_VALUE",
      ],
      M: {
        "<keys>": "<AttributeValue>",
      },
      L: [ // ListAttributeValue
        "<AttributeValue>",
      ],
      NULL: true || false,
      BOOL: true || false,
    },
  },
  L: [
    "<AttributeValue>",
  ],
  NULL: true || false,
  BOOL: true || false,
}
```
### List tables
Grammer:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/tables",{
    method:"POST",
    body:JSON.stringify({
      ExclusiveStartTableName:"STRING_VALUE",
      Limit:Number("int")
    })
})).json();
```
### Describe table
Grammer:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/tables/:tableId",{
    method:"POST"
})).json();
```
### Query table rows
Grammer:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/tables/:tableId/data",{
    method:"POST",
    body:JSON.stringify({
      NextToken:"STRING_VALUE" ,
      Limit:Number("int")
    })
})).json();
```
### Query
Grammer:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/query",{
    method:"POST",
    body:JSON.stringify({ 
        TableName: "STRING_VALUE", // required
        IndexName: "STRING_VALUE",
        Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
        AttributesToGet: [ // AttributeNameList
          "STRING_VALUE",
        ],
        Limit: Number("int"),
        ConsistentRead: true || false,
        KeyConditions: { // KeyConditions
          "<keys>": { // Condition
            AttributeValueList: [ // AttributeValueList
            ],
            ComparisonOperator: "EQ" || "NE" || "IN" || "LE" || "LT" || "GE" || "GT" || "BETWEEN" || "NOT_NULL" || "NULL" || "CONTAINS" || "NOT_CONTAINS" || "BEGINS_WITH", // required
          },
        },
        QueryFilter: { // FilterConditionMap
          "<keys>": {
            AttributeValueList: [
              "<AttributeValue>",
            ],
            ComparisonOperator: "EQ" || "NE" || "IN" || "LE" || "LT" || "GE" || "GT" || "BETWEEN" || "NOT_NULL" || "NULL" || "CONTAINS" || "NOT_CONTAINS" || "BEGINS_WITH", // required
          },
        },
        ConditionalOperator: "AND" || "OR",
        ScanIndexForward: true || false,
        ExclusiveStartKey: { // Key
          "<keys>": "<AttributeValue>",
        },
        ReturnConsumedCapacity: "INDEXES" || "TOTAL" || "NONE",
        ProjectionExpression: "STRING_VALUE",
        FilterExpression: "STRING_VALUE",
        KeyConditionExpression: "STRING_VALUE",
        ExpressionAttributeNames: { // ExpressionAttributeNameMap
          "<keys>": "STRING_VALUE",
        },
        ExpressionAttributeValues: { // ExpressionAttributeValueMap
          "<keys>": "<AttributeValue>",
        },
    })
})).json();
```
For example:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/query",{
    method:"POST",
    body:JSON.stringify({
      TableName: "CoffeeCrop",
      KeyConditionExpression: "OriginCountry = :originCountry AND RoastDate > :roastDate",
      ExpressionAttributeValues: {
        ":originCountry": {S:"Ethiopia"},
        ":roastDate": {S:"2023-05-01"},
      },
      ConsistentRead: true,
    })
})).json();
```
### Execute PartiQL
Grammer:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/excute",{
    method:"POST",
    body:JSON.stringify({
      Statement: "STRING_VALUE", // required
      Parameters:["<AttributeValue>"],
      ConsistentRead: true || false,
      NextToken: "STRING_VALUE",
      ReturnConsumedCapacity: "INDEXES" || "TOTAL" || "NONE",
      Limit: Number("int"),
    })
})).json();
```
For example:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/excute",{
    method:"POST",
    body:JSON.stringify({
      Statement: `INSERT INTO Flowers value {'Name':?}`,
      Parameters: [{S:"Rose"}],
    })
})).json();
```
```
(await fetch("http://localhost:2901/api/dynamodb/arn/excute",{
    method:"POST",
    body:JSON.stringify({
      Statement: "SELECT * FROM DL_test where sample_time > ? and device_id > ?",
          Parameters: [{N:"1685481407878"},{N:"100000"}],
          ConsistentRead: true,
    })
})).json();
```
### Batch Execute PartiQL
Grammer:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/batchExcute",{
    method:"POST",
    body:JSON.stringify({
      Statements: [// PartiQLBatchRequest // required
        {// BatchStatementRequest
          Statement: "STRING_VALUE", // required
          Parameters:["<AttributeValue>"],
          ConsistentRead: true || false,
          NextToken: "STRING_VALUE",
          ReturnConsumedCapacity: "INDEXES" || "TOTAL" || "NONE",
          Limit: Number("int"),
        }
      ]
    })
})).json();
```
For example:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/batchExcute",{
    method:"POST",
    body:JSON.stringify({
      Statements: [
      {
          Statement: "SELECT * FROM PepperMeasurements WHERE Unit=?",
          Parameters: ["Teaspoons"],
          ConsistentRead: true,
      },
      {
          Statement: "SELECT * FROM PepperMeasurements WHERE Unit=?",
          Parameters: ["Grams"],
          ConsistentRead: true,
      },
      ],
    })
})).json();
```
### Scan
```
(await fetch("http://localhost:2901/api/dynamodb/:name/scan",{
    method:"POST",
    body:JSON.stringify({
      TableName: "STRING_VALUE", // required
      IndexName: "STRING_VALUE",
      AttributesToGet: [ // AttributeNameList
        "STRING_VALUE",
      ],
      Limit: Number("int"),
      Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
      ScanFilter: { // FilterConditionMap
        "<keys>": { // Condition
          AttributeValueList: [ // AttributeValueList
          ],
          ComparisonOperator: "EQ" || "NE" || "IN" || "LE" || "LT" || "GE" || "GT" || "BETWEEN" || "NOT_NULL" || "NULL" || "CONTAINS" || "NOT_CONTAINS" || "BEGINS_WITH", // required
        },
      },
      ConditionalOperator: "AND" || "OR",
      ExclusiveStartKey: { // Key
        "<keys>": "<AttributeValue>",
      },
      ReturnConsumedCapacity: "INDEXES" || "TOTAL" || "NONE",
      TotalSegments: Number("int"),
      Segment: Number("int"),
      ProjectionExpression: "STRING_VALUE",
      FilterExpression: "STRING_VALUE",
      ExpressionAttributeNames: { // ExpressionAttributeNameMap
        "<keys>": "STRING_VALUE",
      },
      ExpressionAttributeValues: { // ExpressionAttributeValueMap
        "<keys>": "<AttributeValue>",
      },
      ConsistentRead: true || false,
    })
})).json();
```
For example:
```
(await fetch("http://localhost:2901/api/dynamodb/:name/scan",{
    method:"POST",
    body:JSON.stringify({
      // Specify which items in the results are returned.
      FilterExpression: "Subtitle = :topic AND Season = :s AND Episode = :e",
      // Define the expression attribute value, which are substitutes for the values you want to compare.
      ExpressionAttributeValues: {
          ":topic": {S: "SubTitle2"},
          ":s": {N: 1},
          ":e": {N: 2},
      },
      // Set the projection expression, which are the attributes that you want.
      ProjectionExpression: "Season, Episode, Title, Subtitle",
      TableName: "EPISODES_TABLE",
    })
})).json();
```








## Send query example (for bigquery)
### List datasets
Grammer:
```
(await fetch("http://localhost:2901/api/bigquery/:name/datasets",{
    method:"POST"
})).json();
```
### List dataset tables
Grammer:
```
(await fetch("http://localhost:2901/api/bigquery/:name/datasets/:datasetId/tables",{
    method:"POST",
    body:JSON.stringify({
      autoPaginate:"boolean",
      maxApiCalls:"integer",
      maxResults:"integer",
      pageToken:"string",
    })
})).json();
```
### Describe dataset table
Grammer:
```
(await fetch("http://localhost:2901/api/bigquery/:name/datasets/:datasetId/:tableId",{
    method:"POST",
})).json();
```
### Query dataset table rows
Grammer:
```
(await fetch("http://localhost:2901/api/bigquery/:name/datasets/:datasetId/tables/:tableId/data",{
    method:"POST",
    body:JSON.stringify({
      limit:"integer",//default 100
      offset:"integer",//default 0
      location:"string",//The geographic location of the job. Required except for US and EU.
    })
})).json();
```
### Query
Grammer:
```
(await fetch("http://localhost:2901/api/bigquery/:name/query",{
    method:"POST",
    body:JSON.stringify({
      query:"string",//A query string, following the BigQuery query syntax, of the query to execute.
      location:"string",//The geographic location of the job. Required except for US and EU.
    })
})).json();
```