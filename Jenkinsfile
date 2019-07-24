#!groovy
@Library('jenkins-pipeline-library') import com.gentics.*
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
			yaml """
apiVersion: v1
kind: Pod
spec:
  volumes:
  - name: cache
    hostPath:
      path: /opt/kubernetes/cache
  containers:
  - name: build
    image: """ + buildEnvironmentDockerImage("build/Dockerfile", null, "build") + """
    imagePullPolicy: Always
    command:
    - cat
    tty: true
    resources:
      requests:
        cpu: 1
        memory: 256Mi
    volumeMounts:
    - mountPath: /home/jenkins/.m2/repository
      name: cache
      subPath: maven
    - mountPath: /home/jenkins/.cache/npm
      name: cache
      subPath: npm
    env:
      - name: DOCKER_HOST
        value: tcp://127.0.0.1:2375
  - name: selenium
    image: selenium/standalone-chrome:3.141.59
    imagePullPolicy: Always
    tty: true
    ports:
    - containerPort: 4444
      name: selenium
      protocol: TCP
    resources:
      requests:
        cpu: 1
        memory: 1024Mi
  - name: docker
    image: docker:18-dind
    imagePullPolicy: Always
    securityContext:
      privileged: true
    tty: true
  imagePullSecrets:
  - name: docker-jenkinsbuilds-apa-it
"""
		}
	}

	parameters {
		booleanParam(name: 'unitTests',                 defaultValue: true,  description: 'Whether to run the unit tests')
		booleanParam(name: 'release',                   defaultValue: false, description: 'Whether to perform a release')
		booleanParam(name: 'releaseWithNewChangesOnly', defaultValue: true,  description: 'Release: Abort the build if there are no new changes')
	}

	triggers {
		githubPush()
	}

	options {
		withCredentials([usernamePassword(credentialsId: 'repo.gentics.com', usernameVariable: 'repoUsername', passwordVariable: 'repoPassword')])
		timestamps()
		timeout(time: 4, unit: 'HOURS')
		ansiColor('xterm')
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

				script {
					def newVersion = MavenHelper.getNextSnapShotVersion(version)
					MavenHelper.setVersion(newVersion)
					GitHelper.addCommit('.', gitCommitTag + ' Prepare for the next development iteration (' + newVersion + ')')

					sshagent(["git"]) {
						GitHelper.pushBranch(branchName)
						GitHelper.pushTag(tagName)
					}
				}

				build job: 'alohaeditor-uploadrelease', parameters: [[$class: 'MavenMetadataParameterValue', artifactId: '',
					artifactUrl: '', classifier: '', description: '', groupId: '', name: 'ALOHAEDITOR', packaging: '', version: version]]
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
