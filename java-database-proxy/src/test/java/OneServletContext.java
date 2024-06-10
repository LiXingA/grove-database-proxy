//
//  ========================================================================
//  Copyright (c) 1995-2022 Mort Bay Consulting Pty Ltd and others.
//  ------------------------------------------------------------------------
//  All rights reserved. This program and the accompanying materials
//  are made available under the terms of the Eclipse Public License v1.0
//  and Apache License v2.0 which accompanies this distribution.
//
//      The Eclipse Public License is available at
//      http://www.eclipse.org/legal/epl-v10.html
//
//      The Apache License v2.0 is available at
//      http://www.opensource.org/licenses/apache2.0.php
//
//  You may elect to redistribute this code under either of these licenses.
//  ========================================================================
//

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.EnumSet;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletRequestEvent;
import javax.servlet.ServletRequestListener;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ListenerHolder;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.servlets.CrossOriginFilter;
import org.eclipse.jetty.util.resource.PathResource;
import org.eclipse.jetty.util.resource.Resource;

import servlet.databases.AddDatabaseServlet;
import servlet.databases.DatabasesServlet;
import servlet.databases.RemoveDatabaseServlet;
import servlet.databases.UploadFileServlet;
import servlet.mongo.MongoServlet;
import servlet.relations.MssqlServlet;
import servlet.relations.MysqlServlet;
import servlet.relations.PostgreSQLServlet;
import servlet.relations.SnowflakeServlet;

import static javax.servlet.DispatcherType.ASYNC;
import static javax.servlet.DispatcherType.REQUEST;

public class OneServletContext {
    public static Server createServer(int port, Resource baseResource) {
        Server server = new Server(port);

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/server");
        context.setBaseResource(baseResource);
        server.setHandler(context);

        context.addServlet(MysqlServlet.class, "/mysql/*");
        context.addServlet(MssqlServlet.class, "/mssql/*");
        context.addServlet(PostgreSQLServlet.class, "/postgres/*");
        context.addServlet(SnowflakeServlet.class, "/snowflake/*");
        context.addServlet(MongoServlet.class, "/mongodb/*");
        context.addServlet(DatabasesServlet.class, "/databases");
        context.addServlet(AddDatabaseServlet.class, "/addDatabase");
        context.addServlet(RemoveDatabaseServlet.class, "/removeDatabase");
        context.addServlet(UploadFileServlet.class, "/uploadFile");

        // add default servlet (for error handling and static resources)
        context.addServlet(DefaultServlet.class, "/");

        // sprinkle in a few filters to demonstrate behaviors
        context.addFilter(CrossOriginFilter.class, "*", EnumSet.of(REQUEST));

        return server;
    }

    public static void main(String[] args) throws Exception {
        int port = 8080;
        Path tempDir = Paths.get("/database-proxy/java-database-proxy/src/main/webapp");

        Server server = createServer(port, new PathResource(tempDir));

        server.start();
        // server.dumpStdErr();
        server.join();
    }

    public static class TestFilter implements Filter {
        @Override
        public void init(FilterConfig filterConfig) {
        }

        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {
            if (response instanceof HttpServletResponse) {
                HttpServletResponse httpServletResponse = (HttpServletResponse) response;
                httpServletResponse.setHeader("X-TestFilter", "true");
            }
            chain.doFilter(request, response);
        }

        @Override
        public void destroy() {

        }
    }

    public static class InitListener implements ServletContextListener {
        @Override
        public void contextInitialized(ServletContextEvent sce) {
            sce.getServletContext().setAttribute("X-Init", "true");
        }

        @Override
        public void contextDestroyed(ServletContextEvent sce) {
        }
    }

    public static class RequestListener implements ServletRequestListener {
        @Override
        public void requestInitialized(ServletRequestEvent sre) {
            sre.getServletRequest().setAttribute("X-ReqListener", "true");
        }

        @Override
        public void requestDestroyed(ServletRequestEvent sre) {
        }
    }
}