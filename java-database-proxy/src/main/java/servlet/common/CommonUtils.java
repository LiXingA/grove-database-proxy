package servlet.common;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

public class CommonUtils {
    public static String assembleErrMessage(String error) {
        JSONObject json = new JSONObject();
        json.put("error", error);
        return json.toJSONString();
    }

    public static String assembleMessage(JSONArray array, JSONObject columns) {
        JSONObject json = new JSONObject();
        json.put("data", array);
        json.put("columns", columns);
        return json.toJSONString();
    }
}
