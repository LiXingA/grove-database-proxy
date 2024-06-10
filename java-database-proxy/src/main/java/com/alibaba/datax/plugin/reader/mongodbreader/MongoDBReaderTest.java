package com.alibaba.datax.plugin.reader.mongodbreader;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.Iterator;
import java.util.Map.Entry;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.alibaba.datax.common.exception.DataXException;
import com.alibaba.datax.common.spi.Reader;
import com.alibaba.datax.common.util.Configuration;
import com.alibaba.datax.plugin.reader.mongodbreader.util.MongoUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.google.common.base.Joiner;
import com.google.common.base.Strings;
import com.mongodb.MongoClient;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;

import org.bson.BsonDocument;
import org.bson.BsonInt64;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;

import servlet.common.ConfigUtils;

/**
 * Created by jianying.wcj on 2015/3/19 0019. Modified by mingyan.zc on
 * 2016/6/13. Modified by mingyan.zc on 2017/7/5.
 */
public class MongoDBReaderTest extends Reader {

    public static void main(String[] args) {
        Configuration configuration = ConfigUtils.getDatabaseProxys().get("mongo");
        Task task = new Task(configuration);
        task.init();
        JSONArray arr = new JSONArray();
        // JSONArray find = task.find("socketios", "{}", "{\"__v\": 1,
        // \"channel\": 1, \"msg\": 1}", arr, "min",
        // "max", true, 1000, "{ \"_id\": 1}", 298);
        Bson command = new BsonDocument("dbStats", new BsonInt64(1));
        JSONArray runCommand = task.runCommand(command.toString());
        System.out.println(runCommand);
        System.out.println(task.listCollectionNames());
    }

    public static class Task {

        static Pattern pattern = Pattern.compile("^mb\\.regex\\.(contains|notContains)\\(\"(.*)\"\\)$");

        private final Configuration readerSliceConfig;

        private MongoClient mongoClient;

        private String userName = null;
        private String password = null;

        private String authDb = null;
        private String database = null;
        // private String collection = null;

        // private String query = null;

        // private JSONArray mongodbColumnMeta = null;
        // private Object lowerBound = null;
        // private Object upperBound = null;
        // private boolean isObjectId = true;

        public Task(Configuration readerSliceConfig) {
            this.readerSliceConfig = readerSliceConfig;
        }

        public JSONArray listCollectionNames() {
            if (mongoClient == null || database == null) {
                throw DataXException.asDataXException(MongoDBReaderErrorCode.ILLEGAL_VALUE,
                        MongoDBReaderErrorCode.ILLEGAL_VALUE.getDescription());
            }
            JSONArray array = new JSONArray();
            MongoDatabase db = mongoClient.getDatabase(database);
            MongoCursor<String> dbCursor = db.listCollectionNames().iterator();
            while (dbCursor.hasNext()) {
                String item = dbCursor.next();
                array.add(item);
            }
            return array;
        }

        public JSONArray runCommand(String runCommandJSON) {
            if (mongoClient == null || database == null) {
                throw DataXException.asDataXException(MongoDBReaderErrorCode.ILLEGAL_VALUE,
                        MongoDBReaderErrorCode.ILLEGAL_VALUE.getDescription());
            }
            MongoDatabase db = mongoClient.getDatabase(database);

            Bson query = Document.parse(runCommandJSON);
            Document runCommand = db.runCommand(query);
            JSONArray jsonArray = new JSONArray();
            jsonArray.add(runCommand);
            return jsonArray;
        }

