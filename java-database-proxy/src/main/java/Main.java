import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

import org.threeten.bp.Duration;

import com.google.api.gax.retrying.RetrySettings;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.Dataset;
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.QueryJobConfiguration;
import com.google.cloud.bigquery.TableResult;

public class Main {

    public static void main(String[] args) throws Exception {
        // Load credentials from JSON key file. If you can't set the
        // GOOGLE_APPLICATION_CREDENTIALS
        // environment variable, you can explicitly load the credentials file to
        // construct the
        // credentials.
        GoogleCredentials credentials;
        try (InputStream serviceAccountStream = Main.class.getClassLoader().getResourceAsStream("testJ.json")) {
            credentials = ServiceAccountCredentials.fromStream(serviceAccountStream);
        }

        // Instantiate a client.
        BigQuery bigquery = BigQueryOptions.newBuilder()
                .setCredentials(credentials)
                .setRetrySettings(RetrySettings.newBuilder().setTotalTimeout(Duration.ofSeconds(30)).build())
                .build()
                .getService();

        // Use the client.
        System.out.println("Datasets:");
        for (Dataset dataset : bigquery.listDatasets().iterateAll()) {
            System.out.printf("%s%n", dataset.getDatasetId().getDataset());
        }
        // Execute a query
        String query = "SELECT word, COUNT(*) as count FROM `bigquery-public-data.samples.shakespeare` GROUP BY word ORDER BY count DESC LIMIT 10";
        QueryJobConfiguration queryConfig = QueryJobConfiguration.newBuilder(query).build();
        TableResult result = bigquery.query(queryConfig);

        // Print the results
        for (FieldValueList row : result.iterateAll()) {
            System.out.printf("%s: %s\n", row.get("word"), row.get("count"));
        }
    }
}
