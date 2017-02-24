#!groovy

// The GIT repository for this pipeline lib is defined in the global Jenkins setting
@org.jenkinsci.plugins.workflow.libs.Library('jenkins-pipeline-library')
import com.gentics.*

// Make the helpers aware of this jobs environment
JobContext.set(this)



final def sshAgent          = '601b6ce9-37f7-439a-ac0b-8e368947d98d'
final def gitCommitTag      = '[Jenkins | ' + env.JOB_BASE_NAME + ']';
final def mattermostChannel = "#testjenkins"



def branchName = null
String version = null
String tagName = null

pipeline {
	agent {
		label 'alohaeditor'
	}

	parameters {
        booleanParam(name: 'release', defaultValue: false, description: 'Whether to perform a release')
        booleanParam(name: 'unitTests', defaultValue: true, description: 'Whether to run the unit tests')
        booleanParam(name: 'cleanupWorkspace', defaultValue: true, description: 'Whether to clean the workspace afterwards')
    }

	stages {
		stage('Checkout') {
			steps {
				sh "rm -rf *"

				sshagent([sshAgent]) {
					checkout scm

					script {
						branchName = GitHelper.fetchCurrentBranchName()
					}
				}
			}
		}

		stage('Build, Deploy') {
			steps {
				script {
					if (!version && Boolean.valueOf(params.release)) {
						version = MavenHelper.getVersion()
					}

					if (version) {
						version = MavenHelper.transformSnapshotToReleaseVersion(version)
						MavenHelper.setVersion(version)
					}

					currentBuild.description = version

					if (Boolean.valueOf(params.release)) {
						// Release
						echo "Invoking release build on branch " + branchName + ".."

						currentBuild.description += ' - Release'

						if (Boolean.valueOf(releaseWithNewChangesOnly)) {
							def lastCommitMessage = GitHelper.getLastCommitMessage().trim()

							if (lastCommitMessage.startsWith(gitCommitTag)) {
								error "Aborting the release build because there are no new changes. Last commit message is: \"" + lastCommitMessage + "\""
							}
						}

						sh 'mvn -B -U clean deploy' + (Boolean.valueOf(params.unitTests) ? '' : ' -DskipTests')

						// Add the modified pom.xml and the generated changelog file
						def releaseMessage = 'Release of version ' + version
						GitHelper.addCommit('.', gitCommitTag + ' ' + releaseMessage)

						tagName = version
						GitHelper.addTag(tagName, releaseMessage)
					} else {
						sh 'mvn -B -U clean package' + (Boolean.valueOf(params.unitTests) ? '' : ' -DskipTests')
					}
				}
			}
		}

		stage("Git push") {
			when {
				expression {
					return Boolean.valueOf(release)
				}
			}

			steps {
				sshagent([sshAgent]) {
					script {
						GitHelper.pushBranch(branchName)
						GitHelper.pushTag(tagName)
					}
				}
			}
		}
	}

	post {
		always {
			script {
				if (Boolean.valueOf(params.cleanupWorkspace)) {
					// Cleanup
					step([$class: 'WsCleanup'])
				}
			}

			script {
				// Notify
				MattermostHelper.sendStatusNotificationMessage(mattermostChannel)
			}
		}
	}
}
