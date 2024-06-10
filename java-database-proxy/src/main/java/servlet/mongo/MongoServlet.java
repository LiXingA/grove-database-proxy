package servlet.mongo;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.alibaba.datax.common.util.Configuration;
import com.alibaba.datax.plugin.reader.mongodbreader.MongoDBReaderTest;
import com.alibaba.datax.plugin.reader.mongodbreader.MongoDBReaderTest.Task;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.google.common.base.Strings;

import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import servlet.common.CommonUtils;
import servlet.common.ConfigUtils;
import servlet.common.DatabaseType;

enum OperationType {
    listCollectionNames, runCommand, find, listFields;
}

// @WebServlet(urlPatterns = "/mongodb/*")
public class MongoServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    static Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);

    static {
        root.setLevel(Level.INFO);
    }

    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("text/html;charset=utf-8");
        String uri = String.format("/%s/", DatabaseType.MongoDB.getShortName());
        String name = req.getRequestURI().substring(req.getContextPath().length() + uri.length());
        Map<String, Configuration> databaseProxys = ConfigUtils.getDatabaseProxys();
        if (databaseProxys.containsKey(name)) {
            Configuration configuration = databaseProxys.get(name);
            Task task = new MongoDBReaderTest.Task(configuration);
            task.init();
            StringBuffer jb = new StringBuffer();
            String line = null;
            try {
                BufferedReader reader = req.getReader();
                while ((line = reader.readLine()) != null) {
                    jb.append(line);
                }
                Configuration sql = Configuration.from(Configuration.from(jb.toString()).getString("sql"));
                OperationType operationType = OperationType.values()[sql.getInt("operationType", 0)];
                JSONArray array;
                switch (operationType) {
                    case listCollectionNames:
                        array = task.listCollectionNames();
                        break;
                    case listFields:
                        array = task.listFields(sql.getString("collectionName"));
                        break;
                    case runCommand:
                        array = task.runCommand(sql.getString("command"));
                        break;
                    case find:
                        array = task.find(sql.getString("collectionName"), sql.getString("filter", "{}"),
                                sql.getString("projection", "{}"), JSON.parseArray(sql.getString("column", "[]")),
                                sql.getString("lowerBound", "min"), sql.getString("upperBound", "max"),
                                sql.getBool("isObjectId", true), sql.getInt("limit", 1000), sql.getString("sort", "{}"),
                                sql.getInt("skip", 0));
                        break;
                    default:
                        resp.getWriter().append(CommonUtils.assembleErrMessage("Operation type not support!"));
                        return;
                }
                resp.getWriter().append(CommonUtils.assembleMessage(array, null));
            } catch (Exception e) {
                e.printStackTrace();
                resp.getWriter().append(CommonUtils.assembleErrMessage(e.getMessage()));
            }
        } else {
            resp.getWriter().append(CommonUtils.assembleErrMessage("Can't find config!"));
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        this.doPost(req, resp);
    }
}
