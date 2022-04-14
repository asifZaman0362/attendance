CREATE DATABASE attendance_app;

CREATE USER 'attendance_admin'@'localhost' IDENTIFIED BY 'aGr3enF1eldWithN0tMuchIn!t';
GRANT ALL PRIVILEGES ON attendance_app.* TO 'attendance_admin'@'localhost';

use attendance_app;

CREATE TABLE Teacher (
    id INT(4) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(30) NOT NULL,
    lastname VARCHAR(30) NOT NULL,
    username VARCHAR(30) NOT NULL,
    phone_number INT(10) NOT NULL,
    email VARCHAR(30) NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    salt VARCHAR(100) NOT NULL
);

CREATE TABLE Department (
    id INT(2) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(50) NOT NULL
);

CREATE TABLE Teacher_Department (
    id INT(10) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT(5) NOT NULL,
    dept_id INT(2) NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES Teacher (id),
    FOREIGN KEY (dept_id) REFERENCES Department (id)
);

CREATE TABLE Admin (
    id INT(2) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(30) NOT NULL,
    lastname VARCHAR(30) NOT NULL,
    username VARCHAR(30) NOT NULL,
    email VARCHAR(30) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    salt VARCHAR(100) NOT NULL
);

create table Student (
    id INT(6) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(30) NOT NULL,
    semester INT(1) NOT NULL,
    dept_id INT(2) NOT NULL,
    course VARCHAR(50) NOT NULL,
    roll_no INT(10) NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES Department (id)
);

CREATE TABLE Attendance (
    id INT(6) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date_taken DATE NOT NULL,
    subject VARCHAR(30) NOT NULL,
    semester INT(1) NOT NULL,
    dept_id INT(10) NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES Department (id)
);

CREATE TABLE Student_Attendance (
    id INT(10) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    att_id INT(10) NOT NULL,
    student_id INT(10) NOT NULL,
    status BOOLEAN NOT NULL DEFAULT False,
    FOREIGN KEY (att_id) REFERENCES Attendance (id),
    FOREIGN KEY (student_id) REFERENCES Student (id)
);

CREATE TABLE Prefs (
    registered BOOLEAN NOT NULL
);

INSERT INTO Prefs VALUES(False);