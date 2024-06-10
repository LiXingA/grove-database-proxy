package com.alibaba.datax.plugin.rdbms.reader;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.sql.Array;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Date;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.alibaba.datax.common.element.BoolColumn;
import com.alibaba.datax.common.element.BytesColumn;
import com.alibaba.datax.common.element.DateColumn;
import com.alibaba.datax.common.element.DoubleColumn;
import com.alibaba.datax.common.element.LongColumn;
import com.alibaba.datax.common.element.Record;
import com.alibaba.datax.common.element.StringColumn;
import com.alibaba.datax.common.exception.DataXException;
import com.alibaba.datax.common.plugin.RecordSender;
import com.alibaba.datax.common.statistics.PerfRecord;
import com.alibaba.datax.common.statistics.PerfTrace;
import com.alibaba.datax.common.util.Configuration;
import com.alibaba.datax.plugin.rdbms.util.DBUtil;
import com.alibaba.datax.plugin.rdbms.util.DBUtilErrorCode;
import com.alibaba.datax.plugin.rdbms.util.DataBaseType;
import com.alibaba.datax.plugin.rdbms.util.RdbmsException;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONException;
import com.alibaba.fastjson.JSONObject;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import servlet.common.CommonUtils;
import servlet.common.ConfigUtils;
import servlet.common.DatabaseType;

public class CommonRdbmsReaderTest {

    public static void main(String[] args) {
        Configuration configuration = ConfigUtils.getDatabaseProxys().get("my");
        Task task = new Task(DatabaseType.valueOf(configuration.getString(Key.TYPE)).getDataBaseType());
        task.init(configuration);
        JSONObject columnsObject = new JSONObject();
        task.startRead("select * from fruits", configuration, "fruits", 10, columnsObject);
        System.out.println(columnsObject.toJSONString());
        test2();
    }

    public static void test2() {
        Configuration configuration = ConfigUtils.getDatabaseProxys().get("ps");
        Task task = new Task(DatabaseType.valueOf(configuration.getString(Key.TYPE)).getDataBaseType());
        task.init(configuration);
        JSONObject columnsObject = new JSONObject();
        task.startRead("select * from fff.tb1", configuration, "fff.tb1", 10, columnsObject);
        System.out.println(columnsObject.toJSONString());
    }

    public static void doPost(HttpServletRequest req, HttpServletResponse resp, String uri)
            throws ServletException, IOException {
        resp.setContentType("text/html;charset=utf-8");
        String name = req.getRequestURI().substring(req.getContextPath().length() + uri.length());
        Map<String, Configuration> databaseProxys = ConfigUtils.getDatabaseProxys();
        if (databaseProxys.containsKey(name)) {
            Configuration configuration = databaseProxys.get(name);
            Task task = new CommonRdbmsReaderTest.Task(
                    DatabaseType.valueOf(configuration.getString(Key.TYPE)).getDataBaseType());
            task.init(configuration);
            StringBuffer jb = new StringBuffer();
            String line = null;
            try {
                BufferedReader reader = req.getReader();
                while ((line = reader.readLine()) != null) {
                    jb.append(line);
                }
                Configuration from = Configuration.from(jb.toString());
                JSONObject columnsObject = new JSONObject();
                JSONArray array = task.startRead(from.getString("sql"), configuration,
                        from.getString("table", "NoTableName"), 1000, columnsObject);
                resp.getWriter().append(CommonUtils.assembleMessage(array, columnsObject));
            } catch (Exception e) {
                e.printStackTrace();
                resp.getWriter().append(CommonUtils.assembleErrMessage(e.getMessage()));
                return;
            }
        } else {
            resp.getWriter().append(CommonUtils.assembleErrMessage("Can't find config!"));
        }
    }

    public static class Task {
        private static final Logger LOG = LoggerFactory.getLogger(Task.class);
        private static final boolean IS_DEBUG = LOG.isDebugEnabled();
        protected final byte[] EMPTY_CHAR_ARRAY = new byte[0];

        private DataBaseType dataBaseType;
        private int taskGroupId = -1;
        private int taskId = -1;

        private String username;
        private String password;
        private String jdbcUrl;
        private String mandatoryEncoding;

        // 作为日志显示信息时，需要附带的通用信息。比如信息所对应的数据库连接等信息，针对哪个表做的操作
        private String basicMsg;

        public Task(DataBaseType dataBaseType) {
            this(dataBaseType, -1, -1);
        }

        public Task(DataBaseType dataBaseType, int taskGropuId, int taskId) {
            this.dataBaseType = dataBaseType;
            this.taskGroupId = taskGropuId;
            this.taskId = taskId;
        }

