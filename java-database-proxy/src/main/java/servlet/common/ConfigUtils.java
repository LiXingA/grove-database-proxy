package servlet.common;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

import com.alibaba.datax.common.util.Configuration;

public class ConfigUtils {

    private static final File dbconfigFile = new File(
            ConfigUtils.class.getClassLoader().getResource("dbconfig.json").getFile());
    private static final Configuration dbconfig = Configuration.from(dbconfigFile);
    private static final String DATABASE_PROXY_KEY = "database-proxy";
    static {
        System.err.println(dbconfigFile.toPath());
    }

    private static final File databaseTypesFile = new File(
            ConfigUtils.class.getClassLoader().getResource("databaseTypes.json").getFile());
    private static final Configuration databaseTypes = Configuration.from(databaseTypesFile);
    static {
        System.err.println(databaseTypesFile.toPath());
    }

    public static final int STATUS_OK = 200;
    public static final int RESP_STATUS_OK = 0;
    public static final int RESP_STATUS_FAIL = 1;

    public static Configuration getDatabaseTypes() {
        return databaseTypes;
    }

    public static Configuration getDbconfig() {
        return dbconfig;
    }

    /**
     * proxy databases
     * 
     * @return
     */
    public static Map<String, Configuration> getDatabaseProxys() {
        Map<String, Configuration> map = dbconfig.getMapConfiguration(DATABASE_PROXY_KEY);
        if (map == null) {
            map = new HashMap<String, Configuration>();
        }
        return map;
    }

    public static void writeDatabaseProxys(Map<String, Configuration> proxyConfigs) {
        dbconfig.set(DATABASE_PROXY_KEY, proxyConfigs);
        FileProcessor.rewriteString(dbconfigFile.toPath(), dbconfig.toJSON());
    }

}
