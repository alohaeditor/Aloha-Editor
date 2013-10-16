package org.alohaeditor;

import junit.framework.Test;

import com.gentics.testutils.maven.selenium.qunit.SeleniumQUnitTestSuite;

public class SimpleTest {

	public static Test suite() throws Exception {
		SeleniumQUnitTestSuite suite = new SeleniumQUnitTestSuite();
		return suite;
	}
}