        public void init(Configuration readerSliceConfig) {

            /* for database connection */

            this.username = readerSliceConfig.getString(Key.USER);
            this.password = readerSliceConfig.getString(Key.PASSWORD);
            if (this.dataBaseType == DataBaseType.Snowflake) {// snowflake://HaHello:Hahahehe123.@yp53988.central-us.azure/TEST?schema=ME&warehouse=HOUSE&role=TESTROLE
                String account = readerSliceConfig.getString(Key.ACCOUNT);
                String database = readerSliceConfig.getString(Key.DATABASE);
                String schema = readerSliceConfig.getString(Key.SCHEMA);
                String warehouse = readerSliceConfig.getString(Key.WARE_HOUSE);
                String role = readerSliceConfig.getString(Key.ROLE);
                this.jdbcUrl = String.format(
                        "jdbc:snowflake://%s.snowflakecomputing.com/?db=%s&schema=%s&warehouse=%s&role=%s", account,
                        database, schema, warehouse, role);
            } else {
                this.jdbcUrl = String.format("jdbc:%s://%s:%s/%s", this.dataBaseType.getTypeName(),
                        readerSliceConfig.getString(Key.HOST), readerSliceConfig.getString(Key.PORT),
                        readerSliceConfig.getString(Key.DATABASE));
            }

            // ob10的处理
            if (this.jdbcUrl.startsWith(com.alibaba.datax.plugin.rdbms.writer.Constant.OB10_SPLIT_STRING)
                    && this.dataBaseType == DataBaseType.MySql) {
                String[] ss = this.jdbcUrl
                        .split(com.alibaba.datax.plugin.rdbms.writer.Constant.OB10_SPLIT_STRING_PATTERN);
                if (ss.length != 3) {
                    throw DataXException.asDataXException(DBUtilErrorCode.JDBC_OB10_ADDRESS_ERROR,
                            "JDBC OB10格式错误，请联系askdatax");
                }
                LOG.info("this is ob1_0 jdbc url.");
                this.username = ss[1].trim() + ":" + this.username;
                this.jdbcUrl = ss[2];
                LOG.info("this is ob1_0 jdbc url. user=" + this.username + " :url=" + this.jdbcUrl);
            }

            this.mandatoryEncoding = readerSliceConfig.getString(Key.MANDATORY_ENCODING, "");

            basicMsg = String.format("jdbcUrl:[%s]", this.jdbcUrl);

        }

        public JSONArray startRead(String querySql, Configuration readerSliceConfig, String table, int fetchSize,
                JSONObject columnsObject) {
            PerfTrace.getInstance().addTaskDetails(taskId, table + "," + basicMsg);

            LOG.info("Begin to read record by Sql: [{}\n] {}.", querySql, basicMsg);
            PerfRecord queryPerfRecord = new PerfRecord(taskGroupId, taskId, PerfRecord.PHASE.SQL_QUERY);
            queryPerfRecord.start();

            Connection conn = DBUtil.getConnection(this.dataBaseType, jdbcUrl, username, password);

            // session config .etc related
            DBUtil.dealWithSessionConfig(conn, readerSliceConfig, this.dataBaseType, basicMsg);

            // int columnNumber = 0;
            ResultSet rs = null;
            try {
                rs = DBUtil.query(conn, querySql, fetchSize);
                queryPerfRecord.end();

                // ResultSetMetaData metaData = rs.getMetaData();
                // columnNumber = metaData.getColumnCount();

                // 这个统计干净的result_Next时间
                PerfRecord allResultPerfRecord = new PerfRecord(taskGroupId, taskId, PerfRecord.PHASE.RESULT_NEXT_ALL);
                allResultPerfRecord.start();

                long rsNextUsedTime = 0;
                long lastTime = System.nanoTime();
                // while (rs.next()) {
                // rsNextUsedTime += (System.nanoTime() - lastTime);
                // this.buildRecord(rs, metaData, columnNumber, mandatoryEncoding);
                // lastTime = System.nanoTime();
                // }
                JSONArray array = this.mapResultSet(rs, mandatoryEncoding, columnsObject);
                allResultPerfRecord.end(rsNextUsedTime);
                // 目前大盘是依赖这个打印，而之前这个Finish read record是包含了sql查询和result next的全部时间
                LOG.info("Finished read record by Sql: [{}\n] {}.", querySql, basicMsg);
                return array;
            } catch (Exception e) {
                // RdbmsException.asQueryException(this.dataBaseType, e, querySql, table,
                // username);
                e.printStackTrace();
                JSONArray array = new JSONArray();
                JSONObject obj = new JSONObject();
                obj.put("error", e.getMessage());
                array.add(obj);
                return array;
            } finally {
                DBUtil.closeDBResources(null, conn);
            }
        }

