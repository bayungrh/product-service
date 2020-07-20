def notifyBuild(String buildStatus = 'STARTED') {
    // build status of null means successful
    buildStatus =  buildStatus ?: 'SUCCESS'

    // Default values
    def colorName = 'RED'
    def colorCode = '#FF0000'
    def subject = "${buildStatus}: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'"
    def summary = "${subject} (${env.BUILD_URL})"

    // Override default values based on build status
    if (buildStatus == 'STARTED') {
      color = 'YELLOW'
      colorCode = '#FFFF00'
    } else if (buildStatus == 'SUCCESS') {
      color = 'GREEN'
      colorCode = '#00FF00'
    } else {
      color = 'RED'
      colorCode = '#FF0000'
    }
}
def getEnvFromBranch(branch) {
  if (branch == 'master') {
    return 'production'
  } else if (branch == 'develop') {
    return 'alpha'
 } else {
	 return 'build not allowed in this branch'
 }
}

pipeline {
  agent any
    environment {
        serviceName = "${JOB_NAME}".split('/').first()
				serverEnv = getEnvFromBranch(env.BRANCH_NAME)
        ecrUri = 'registry.digitalocean.com/bayun-docker-registry'
        gitRepo = "github.com/muhbayu/${serviceName}.git"
        gitCommitHash = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
        shortCommitHash = gitCommitHash.take(7)
    }
  stages {
		stage ('Build preparations') {
				parallel {
						stage ('Env') {
								steps {
										script {
											notifyBuild('STARTED')

											if (env.serverEnv == "production") {
													buildEnv = "release"
													branchName = "production"
													// branchName = sh(returnStdout: true, script: "echo -e \"\$GIT_BRANCH\" | sed 's|/|-|g' | tr -d '[:space:]'").trim()
													prefixGw = "${branchName}/${serviceName}/"
											} else if (env.serverEnv == "alpha") {
													buildEnv = "rc"
													branchName = "alpha"
													prefixGw = "${serviceName}/${branchName}/"
											} else {
													sh 'echo \"environment server not match ${serverEnv} ${GIT_BRANCH} ${env.serverEnv}\" && exit 1'
											}
											tagVersion = "${buildEnv}-${shortCommitHash}"
										}
								}
						}
						stage ('Build Docker') {
								steps {
										script {
												try {
														docker.build("${serviceName}")
														currentBuild.result = 'SUCCESS'
												} catch(e) {
														currentBuild.result = 'FAILURE'
														throw e
												} finally {
														if (currentBuild.result == "FAILURE") {
															notifyBuild(currentBuild.result)
														}
												}
										}
								}
						}

				}
		}
		stage ('Push to registry') {
				when {
						expression {
								currentBuild.result == 'SUCCESS'
						}
				}
				steps {
						script {
								try {
										imageNameTag = "${ecrUri}/${serviceName}:${serverEnv}"
										sh "docker tag ${serviceName} ${imageNameTag}"
										sh "docker push ${imageNameTag}"
										currentBuild.result = 'SUCCESS'
								} catch(e) {
										currentBuild.result = 'FAILURE'
										throw e
								} finally {
										if (currentBuild.result == "FAILURE") {
										notifyBuild(currentBuild.result)
										}
								}
						}
				}
		}
    stage('Deploy Production') {
      when {
					expression {
							currentBuild.result == 'SUCCESS'
					}
			}
      steps {
        script {
          try {
							if(env.serverEnv == 'alpha') {
								echo "${serviceName}-${branchName}"
								// sh "./modification-yaml.sh ${serviceName}-${branchName} ${prefixGw} ${ecrUri}/${serviceName}:${tagVersion} alpha ${serviceName}-worker-${branchName}"
								// sh '''
								// 	kubectl apply -f kube-yaml/deployment.yaml -n alpha
								// '''
							} else if (env.serverEnv == 'production') {
								echo "${serviceName}-${branchName}"
								sh "./modification-yaml.sh ${serviceName}-${branchName} ${ecrUri}/${serviceName}:${serverEnv} production"
								sh '''
									kubectl apply -f /var/lib/jenkins/.kube/kube-template/gateway-ingress.yaml
									doctl registry kubernetes-manifest | kubectl apply -f -
									kubectl apply -f kube-yaml/deployment.yaml -n default
								'''
									// try {
									// 		timeout(time: 1, unit: 'DAYS') {
									// 				env.userChoice = input message: 'Do you want to Release this build?',
									// 				parameters: [choice(name: 'Versioning Service', choices: 'no\nyes', description: 'Choose "yes" if you want to release this build')]
									// 		}
									// 		if (userChoice == 'no') {
									// 				echo "User refuse to release this build, stopping...."
									// 		}
									// } catch(Exception err) {
									// 		def user = err.getCauses()[0].getUser()
									// 		if('SYSTEM' == user.toString()) {
									// 				echo "timeout reason"
									// 		} else {
									// 				echo "Aborted by: [${user}]"
									// 		}
									// }
							}

							currentBuild.result == "SUCCESS"
					} catch(e) {
							currentBuild.result == "FAILURE"
							throw e
					} finally {
							if (currentBuild.result == "FAILURE") {
								notifyBuild(currentBuild.result)
							}
					}
        }
      }
    }
    stage('Clean') {
      steps {
        echo 'clean'
      }
    }
  }
}