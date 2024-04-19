# Use an official Node.js runtime as the base images
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package.json package-lock.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application files to the container
COPY . .

# Build the React app for production
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Create a non-root user to run the application and change to that user
RUN addgroup -g 1001 -S nodejsuser && \
    adduser -u 1001 -S nodejsuser -G nodejsuser && \
    chown -R nodejsuser:nodejsuser /app

USER nodejsuser

# Start the app
CMD ["npm", "start"]
