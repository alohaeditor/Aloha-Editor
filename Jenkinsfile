#!groovy
@Library('jenkins-pipeline-library')
import com.gentics.*

JobContext.set(this)



final def gitCommitTag      = '[Jenkins | ' + env.JOB_BASE_NAME + ']';


def branchName = null
String version = null
String tagName = null

pipeline {
	agent {
		kubernetes {
			label env.BUILD_TAG
			defaultContainer 'build'
			yaml ocpWorker("""
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: build
    image: docker.gentics.com/alohaeditor/build-container:latest
    imagePullPolicy: Always
    command:
    - cat
    tty: true
    resources:
      requests:
        cpu: '0'
        memory: '0'
      limits:
        cpu: '0'
        memory: '0'
  - name: docker
  - name: jnlp
  - name: selenium
    image: selenium/standalone-chrome:3.141.59
    tty: true
    ports:
      - containerPort: 4444
        name: selenium
        protocol: TCP
    resources:
      requests:
        cpu: '0'
        memory: '0'
      limits:
        cpu: '0'
        memory: '0'
  imagePullSecrets:
    - name: jenkins-docker-pull-secret
""")
		}
	}

	parameters {
		booleanParam(name: 'unitTests',                 defaultValue: true,  description: 'Whether to run the unit tests')
		booleanParam(name: 'release',                   defaultValue: false, description: 'Whether to perform a release')
		booleanParam(name: 'releaseWithNewChangesOnly', defaultValue: true,  description: 'Release: Abort the build if there are no new changes')
		booleanParam(name: 'deployTesting',             defaultValue: false, description: 'Deploy the snapshot version (only valid, if not release)')
		string(name:       'forceVersion',              defaultValue: "",  description: "If not empty, the build/release will be done using this POM version")
	}

	triggers {
		githubPush()
	}

	options {
		withCredentials([usernamePassword(credentialsId: 'docker.gentics.com', usernameVariable: 'repoUsername', passwordVariable: 'repoPassword')])
		timestamps()
		timeout(time: 4, unit: 'HOURS')
		ansiColor('xterm')
	}

	stages {
		stage('Build, Deploy') {
			steps {
				githubBuildStarted()

				script {
					version    = params.forceVersion
					branchName = GitHelper.fetchCurrentBranchName()

					if (!version && Boolean.valueOf(params.release)) {
						version = MavenHelper.getVersion()
					}

					if (version) {
						if (Boolean.valueOf(params.release)) {
							version = MavenHelper.transformSnapshotToReleaseVersion(version)
						}
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
					} else if (Boolean.valueOf(params.deployTesting)) {
						// deploy the (snapshot) artifacts, but not the changelog
						sh 'mvn -B -U clean deploy -Dchangelog.phase=never ' + (Boolean.valueOf(params.unitTests) ? '' : ' -DskipTests')
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

				script {
					def newVersion = MavenHelper.getNextSnapShotVersion(version)
					MavenHelper.setVersion(newVersion)
					GitHelper.addCommit('.', gitCommitTag + ' Prepare for the next development iteration (' + newVersion + ')')

					sshagent(["git"]) {
						GitHelper.pushBranch(branchName)
						GitHelper.pushTag(tagName)
					}
				}

				build job: '../alohaeditor-uploadrelease', parameters: [[$class: 'MavenMetadataParameterValue', artifactId: '',
					artifactUrl: '', classifier: '', description: '', groupId: '', name: 'ALOHAEDITOR', packaging: '', version: version]]
			}
		}
	}

	post {
		always {
			githubBuildEnded()
		}
	}
}
