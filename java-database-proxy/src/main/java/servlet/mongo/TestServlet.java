package servlet.mongo;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

// @WebServlet(value = "/Test")
public class TestServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // set the response content type
        response.setContentType("text/html;charset=utf-8");
        PrintWriter out = response.getWriter();

        // Print hello message to the client browser in
        // response object
        out.println(String.format(String.format("<div>%s</div>", request.getRequestURL().toString())));
        out.println(String.format(String.format("<table>")));
        out.println(String.format("<tr><th>Method</th><th>URL-Decoded</th><th>Result</th></tr>"));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getContextPath()", "",
                request.getContextPath()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getLocalName()", "",
                request.getLocalName()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getLocalPort()", "",
                request.getLocalPort()));
        out.println(
                String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getMethod()", "", request.getMethod()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getPathInfo()", true,
                request.getPathInfo()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getProtocol()", "",
                request.getProtocol()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getQueryString()", false,
                request.getQueryString()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getRequestedSessionId()", false,
                request.getRequestedSessionId()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getRequestURI()", false,
                request.getRequestURI()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getRequestURL()", false,
                request.getRequestURL()));
        out.println(
                String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getScheme()", "", request.getScheme()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getServerName()", "",
                request.getServerName()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getServerPort()", "",
                request.getServerPort()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getServletPath()", "",
                request.getServletPath()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getParameterNames()", true,
                request.getParameterNames()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getServerPort()", true,
                request.getServerPort()));
        out.println(String.format("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", "getParameter(\"a\")", true,
                request.getParameter("a")));
        out.println(String.format(String.format("</table>")));
        out.close();

        // getLocalAddr() 127.0.0.1
        // getLocalName() 30thh.loc
        // getLocalPort() 8480
        // getMethod() GET
        // getPathInfo() yes /a?+b
        // getProtocol() HTTP/1.1
        // getQueryString() no p+1=c+d&p+2=e+f
        // getRequestedSessionId() no S%3F+ID
        // getRequestURI() no /app/test%3F/a%3F+b;jsessionid=S+ID
        // getRequestURL() no http://30thh.loc:8480/app/test%3F/a%3F+b;jsessionid=S+ID
        // getScheme() http
        // getServerName() 30thh.loc
        // getServerPort() 8480
        // getServletPath() yes /test?
        // getParameterNames() yes [p 2, p 1]
        // getParameter("p 1") yes c d
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        this.doPost(req, resp);
    }
}
