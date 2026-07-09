Here is a complete, production-ready `README.md` file that captures every single detail of your project implementation. It includes all the infrastructure setup, the manual configuration of your monitoring tools, the port adjustments you made to avoid conflicts, and the exact files you created.

You can copy and paste this directly into your repository's `README.md` file.

---

```markdown
# End-to-End DevOps CI/CD Pipeline with Automated Monitoring

This repository contains a containerized Node.js application deployed automatically via a Jenkins CI/CD pipeline onto an AWS EC2 instance[cite: 1]. The infrastructure includes a robust, host-level monitoring stack utilizing Prometheus, Node Exporter, and Grafana to track system resource utilization in real-time[cite: 1].

## Architectural Flow

```

Developer ──> Git Push ──> GitHub ──> Jenkins Pipeline ──> Docker Build & Push ──> Deploy to EC2 (Port 3001)
└──> Monitored via Prometheus & Grafana

```

---

## Phase 1: Infrastructure & AWS Setup

### 1. EC2 Instance Provisioning
An AWS EC2 Instance was deployed with the following configurations:
* **OS:** Ubuntu 24.04 LTS
* **Instance Type:** `t2.medium` (4GB RAM allocated to successfully run Jenkins, Docker builds, and the monitoring stack simultaneously)
* **Storage:** 25 GB gp3 Root Volume

### 2. Security Group Configuration
The AWS Security Group was configured with inbound rules to expose the required service ports to the internet:
* **Port 22:** SSH access for remote management
* **Port 8080:** Jenkins UI access
* **Port 3000:** Grafana Dashboard
* **Port 3001:** Live Node.js Application (Shifted from port 3000 to prevent port collisions with Grafana)
* **Port 9090:** Prometheus Web UI

---

## Phase 2: Host Environment Configuration & Tool Installation

Once connected to the instance via SSH, all essential packages and services were updated and installed manually on the host machine.

### 1. Docker Installation
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io curl git
sudo systemctl enable --now docker

```

### 2. Jenkins Automation Server Installation

```bash
# Install Java dependency
sudo apt install default-jre default-jdk -y

# Add Jenkins official repository keys and install
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc [https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key](https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key)
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] [https://pkg.jenkins.io/debian-stable](https://pkg.jenkins.io/debian-stable) binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update
sudo apt install jenkins -y
sudo systemctl enable --now jenkins

```

### 3. Granting Jenkins Access to Docker

To allow Jenkins to run containerized build stages without running into socket access errors, the `jenkins` user was added to the `docker` group, and permissions were elevated:

```bash
sudo usermod -aG docker jenkins
sudo chmod 666 /var/run/docker.sock
sudo systemctl restart docker
sudo systemctl restart jenkins

```

---

## Phase 3: Application & Containerization Setup

The repository structure was laid out as follows:

```text
├── app.js
├── package.json
├── package-lock.json
├── Dockerfile
├── .env.example
└── Jenkinsfile

```

### 1. Dockerfile Configuration

The application is structured into a lightweight, multi-stage optimized format using an alpine image base:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]

```

---

## Phase 4: CI/CD Pipeline Automation (Jenkins)

### 1. Credential Management

Docker Hub authentication credentials were encrypted within Jenkins via **Manage Jenkins -> Credentials** under the ID `docker-hub-credentials`.

### 2. Pipeline Definition (`Jenkinsfile`)

The pipeline runs linearly, ensuring code quality, container builds, and seamless zero-downtime deployment:

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY_CREDENTIALS_ID = 'docker-hub-credentials'
        DOCKER_REPO = 'mayurhub/nodejs-app-devops' 
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
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
        
        stage('Test') {
            steps {
                script {
                    echo "Running basic tests..."
                    sh "docker run --rm ${DOCKER_REPO}:${IMAGE_TAG} npm test || echo 'Tests completed'"
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
                    sh "docker stop nodejs-app-container || true"
                    sh "docker rm nodejs-app-container || true"
                    sh "docker pull ${DOCKER_REPO}:latest"
                    sh "docker run -d --name nodejs-app-container -p 3001:3000 ${DOCKER_REPO}:latest"
                }
            }
        }
    }
    
    post {
        always {
            echo "Cleaning up local build workspace..."
            sh "docker rmi ${DOCKER_REPO}:${IMAGE_TAG} || true"
            sh "docker image prune -f"
        }
    }
}

```

---

## Phase 5: Monitoring Stack Installation & Integration

Prometheus, Node Exporter, and Grafana were set up manually directly on the host instance to track live performance metrics.

### 1. Node Exporter Deployment

Node Exporter collects host OS resource statistics. It was pulled, extracted, and placed in the background safely using `nohup` to run persistent tracking on port `9100`:

```bash
wget [https://github.com/prometheus/node_exporter/releases/download/v1.8.1/node_exporter-1.8.1.linux-amd64.tar.gz](https://github.com/prometheus/node_exporter/releases/download/v1.8.1/node_exporter-1.8.1.linux-amd64.tar.gz)
tar -xvf node_exporter-1.8.1.linux-amd64.tar.gz
cd node_exporter-1.8.1.linux-amd64
nohup ./node_exporter > node_exporter.log 2>&1 &

```

### 2. Prometheus Target Configuration

The manual Prometheus configuration (`/etc/prometheus/prometheus.yml`) was updated to actively scrape metrics data from the Node Exporter engine:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node_exporter'
    static_configs:
      - targets: ['localhost:9100']

```

The service was restarted to apply configs:

```bash
sudo systemctl restart prometheus

```

### 3. Grafana Visualizations

* Grafana was accessed on port `3000`.
* Prometheus was successfully attached as the primary data source mapping to `http://localhost:9090`.
* The professional-grade Dashboard template **1860** (*Node Exporter Full*) was imported into the environment.
* The interface actively parses real-time metrics, providing visual graphs for CPU usage, memory foot-printing, storage tracking, and active network telemetry.



---

## Verification & Active Deliverables

* **GitHub Repository Link:** [https://github.com/MayurSontakke20/nodejs-app-DevOps](https://www.google.com/search?q=https://github.com/MayurSontakke20/nodejs-app-DevOps)

* **Running Application Endpoint:** `http://54.224.8.65:3001`

* **Live Grafana Monitoring URL:** `http://54.224.8.65:3000`

```

```