        public JSONArray listFields(String collection) {
            if (mongoClient == null || database == null) {
                throw DataXException.asDataXException(MongoDBReaderErrorCode.ILLEGAL_VALUE,
                        MongoDBReaderErrorCode.ILLEGAL_VALUE.getDescription());
            }
            MongoDatabase db = mongoClient.getDatabase(database);
            MongoCollection col = db.getCollection(collection);
            MongoCursor<Document> dbCursor = col.find().limit(20).iterator();
            JSONArray array = new JSONArray();
            while (dbCursor.hasNext()) {
                Document item = dbCursor.next();
                for (Entry<String, Object> iterable_element : item.entrySet()) {
                    String key = iterable_element.getKey();
                    Object value = iterable_element.getValue();
                    boolean _has = false;
                    for (int i = 0; i < array.size(); i++) {
                        if (array.getJSONObject(i).getString("Field").equals(key)) {
                            _has = true;
                            break;
                        }
                    }
                    if (_has) {
                        continue;
                    }
                    JSONObject json = new JSONObject();
                    json.put("Field", key);
                    if (value instanceof Boolean) {
                        json.put("Type", "boolean");
                    } else if (value instanceof Integer) {
                        json.put("Type", "int");
                    } else if (value instanceof Short) {
                        json.put("Type", "short");
                    } else if (value instanceof Long) {
                        json.put("Type", "long");
                    } else if (value instanceof Byte) {
                        json.put("Type", "byte");
                    } else if (value instanceof Double) {
                        json.put("Type", "double");
                    } else if (value instanceof Float) {
                        json.put("Type", "float");
                    } else if (value instanceof byte[]) {
                        json.put("Type", "byte[]");
                    } else if (value instanceof String) {
                        json.put("Type", "String");
                    } else if (value instanceof Date) {
                        json.put("Type", "Date");
                    } else if (value instanceof org.bson.types.Decimal128) {
                        json.put("Type", "Decimal128");
                    } else if (value instanceof org.bson.types.ObjectId) {
                        json.put("Type", "ObjectId");
                    } else if (value instanceof java.util.UUID) {
                        json.put("Type", "UUID");
                    } else {
                        json.put("Type", "Object");
                    }
                    array.add(json);
                }
            }
            return array;
        }

