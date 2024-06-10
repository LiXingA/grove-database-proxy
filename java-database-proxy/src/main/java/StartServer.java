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

import static javax.servlet.DispatcherType.REQUEST;
import org.eclipse.jetty.xml.XmlConfiguration;
import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.util.log.StdErrLog;
import java.io.File;
import java.io.FileInputStream;
import java.net.URI;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.EnumSet;
import java.awt.Desktop;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlets.CrossOriginFilter;
import org.eclipse.jetty.util.resource.PathResource;
import org.eclipse.jetty.util.resource.Resource;

import servlet.databases.AddDatabaseServlet;
import servlet.databases.DatabasesServlet;
import servlet.databases.RemoveDatabaseServlet;
import servlet.databases.UploadFileServlet;
import servlet.mongo.MongoServlet;
import servlet.relations.BigQueryServlet;
import servlet.relations.MssqlServlet;
import servlet.relations.MysqlServlet;
import servlet.relations.PostgreSQLServlet;
import servlet.relations.SnowflakeServlet;

public class StartServer {
    public static Server createServer(int port, String contextPath, Resource baseResource) throws Exception {
        // XmlConfiguration configuration = new XmlConfiguration(
        // StartServer.class.getResourceAsStream("jetty.xml"));

        // Create a new server object from the configuration
        // Server server = (Server) configuration.configure();
        Server server = new Server(port);
        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath(contextPath);
        context.setBaseResource(baseResource);
        server.setHandler(context);

        context.addServlet(BigQueryServlet.class, "/bigquery/*");
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
        String contextPath = "/server";
        Path tempDir = args.length > 0 ? Paths.get(new File(args[0]).getAbsolutePath())
                : Paths.get(new File("/database-proxy/java-database-proxy/src/main/webapp").getAbsolutePath());

        Server server = createServer(port, contextPath, new PathResource(tempDir));
        server.start();
        String url = String.format("http://localhost:%s%s", port, contextPath);

        if (Desktop.isDesktopSupported()) {
            // Windows
            Desktop.getDesktop().browse(new URI(url));
        } else {
            // Ubuntu
            Runtime runtime = Runtime.getRuntime();
            runtime.exec("/usr/bin/firefox -new-window " + url);
        }
        // server.dumpStdErr();
        server.join();
    }
}