package servlet.relations;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.alibaba.datax.plugin.rdbms.reader.CommonRdbmsReaderTest;

import servlet.common.DatabaseType;

// @WebServlet(urlPatterns = "/bigquery/*")
public class BigQueryServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        CommonRdbmsReaderTest.doPost(req, resp, String.format("/%s/", DatabaseType.BigQuery.getShortName()));
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        this.doPost(req, resp);
    }
}
