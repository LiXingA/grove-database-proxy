package servlet.databases;

import java.io.BufferedReader;
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

// @WebServlet(value = "/removeDatabase")
public class RemoveDatabaseServlet extends HttpServlet {

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		resp.setContentType("text/html;charset=utf-8");
		JSONObject json = new JSONObject();
		StringBuffer jb = new StringBuffer();
		String line = null;
		try {
			BufferedReader reader = req.getReader();
			while ((line = reader.readLine()) != null) {
				jb.append(line);
			}
		} catch (Exception e) {
			json.put("status", ConfigUtils.RESP_STATUS_FAIL);
			json.put("error", e.getMessage());
			resp.getWriter().append(json.toJSONString());
			return;
		}
		Configuration from = Configuration.from(jb.toString());
		String name = from.getString("name");
		Map<String, Configuration> databaseProxys = ConfigUtils.getDatabaseProxys();
		Configuration configuration = databaseProxys.get(name);
		if (configuration == null) {
			json.put("status", ConfigUtils.RESP_STATUS_FAIL);
			json.put("error", String.format("A database proxy for \"%s\" not exists", name));
			resp.getWriter().append(json.toJSONString());
			return;
		} else {
			configuration.set("disabled", true);
		}
		ConfigUtils.writeDatabaseProxys(databaseProxys);
		json.put("status", ConfigUtils.RESP_STATUS_OK);
		json.put("msg", String.format("Configuration removed for \"%s\" success", name));
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
