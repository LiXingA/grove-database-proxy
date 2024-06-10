package servlet.common;

import java.io.File;

import com.alibaba.datax.common.util.Configuration;
import com.alibaba.datax.plugin.rdbms.util.DataBaseType;

public enum DatabaseType {
    BigQuery("BigQuery", DataBaseType.BigQuery), Mysql("Mysql", DataBaseType.MySql),
    PostgreSQL("PostgreSQL", DataBaseType.PostgreSQL),
    MSSQL("MSSQL", DataBaseType.SQLServer), Snowflake("Snowflake", DataBaseType.Snowflake), MongoDB("MongoDB", null),
    Neo4j("Neo4j", null);

    private final String key;
    private final DataBaseType dataBaseType;
    private final Configuration config;
    private final String shortName;
    private final Configuration fields;

    private DatabaseType(String key, DataBaseType dataBaseType) {
        this.key = key;
        this.dataBaseType = dataBaseType;
        this.config = ConfigUtils.getDatabaseTypes().getConfiguration(this.key);
        this.shortName = this.config.getString("shortName");
        this.fields = this.config.getConfiguration("fields");
    }

    public String getKey() {
        return key;
    }

    public DataBaseType getDataBaseType() {
        return dataBaseType;
    }

    public Configuration getConfig() {
        return config;
    }

    public String getShortName() {
        return shortName;
    }

    public Configuration getFields() {
        return fields;
    }

    @Override
    public String toString() {
        return this.config.toJSON();
    }

}
