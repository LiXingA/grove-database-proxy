import org.junit.Test;

import servlet.common.ConfigUtils;

import java.io.File;
import java.util.Map;

import com.alibaba.datax.common.util.Configuration;
import com.alibaba.fastjson.JSONArray;

public class TestConfig {
	@Test
	public void testJSON() {
		Map<String, Configuration> readConfig = ConfigUtils.getDatabaseProxys();
		JSONArray array = new JSONArray();
		array.addAll(readConfig.values());
		System.out.println(array.toString());
	}

	public void testCof() {
		Map<String, Configuration> readConfig = ConfigUtils.getDatabaseProxys();
		if (readConfig.containsKey("testxing")) {
			System.out.println(" 包含 testxing");
		}
		System.err.println(readConfig.get(readConfig.keySet().iterator().next()).toJSON());
		ConfigUtils.writeDatabaseProxys(readConfig);
	}

	@Test
	public void testBBB() {
		Configuration from = Configuration
				.from(new File(TestConfig.class.getClassLoader().getResource("dbconfig.json").getFile()));
		Configuration object = from.getConfiguration("database-proxy.my");
		System.out.println(object);
	}

	@Test
	public void testAAA() {
		System.out.println(TestConfig.class.getClassLoader().getResource("dbconfig.json").getFile());
	}
}