        public JSONArray mapResultSet(ResultSet rs, String mandatoryEncoding, JSONObject columnsObject)
                throws SQLException, JSONException, UnsupportedEncodingException {
            JSONArray jArray = new JSONArray();
            JSONObject jsonObject = null;
            ResultSetMetaData rsmd = rs.getMetaData();
            int columnCount = rsmd.getColumnCount();
            while (rs.next()) {
                jsonObject = new JSONObject();
                for (int index = 1; index <= columnCount; index++) {
                    String column = rsmd.getColumnName(index);
                    if (columnsObject != null && jArray.size() == 0) {
                        columnsObject.put(column, rsmd.getColumnTypeName(index));
                    }
                    Object value = rs.getObject(index);
                    if (value == null) {
                        jsonObject.put(column, "");
                    } else if (value instanceof Integer) {
                        jsonObject.put(column, (Integer) value);
                    } else if (value instanceof String) {
                        jsonObject.put(column, (String) value);
                    } else if (value instanceof Boolean) {
                        jsonObject.put(column, (Boolean) value);
                    } else if (value instanceof Date) {
                        jsonObject.put(column, ((Date) value).getTime());
                    } else if (value instanceof Long) {
                        jsonObject.put(column, (Long) value);
                    } else if (value instanceof Double) {
                        jsonObject.put(column, (Double) value);
                    } else if (value instanceof Float) {
                        jsonObject.put(column, (Float) value);
                    } else if (value instanceof BigDecimal) {
                        jsonObject.put(column, (BigDecimal) value);
                    } else if (value instanceof Byte) {
                        jsonObject.put(column, (Byte) value);
                    } else if (value instanceof byte[]) {
                        jsonObject.put(column, (byte[]) value);
                    } else if (value instanceof Array) {
                        Array arr = (Array) value;
                        jsonObject.put(column, arr.toString());
                    } else {
                        throw new IllegalArgumentException("Unmappable object type: " + value.getClass());
                    }
                }
                jArray.add(jsonObject);
            }
            return jArray;
        }

        public void post(Configuration originalConfig) {
            // do nothing
        }

        public void destroy(Configuration originalConfig) {
            // do nothing
        }

        protected void buildRecord(RecordSender recordSender, ResultSet rs, ResultSetMetaData metaData,
                int columnNumber, String mandatoryEncoding) {
            Record record = recordSender.createRecord();

            try {
                for (int i = 1; i <= columnNumber; i++) {
                    switch (metaData.getColumnType(i)) {

                        case Types.CHAR:
                        case Types.NCHAR:
                        case Types.VARCHAR:
                        case Types.LONGVARCHAR:
                        case Types.NVARCHAR:
                        case Types.LONGNVARCHAR:
                            String rawData;
                            if (StringUtils.isBlank(mandatoryEncoding)) {
                                rawData = rs.getString(i);
                            } else {
                                rawData = new String((rs.getBytes(i) == null ? EMPTY_CHAR_ARRAY : rs.getBytes(i)),
                                        mandatoryEncoding);
                            }
                            record.addColumn(new StringColumn(rawData));
                            break;

                        case Types.CLOB:
                        case Types.NCLOB:
                            record.addColumn(new StringColumn(rs.getString(i)));
                            break;

                        case Types.SMALLINT:
                        case Types.TINYINT:
                        case Types.INTEGER:
                        case Types.BIGINT:
                            record.addColumn(new LongColumn(rs.getString(i)));
                            break;

                        case Types.NUMERIC:
                        case Types.DECIMAL:
                            record.addColumn(new DoubleColumn(rs.getString(i)));
                            break;

                        case Types.FLOAT:
                        case Types.REAL:
                        case Types.DOUBLE:
                            record.addColumn(new DoubleColumn(rs.getString(i)));
                            break;

                        case Types.TIME:
                            record.addColumn(new DateColumn(rs.getTime(i)));
                            break;

                        // for mysql bug, see http://bugs.mysql.com/bug.php?id=35115
                        case Types.DATE:
                            if (metaData.getColumnTypeName(i).equalsIgnoreCase("year")) {
                                record.addColumn(new LongColumn(rs.getInt(i)));
                            } else {
                                record.addColumn(new DateColumn(rs.getDate(i)));
                            }
                            break;

                        case Types.TIMESTAMP:
                            record.addColumn(new DateColumn(rs.getTimestamp(i)));
                            break;

                        case Types.BINARY:
                        case Types.VARBINARY:
                        case Types.BLOB:
                        case Types.LONGVARBINARY:
                            record.addColumn(new BytesColumn(rs.getBytes(i)));
                            break;

                        // warn: bit(1) -> Types.BIT 可使用BoolColumn
                        // warn: bit(>1) -> Types.VARBINARY 可使用BytesColumn
                        case Types.BOOLEAN:
                        case Types.BIT:
                            record.addColumn(new BoolColumn(rs.getBoolean(i)));
                            break;

                        case Types.NULL:
                            String stringData = null;
                            if (rs.getObject(i) != null) {
                                stringData = rs.getObject(i).toString();
                            }
                            record.addColumn(new StringColumn(stringData));
                            break;

                        default:
                            throw DataXException.asDataXException(DBUtilErrorCode.UNSUPPORTED_TYPE, String.format(
                                    "您的配置文件中的列配置信息有误. 因为DataX 不支持数据库读取这种字段类型. 字段名:[%s], 字段名称:[%s], 字段Java类型:[%s]. 请尝试使用数据库函数将其转换datax支持的类型 或者不同步该字段 .",
                                    metaData.getColumnName(i), metaData.getColumnType(i),
                                    metaData.getColumnClassName(i)));
                    }
                }
            } catch (Exception e) {
                if (IS_DEBUG) {
                    LOG.debug("read data occur exception:", e);
                }
                // TODO 这里识别为脏数据靠谱吗？
                if (e instanceof DataXException) {
                    throw (DataXException) e;
                }
            }
            return;
        }
    }

}
