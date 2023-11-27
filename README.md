
follow below command to deploy nodejs app in new server 

    2  sudo apt update
    
    3  sudo apt install apt-transport-https ca-certificates curl software-properties-common
    
    4  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    5  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
    6  apt-cache policy docker-ce
    7  sudo apt install docker-ce
    8  sudo systemctl start docker
    9  sudo systemctl enable docker
   10  sudo docker --version
   11  sudo systemctl status docker
   12  ssh-keygen -t ed25519 -C mayursontakke684@gmail.com
   13  ll
   14  cd .ssh/
   15  ll
   16  cat id_ed25519.pub
   17  cd
   18  cd /home/
   19  ll
   20  git clone git@github.com:MayurSontakke20/react-app-DevOps.git
   21  ll
   22  cd react-app-DevOps/
   23  ll
   24  nano Do
   25  ll
   26  nano package.json
   27  nano package-lock.json
   28  ll
   29  nano Dockerfile
   30  ll
   31  docker build -t nodejs:app -f Dockerfile .
   32  docker images
   33  docker run -d -p 8081:3000 --name nodejs-app --restart=always node:14
   34  docker images
   35  docker run -d -p 8081:3000 --name nodejs-app --restart=always nodejs:app
   36  docker ps -a
   37  ll
   38  history
