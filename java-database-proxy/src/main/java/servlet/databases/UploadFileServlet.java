package servlet.databases;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Map;
import java.util.Map.Entry;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;

import com.alibaba.datax.common.util.Configuration;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import servlet.common.ConfigUtils;
import servlet.common.FileProcessor;

// @WebServlet(value = "/uploadFile")
public class UploadFileServlet extends HttpServlet {

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		resp.setContentType("text/html;charset=utf-8");
		JSONObject json = new JSONObject();
		String fileName = req.getParameter("fileName");
		String data = req.getParameter("data");
		if (StringUtils.isBlank(fileName) || StringUtils.isBlank(data)) {
			json.put("status", ConfigUtils.RESP_STATUS_FAIL);
			json.put("error", "Params Error!");
			resp.getWriter().append(json.toJSONString());
			return;
		}

		File file = new File("./upload/" + fileName);
		if (!file.exists()) {
			file.createNewFile();
		}
		FileProcessor.rewriteString(file.toPath(), data);
		json.put("status", ConfigUtils.RESP_STATUS_OK);
		json.put("msg", String.format("Upload file \"%s\" success", fileName));
		resp.getWriter().append(json.toJSONString());
	}
}
