CREATE DATABASE attendance_app;

CREATE USER 'attendance_admin'@'localhost' IDENTIFIED WITH mysql_native_password BY 'aGr3enF1eldWithN0tMuchIn!t';
GRANT ALL PRIVILEGES ON attendance_app.* TO 'attendance'@'localhost';

use attendance_app;

CREATE TABLE Teacher (
    id INT(4) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    teacher_name VARCHAR(30) NOT NULL,
    username VARCHAR(30) NOT NULL,
    phone_number INT(10) NOT NULL,
    departments JSON NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    salt VARCHAR(100) NOT NULL
);

CREATE TABLE Department (
    id INT(2) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(50) NOT NULL
);

CREATE TABLE Teacher_Department (
    id INT(10) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT(5) NOT NULL FOREIGN KEY REFERENCES Teacher (id),
    dept_id INT(2) NOT NULL FOREIGN KEY REFERENCES Department (id)
);

CREATE TABLE Admin (
    id INT(2) NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
    department VARCHAR(50) NOT NULL,
    course VARCHAR(50) NOT NULL,
    roll_no INT(10) NOT NULL
);

CREATE TABLE Attendance (
    id INT(6) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date_taken DATE NOT NULL,
    subject VARCHAR(30) NOT NULL,
    semester INT(1) NOT NULL,
    dept_id INT(10) NOT NULL FOREIGN KEY REFERENCES Department (dept_id)
);

CREATE TABLE Student_Attendance (
    id INT(10) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    att_id INT(10) NOT NULL FOREIGN KEY REFERENCES Attendance (id),
    student_id INT(10) NOT NULL FOREIGN KEY REFERENCES Student (id),
    status BOOLEAN NOT NULL DEFAULT False
);

CREATE TABLE Prefs (
    first_run BOOLEAN NOT NULL
);

INSERT INTO Prefs VALUES(True);