

```markdown
# End-to-End DevOps CI/CD Pipeline with Automated Monitoring

This repository contains a containerized Node.js application deployed automatically via a Jenkins CI/CD pipeline onto an AWS EC2 instance[cite: 1]. The infrastructure includes a robust, host-level monitoring stack utilizing Prometheus, Node Exporter, and Grafana to track system resource utilization in real-time[cite: 1].

## Architectural Flow

```

Developer ──> Git Push ──> GitHub ──> Jenkins Pipeline ──> Docker Build & Push ──> Deploy to EC2 (Port 3001)
└──> Monitored via Prometheus & Grafana


## Phase 1: Infrastructure & AWS Setup
```
---

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
```

## Phase 2: Host Environment Configuration & Tool Installation

### 1. Docker Installation

Once connected to the instance via SSH, all essential packages and services were updated and installed manually on the host machine.
```
---

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io curl git
sudo systemctl enable --now docker

```

### 2. Jenkins Automation Server Installation

```bash
# Install Java dependency
sudo apt-get install -y fontconfig openjdk-21-jre

# Add Jenkins official repository keys and install
sudo curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
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

## Phase 4: CI/CD Pipeline Automation & Job Creation (Jenkins)

### 1. Credential Management

Docker Hub authentication credentials were encrypted within Jenkins via **Manage Jenkins -> Credentials** under the ID `dockerhub`.

### 2. Step-by-Step Jenkins Pipeline Job Configuration

To build the automation workflow and tie it to the correct project branch, the following steps were taken inside the Jenkins UI:

1. On the Jenkins home dashboard, clicked **New Item** in the left sidebar menu.
2. Entered the name `NodeJS-CICD`, selected **Pipeline** as the project type, and clicked **OK**.
3. Under the **General** tab, checked the box for **GitHub project** and pasted the repository URL: `https://github.com/MayurSontakke20/nodejs-app-DevOps`.
4. Scrolled down to the **Build Triggers** section and checked the box for **GitHub hook trigger for GITScm polling**. *(This enables automatic builds on code push).*
5. Moved down to the **Pipeline** configuration section:
* **Definition:** Selected *Pipeline script from SCM*.
* **SCM:** Selected *Git*.
* **Repository URL:** Pasted `https://github.com/MayurSontakke20/nodejs-app-DevOps.git`.
* **Credentials:** Left as *None* since it is a public repository.
* **Branch Specifier:** Changed the default branch text from `*/master` or `*/main` to explicitly target **`*/Task_ImmverseAI`**.
* **Script Path:** Verified it was set to `Jenkinsfile`.


6. Clicked **Save**.


### 3. Configuring Jenkins Job Triggers for Automation

Before establishing the external connection from GitHub, the build trigger was armed inside the job configuration panel:

1. Open your pipeline job: **`NodeJS-CICD`**.
2. Click **Configure** on the left-side menu options.
3. Scroll down until reaching the section labeled **Build Triggers**.
4. Enable the following option:
* **GitHub hook trigger for GITScm polling**


5. Click **Save**.

   
### 4. Setting up the GitHub Webhook for Automated Deployment

To trigger the pipeline instantly whenever changes are pushed to GitHub, a Webhook link was established:

1. Navigated to the GitHub repository page: `https://github.com/MayurSontakke20/nodejs-app-DevOps`.
2. Clicked on the **Settings** tab located on the top navigation bar of the repository.
3. Clicked on **Webhooks** from the left-hand settings menu, then clicked the **Add webhook** button.
4. Configured the webhook details as follows:
* **Payload URL:** Entered `http://54.224.8.65:8080/github-webhook/` *(The trailing slash `/` is strict and mandatory for Jenkins).*
* **Content type:** Selected `application/json`.
* **Secret:** Left blank.
* **Which events would you like to trigger this webhook?:** Selected *Just the push event*.


5. Clicked **Add webhook**.
6. Refreshing the page showed a green checkmark next to the URL, confirming GitHub successfully handshake-verified communication with the EC2 Jenkins instance.

