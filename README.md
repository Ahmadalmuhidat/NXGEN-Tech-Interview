## Summary
I built this project using a layered architecture with a frontend, backend, and database, the frontend was created with React and styled using Tailwind CSS, on the backend, I used Node.js, and MySQL handled the database, I also set up RabbitMQ in a separate container to make sure messages aren’t lost if the backend goes down.

To keep the data live on the client side, I implemented Server-Sent Events (SSE), this way, clients receive real-time updates automatically, without having to refresh the browser or fetch the data manually.

I chose SSE (Server-Sent Events) over WebSockets because WebSockets are better suited for two-way communication, like messaging, SSE on the other hand, is perfect for sending live updates such as news, financial data, or notifications, for this project, SSE made the most sense.

I faced two main challenges while working on this project, the first was the UI design, since the task required a creative UX/UI, I used various AI tools to generate visually appealing results, and I also reused some components from previous projects to speed up development.

The second challenge was Docker Compose networking, I was able to deploy both the frontend and backend containers, but the frontend initially couldn’t reach the backend, after a lot of debugging, I found that when using the browser to interact with the UI container, it couldn’t connect through the Docker network, I solved this by using localhost in the environment variables instead of the service name from the Docker Compose file.

In this project, I also learned several new tools and technologies, including Jest for testing, Prisma for database management, and RabbitMQ for message queuing.

## Prerequisites
- Node.js
- npm (Node package manager)
- MySQL (Database)
- RabbitMQ (Message Queue)
- Docker

## Project Setup
1. Run RabbitMQ on your device:
    ```bash
    docker run -d \
    --hostname my-rabbit \
    --name rabbitmq \
    -p 5672:5672 \
    -p 15672:15672 \
    rabbitmq:3-management
    ```
    - Connection port: 5672
    - Management UI: http://localhost:15672
    - Username: guest
    - Password: guest
2. Deploy the project using Docker Compose
    ```bash
    docker compose up -d
    ```
3. Rebuild after updates
    ```bash
    docker-compose up -d --build
    ```

## .env files
### Backend
```bash
# ===== Database =====

# use when running the app outside a Docker container
# DATABASE_URL=mysql://root:StrongPassword123!@localhost:3306/tech_interview_db

# use when running the app inside a Docker container
DATABASE_URL=mysql://root:StrongPassword123!@host.docker.internal:3306/tech_interview_db

# ===== RabbitMQ Configuration =====

# use this for RabbitMQ connection when running outside Docker
# RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# use this for RabbitMQ connection when running inside Docker
RABBITMQ_URL=amqp://guest:guest@host.docker.internal:5672/

# RabbitMQ queue names
RABBITMQ_DATA_QUEUE=IOT_Data_Queue
```
### Frontend
```bash
REACT_APP_BASE_URL=http://localhost:3001
NODE_ENV=production
```
