pipeline {
    agent any
    
    environment {
        // MATCH THIS WITH THE CREDENTIAL ID YOU CREATED IN JENKINS
        DOCKER_REGISTRY_CREDENTIALS_ID = 'dockerhub'
        // CHANGE THIS TO YOUR DOCKERHUB USERNAME AND IMAGE NAME
        DOCKER_REPO = 'mayurhub/nodejs-app-devops' 
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                // Pulls code from your GitHub repository
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    echo "Building Docker image..."
                    sh "docker build -t ${DOCKER_REPO}:${IMAGE_TAG} ."
                    sh "docker tag ${DOCKER_REPO}:${IMAGE_TAG} ${DOCKER_REPO}:latest"
                }
            }
        }
        
        stage('Push Image') {
            steps {
                script {
                    echo "Pushing image to Docker Hub..."
                    withCredentials([usernamePassword(credentialsId: DOCKER_REGISTRY_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh "echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USER --password-stdin"
                        sh "docker push ${DOCKER_REPO}:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_REPO}:latest"
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    echo "Deploying application container..."
                    // Stop and remove old container if it exists from a previous build
                    sh "docker stop nodejs-app-container || true"
                    sh "docker rm nodejs-app-container || true"
                    
                    // Run the container on Port 80 (or 3000 depending on what your app listens to)
                    // The assignment asks for Port 80 mapping
                    sh "docker run -d --name nodejs-app-container -p 3001:3000 ${DOCKER_REPO}:latest"
                }
            }
        }
    }
    
    post {
        always {
            echo "Cleaning up local build workspace..."
            // Cleans up dangling images on the EC2 server to save disk storage
            sh "docker rmi ${DOCKER_REPO}:${IMAGE_TAG} || true"
            sh "docker image prune -f"
        }
    }
}