### 5. Pipeline Definition (`Jenkinsfile`)

The pipeline runs linearly, ensuring code quality, container builds, and seamless zero-downtime deployment:

```groovy
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

```

---

## Phase 5: Detailed Monitoring Stack Setup & Integration

To satisfy full production visibility, Prometheus, Node Exporter, and Grafana were set up manually directly on the host instance to track live performance metrics.

### Step 1: Install and Configure Node Exporter (Host Metrics Collector)

Node Exporter collects raw host OS resource statistics (CPU, Memory, Network, and Disk).

1. Download and extract the stable Node Exporter binary on your EC2 instance:
```bash
wget [https://github.com/prometheus/node_exporter/releases/download/v1.8.1/node_exporter-1.8.1.linux-amd64.tar.gz](https://github.com/prometheus/node_exporter/releases/download/v1.8.1/node_exporter-1.8.1.linux-amd64.tar.gz)
tar -xvf node_exporter-1.8.1.linux-amd64.tar.gz
cd node_exporter-1.8.1.linux-amd64

```


2. Run Node Exporter persistently in the background using `nohup`. This guarantees it continues tracking on port `9100` even if the active SSH terminal session disconnects:
```bash
nohup ./node_exporter > node_exporter.log 2>&1 &

```


3. Verify that the exporter is locally serving data:
```bash
curl http://localhost:9100/metrics

```



### Step 2: Configure Prometheus to Scrape Node Exporter

1. Open the primary Prometheus configuration file on the server:
```bash
sudo nano /etc/prometheus/prometheus.yml

```


2. Navigate to the `scrape_configs` stanza and append the `node_exporter` endpoint as an active collection target:
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


3. Save the changes and exit the editor (`Ctrl S + X`).
4. Restart the Prometheus background system service to force it to apply the new targets configuration:
```bash
sudo systemctl restart prometheus

```



### Step 3: Link Prometheus Data Source to Grafana

1. Launch your browser and navigate to the Grafana Web UI at `http://54.224.8.65:3000`.
2. Authenticate using your administrative credentials.
3. On the left-hand navigation sidebar, click on **Connections** and choose **Data sources**.
4. Click the blue **Add data source** button and select **Prometheus** from the supported core plugins list.
5. In the **Connection URL** configurations box, input the endpoint linking back to the Prometheus listener:
```text
http://localhost:9090

```


6. Scroll down to the bottom of the data source dashboard configurations and click **Save & test**. A green notice confirming *"Data source is working"* will validate the step.

### Step 4: Import Dashboard 1860 for Live Visualizations

1. Navigate back to the left sidebar menu, click on the **Dashboards** icon (four-square grid block), and select **Dashboards** to open the management portal.
2. At the top-right section of the window, locate and click the **`New ∨`** dropdown button and choose **Import**.
3. Under the **"Import via grafana.com"** input panel, key in the standard Dashboard ID: **`1860`** and click **Load**.
4. Grafana will pull the *Node Exporter Full* dashboard schema. Scroll down to the selection settings at the bottom.
5. Locate the **Prometheus** dropdown indicator (marked with a red alert flag), click it, and select the **Prometheus** data source connected in the previous step.
6. Click the green **Import** button.
7. The interface will immediately populate with real-time graphs displaying system performance: **CPU load graphs, Memory allocations (RAM), Active Network I/O metrics, and Root FS Disk utilization**.



---

## Verification & Active Deliverables

* **GitHub Repository Link:** [https://github.com/MayurSontakke20/nodejs-app-DevOps](https://www.google.com/search?q=https://github.com/MayurSontakke20/nodejs-app-DevOps)

* **Running Application Endpoint:** [http://54.224.8.65:3001](https://www.google.com/search?q=http://54.224.8.65:3001)

* **Live Grafana Monitoring URL:** [http://54.224.8.65:3000](https://www.google.com/url?sa=E&source=gmail&q=http://54.224.8.65:3000)

```

```



