const DatabaseType = {
    "Mysql": {
        "shortName": "mysql",
        "name": "Mysql",
        "fields": {
            "host": "",
            "port": 3306,
            "user": "",
            "password": "",
            "database": ""
        },
        "template": "mysql://{user}:{password}@{host}:{port}/{database}",
        "OptionFields": [],
        "HideFields":[
            "password",
        ]
    },
    "PostgreSQL": {
        "shortName": "postgres",
        "name": "PostgreSQL",
        "fields": {
            "host": "",
            "port": 5432,
            "user": "",
            "password": "",
            "database": ""
        },
        "template": "postgresql://{user}:{password}@{host}:{port}/{database}",
        "OptionFields": [],
        "HideFields":[
            "password",
        ]
    },
    "MSSQL": {
        "shortName": "mssql",
        "name": "MSSQL",
        "fields": {
            "host": "",
            "port": 1433,
            "user": "",
            "password": "",
            "database": "",
            "encrypt": false
        },
        "template": "Server={host};Port={port};Database={database};UserId={user};Password={password};Encrypt={encrypt}",
        "OptionFields": [
            "password",
            "location"
        ],
        "HideFields":[
            "password",
        ]
    },
    "MongoDB": {
        "shortName": "mongodb",
        "name": "MongoDB",
        "fields": {
            "host": "localhost",
            "port": 27017,
            "user": "",
            "password": "",
            "database": "",
            "encrypt": false
        },
        "template": "{host}:{port}/{database}",
        "OptionFields": [
            "user",
            "port",
            "password",
            "location"
        ],
        "HideFields":[
            "password",
        ]
    },
    "Snowflake": {
        "shortName": "snowflake",
        "name": "Snowflake",
        "fields": {
            "account": "",
            "user": "",
            "password": "",
            "database": "",
            "schema": "",
            "warehouse": "",
            "role": ""
        },
        "template": "snowflake://{user}:{password}@{account}/{database}?schema={schema}&warehouse={warehouse}&role={role}",
        "OptionFields": [
            "password",
            "location"
        ],
        "HideFields":[
            "password",
        ]
    },
    "Neo4j": {
        "shortName": "neo4j",
        "name": "Neo4j",
        "fields": {
            "protocal": "neo4j",
            "host": "localhost",
            "port": 7687,
            "user": "neo4j",
            "password": ""
        },
        "template": "{protocal}://{host}:{port}",
        "OptionFields": [],
        "HideFields":[
            "password",
        ]
    },
    "BigQuery": {
        "shortName": "bigquery",
        "name": "BigQuery",
        "fields": {
            "file": ""
        },
        "template": "BigQuery:{file}",
        "OptionFields": []
    },
    "DynamoDB": {
        "shortName": "dynamodb",
        "name": "DynamoDB",
        "fields": {
            "file": "",
            "region": ""
        },
        "template": "DynamoDB:{file}:{region}",
        "OptionFields": []
    }
}

export default DatabaseType