        public JSONArray find(String collection, String filterJSON, String projectionJSON, JSONArray mongodbColumnMeta,
                Object lowerBound, Object upperBound, boolean isObjectId, int limit, String sortJSON, int skip) {
            if (lowerBound == null || upperBound == null || mongoClient == null || database == null) {
                throw DataXException.asDataXException(MongoDBReaderErrorCode.ILLEGAL_VALUE,
                        MongoDBReaderErrorCode.ILLEGAL_VALUE.getDescription());
            }
            MongoDatabase db = mongoClient.getDatabase(database);
            MongoCollection col = db.getCollection(collection);

            Document filter = new Document();
            if (lowerBound.equals("min")) {
                if (!upperBound.equals("max")) {
                    filter.append(KeyConstant.MONGO_PRIMARY_ID,
                            new Document("$lt", isObjectId ? new ObjectId(upperBound.toString()) : upperBound));
                }
            } else if (upperBound.equals("max")) {
                filter.append(KeyConstant.MONGO_PRIMARY_ID,
                        new Document("$gte", isObjectId ? new ObjectId(lowerBound.toString()) : lowerBound));
            } else {
                filter.append(KeyConstant.MONGO_PRIMARY_ID,
                        new Document("$gte", isObjectId ? new ObjectId(lowerBound.toString()) : lowerBound)
                                .append("$lt", isObjectId ? new ObjectId(upperBound.toString()) : upperBound));
            }
            if (!Strings.isNullOrEmpty(filterJSON)) {
                Document queryFilter = Document.parse(filterJSON);
                filter = new Document("$and", Arrays.asList(filter, queryFilter));
            }
            FindIterable find = col.find(filter);
            if (!Strings.isNullOrEmpty(projectionJSON)) {
                Document projection = Document.parse(projectionJSON);
                find.projection(projection);
            }
            if (!Strings.isNullOrEmpty(sortJSON)) {
                Document sort = Document.parse(sortJSON);
                find.sort(sort);
            }
            if (limit > 0) {
                find.limit(limit);
            }
            if (skip > 0) {
                find.skip(skip);
            }
            MongoCursor<Document> dbCursor = null;
            dbCursor = find.iterator();
            JSONArray array = new JSONArray();
            while (dbCursor.hasNext()) {
                Document item = dbCursor.next();
                if (mongodbColumnMeta == null || mongodbColumnMeta.size() == 0) {
                    // System.out.println(item.toJson());
                    array.add(JSON.parseObject(item.toJson()));
                    continue;
                }
                Iterator columnItera = mongodbColumnMeta.iterator();
                while (columnItera.hasNext()) {
                    JSONObject column = (JSONObject) columnItera.next();
                    Object tempCol = item.get(column.getString(KeyConstant.COLUMN_NAME));
                    JSONObject json = new JSONObject();
                    if (tempCol == null) {
                        if (KeyConstant.isDocumentType(column.getString(KeyConstant.COLUMN_TYPE))) {
                            String[] name = column.getString(KeyConstant.COLUMN_NAME).split("\\.");
                            if (name.length > 1) {
                                Object obj;
                                Document nestedDocument = item;
                                for (String str : name) {
                                    obj = nestedDocument.get(str);
                                    if (obj instanceof Document) {
                                        nestedDocument = (Document) obj;
                                    }
                                }

                                if (null != nestedDocument) {
                                    Document doc = nestedDocument;
                                    tempCol = doc.get(name[name.length - 1]);
                                }
                            }
                        }
                    }
                    if (tempCol == null) {
                        // continue; 这个不能直接continue会导致record到目的端错位
                        // System.out.println("null");
                        json.put(column.getString(KeyConstant.COLUMN_NAME), null);
                    } else if (tempCol instanceof Double) {
                        // TODO deal with Double.isNaN()
                        // System.out.println((Double) tempCol);
                        json.put(column.getString(KeyConstant.COLUMN_NAME), (Double) tempCol);
                    } else if (tempCol instanceof Boolean) {
                        // System.out.println((Boolean) tempCol);
                        json.put(column.getString(KeyConstant.COLUMN_NAME), (Boolean) tempCol);
                    } else if (tempCol instanceof Date) {
                        // System.out.println((Date) tempCol);
                        json.put(column.getString(KeyConstant.COLUMN_NAME), (Date) tempCol);
                    } else if (tempCol instanceof Integer) {
                        // System.out.println((Integer) tempCol);
                        json.put(column.getString(KeyConstant.COLUMN_NAME), (Integer) tempCol);
                    } else if (tempCol instanceof Long) {
                        // System.out.println((Long) tempCol);
                        json.put(column.getString(KeyConstant.COLUMN_NAME), (Long) tempCol);
                    } else {
                        if (KeyConstant.isArrayType(column.getString(KeyConstant.COLUMN_TYPE))) {
                            String splitter = column.getString(KeyConstant.COLUMN_SPLITTER);
                            if (Strings.isNullOrEmpty(splitter)) {
                                throw DataXException.asDataXException(MongoDBReaderErrorCode.ILLEGAL_VALUE,
                                        MongoDBReaderErrorCode.ILLEGAL_VALUE.getDescription());
                            } else {
                                ArrayList arr = (ArrayList) tempCol;
                                String tempArrayStr = Joiner.on(splitter).join(arr);
                                // System.out.println(tempArrayStr);
                                json.put(column.getString(KeyConstant.COLUMN_NAME), tempArrayStr);
                            }
                        } else {
                            // System.out.println(tempCol.toString());
                            json.put(column.getString(KeyConstant.COLUMN_NAME), tempCol.toString());
                        }
                    }
                    array.add(json);
                }
            }
            return array;
        }

        public void init() {
            this.userName = readerSliceConfig.getString(KeyConstant.MONGO_USER);
            this.password = readerSliceConfig.getString(KeyConstant.MONGO_PASSWORD);
            this.database = readerSliceConfig.getString(KeyConstant.MONGO_DATABASE);
            this.authDb = readerSliceConfig.getString(KeyConstant.MONGO_AUTHDB, this.database);
            if (!Strings.isNullOrEmpty(userName) && !Strings.isNullOrEmpty(password)) {
                mongoClient = MongoUtil.initCredentialMongoClient(readerSliceConfig, userName, password, authDb);
            } else {
                mongoClient = MongoUtil.initMongoClient(readerSliceConfig);
            }

            // this.collection =
            // readerSliceConfig.getString(KeyConstant.MONGO_COLLECTION_NAME);
            // this.query = readerSliceConfig.getString(KeyConstant.MONGO_QUERY);
            // this.mongodbColumnMeta =
            // JSON.parseArray(readerSliceConfig.getString(KeyConstant.MONGO_COLUMN));
            // this.lowerBound = readerSliceConfig.get(KeyConstant.LOWER_BOUND);
            // this.upperBound = readerSliceConfig.get(KeyConstant.UPPER_BOUND);
            // this.isObjectId = readerSliceConfig.getBool(KeyConstant.IS_OBJECTID);
        }

        public void destroy() {

        }

    }
}
