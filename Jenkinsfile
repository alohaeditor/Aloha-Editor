#!groovy
@Library('jenkins-pipeline-library') import com.gentics.*
JobContext.set(this)



final def gitCommitTag      = '[Jenkins | ' + env.JOB_BASE_NAME + ']';


def branchName = null
String version = null
String tagName = null

pipeline {
	agent {
		label 'jenkins-slave-and-selenium'
	}

	parameters {
		booleanParam(name: 'unitTests',                 defaultValue: true,  description: 'Whether to run the unit tests')
		booleanParam(name: 'release',                   defaultValue: false, description: 'Whether to perform a release')
		booleanParam(name: 'releaseWithNewChangesOnly', defaultValue: true,  description: 'Release: Abort the build if there are no new changes')
	}

    triggers {
        githubPush()
    }

	stages {
		stage('Build, Deploy') {
			steps {
				githubBuildStarted()

				script {
					branchName = GitHelper.fetchCurrentBranchName()

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

						if (Boolean.valueOf(params.releaseWithNewChangesOnly)) {
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

			post {
				always {
					script {
						if (Boolean.valueOf(params.unitTests)) {
							junit  "**/target/surefire-reports/*.xml"
						}
					}
				}
			}
		}

		stage("Publish release") {
			when {
				expression {
					return Boolean.valueOf(release)
				}
			}

			steps {
				echo "Please move the contents of the Artifactory repository 'lan.releases.staging.alohaeditor' to 'lan.releases' now or the next step will fail"
				input message: 'Publish the release now?', ok: 'Yes, I have moved the Artifactory files, publish the release now'
				build job: 'alohaeditor-uploadrelease', parameters: [[$class: 'MavenMetadataParameterValue', artifactId: '',
					artifactUrl: '', classifier: '', description: '', groupId: '', name: 'ALOHAEDITOR', packaging: '', version: version]]

				script {
					version = MavenHelper.getNextSnapShotVersion(version)
					MavenHelper.setVersion(version)
					GitHelper.addCommit('.', gitCommitTag + ' Prepare for the next development iteration (' + version + ')')

					sshagent(["git"]) {
						script {
							GitHelper.pushBranch(branchName)
							GitHelper.pushTag(tagName)
							
						}
					}
				}
			}
		}
	}

	post {
		always {
			githubBuildEnded()
			notifyMattermostUsers()
		}
	}
}
