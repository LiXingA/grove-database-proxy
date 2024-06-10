# database-proxy (java)

The database proxy is a simple **Java** webserver that accepts secure requests from your Grove notebooks, and proxies queries to a PostgreSQL or MySQL database — one that is not necessarily exposed to the web. You can use the database proxy to securely connect to databases on your local computer, on an intranet or within a VPN.

## Installation
- vscode
- Java extension for Java
- Maven extension for Java
- **run ./java-database-proxy/src/main/java/StartServer** (which use Jetty embed Web Container) or Tomcat for Java
- db configuration here:./java-database-proxy/src/main/java/resource/dbconfig
## war if using Tomcat
- war:exploded 
- war:war
- target/server -> Debug on Tomcat Server

## maven run target class
mvn  exec:java -Dexec.mainClass="Main"

## maven to a single jar
mvn clean compile assembly:single
java -jar target\server-1.0-SNAPSHOT-jar-with-dependencies.jar