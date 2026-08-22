# 1. The Base Image
# We start with the official PHP 8.3 image designed for command-line (CLI) tools
FROM php:8.3-cli

# 2. Install System Dependencies
# We need basic Linux tools like zip and git so Composer can download packages
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

# 3. Install PHP Extensions
# This is crucial! PHP doesn't know how to talk to MySQL by default. 
# We explicitly install the PDO MySQL extension here.
RUN docker-php-ext-install pdo pdo_mysql zip

# 4. Install Composer
# This is a neat Docker trick. We copy the official Composer binary directly into our PHP container!
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Set Working Directory
# This tells Docker: "Any commands run inside this container should happen in /var/www/html"
WORKDIR /var/www/html

# We expose the port we want to use for the PHP built-in server
EXPOSE 8000
