# Use a lightweight Node.js image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required for image optimization packages
RUN apk add --no-cache \
    autoconf \
    automake \
    libtool \
    nasm \
    build-base \
    zlib-dev \
    libpng-dev \
    vips-dev

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port that BrowserSync uses (default 3000)
EXPOSE 3000
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
