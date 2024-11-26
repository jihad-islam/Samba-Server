CREATE DATABASE samba_project;
CREATE USER 'samba_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON samba_project.* TO 'samba_user'@'localhost';
FLUSH PRIVILEGES;

USE samba_project;

-- Table for storing Samba users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing shared directories
CREATE TABLE shared_directories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    directory_name VARCHAR(255) NOT NULL UNIQUE,
    path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


SHOW DATABASES;
USE samba_project;
SHOW TABLES;

