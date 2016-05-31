properties([[$class: 'ParametersDefinitionProperty', parameterDefinitions: [[$class: 'BooleanParameterDefinition', name: 'release', defaultValue: false]]]])
if (!Boolean.valueOf(release)) {
	stage 'Release Build'
	echo "Skipped"
	
	stage 'Build'
	echo "Building " + env.BRANCH_NAME
	node('dockerSlave') {
		def mvnHome = tool 'M3'
		checkout scm
		sh "${mvnHome}/bin/mvn -B clean test -Dmaven.test.failure.ignore"
		step([$class: 'JUnitResultArchiver', testResults: '**/target/surefire-reports/*.xml'])
	}
} else {
	node('dockerSlave') {
	    def mvnHome = tool 'M3'
	    
	    sh "rm -rf *"
	    sh "rm -rf .git"
	    checkout scm
	    checkout([$class: 'GitSCM', branches: [[name: '*/' + env.BRANCH_NAME]], extensions: [[$class: 'CleanCheckout'],[$class: 'LocalBranch', localBranch: env.BRANCH_NAME]]])

	    stage 'Release Build'
	    sshagent(['601b6ce9-37f7-439a-ac0b-8e368947d98d']) {
	        sh "${mvnHome}/bin/mvn -B release:prepare release:perform -Dresume=false -DignoreSnapshots=true -Darguments=\"-DskipTests\""
	    }
	}
}