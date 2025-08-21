start:
	npm start

build:
	npm run build

serve:
	serve -s build

# Docker commands
docker-build:
	docker build -t learning-experiment-app .

docker-run:
	docker run -p 3000:80 learning-experiment-app

docker-dev:
	docker build -t learning-experiment-app . && docker run -p 3000:80 learning-experiment-app

# Clean up Docker images
docker-clean:
	docker rmi learning-experiment-app

docker-clean-all:
	docker system prune -f
