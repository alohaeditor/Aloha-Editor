package org.alohaeditor;

import java.util.Properties;

import junit.framework.Test;

import com.gentics.testutils.maven.selenium.qunit.SeleniumQUnitTestSuite;

public class SimpleTest {

	public static Test suite() throws Exception {

		Properties settings = new Properties();
		settings.put("hub_location", "http://selenium-hub.office:4444/wd/hub");
		settings.put("browser", "chrome");
		settings.put("platform", "LINUX");
		settings.put("basePath", "/src/test/unit");
		settings.put("webdriver.chrome.driver", "/opt/selenium/chromedriver_linux64_2.3");
		SeleniumQUnitTestSuite suite = new SeleniumQUnitTestSuite(settings);

		suite.addQunitModule("applymarkup");
		suite.addQunitModule("bold");
		suite.addQunitModule("contenthandler");
		suite.addQunitModule("contenthandlermanager");
//		suite.addQunitModule("core");
		suite.addQunitModule("delete");
		suite.addQunitModule("editable");
		suite.addQunitModule("forwarddelete");
		suite.addQunitModule("indent");
		suite.addQunitModule("inserthtml");
		suite.addQunitModule("insertlinebreak");
		suite.addQunitModule("insertorderedlist");
		suite.addQunitModule("insertparagraph");
		suite.addQunitModule("insertunorderedlist");
		suite.addQunitModule("list");
		suite.addQunitModule("outdent");
		suite.addQunitModule("pluginapi");
		suite.addQunitModule("plugin-blocks");
		suite.addQunitModule("removemarkup");
		suite.addQunitModule("repository2");
		suite.addQunitModule("repository");
		suite.addQunitModule("selection1");
		suite.addQunitModule("selection2");
		suite.addQunitModule("selection3");
		suite.addQunitModule("table");
		suite.addQunitModule("wailangrepo");

		return suite;
	}
}