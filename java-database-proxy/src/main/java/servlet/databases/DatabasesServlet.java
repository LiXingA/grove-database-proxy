package servlet.databases;

import java.io.IOException;
import java.util.Map;
import java.util.Map.Entry;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.alibaba.datax.common.util.Configuration;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import servlet.common.ConfigUtils;

// @WebServlet(value = "/databases")
public class DatabasesServlet extends HttpServlet {

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		resp.setContentType("text/html;charset=utf-8");
		Map<String, Configuration> databaseProxys = ConfigUtils.getDatabaseProxys();
		JSONObject json = new JSONObject();
		json.put("status", ConfigUtils.RESP_STATUS_OK);
		JSONArray array = new JSONArray();
		for (Configuration value : databaseProxys.values()) {
			if (!value.getBool("disabled", false)) {
				array.add(JSONObject.parse(value.toJSON()));
			}
		}
		json.put("data", array);
		resp.getWriter().append(json.toJSONString());
	}
}
