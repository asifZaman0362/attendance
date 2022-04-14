create database attendance_app;

set old_passwords=1
create user 'admin'@'localhost' identified by 'aGr3enF1eldWithN0tMuchIn!t';
grant all privileges on attendance_app.* to 'admin'@'localhost';

use attendance_app;

create table teachers (
    teacher_id int(10) not null auto_increment primary key,
    teacher_name varchar(30) not null,
    username varchar(30) not null,
    password_hash varchar(200) not null,
    salt varchar(100) not null
);

create table admin (
    user_id int(10) not null auto_increment primary key,
    username varchar(30) not null,
    password_hash varchar(200) not null,
    salt varchar(100) not null,
    email varchar(30) not null,
    phone varchar(15) not null
);

create table students (
    student_id int(10) not null auto_increment primary key,
    student_name varchar(30) not null,
    student_semester int(1) not null,
    student_course varchar(50) not null,
    roll_no int(10) not null
);

create table attendance (
    att_id int(10) not null auto_increment primary key,
    date_taken date not null,
    subject varchar(30) not null,
    semester int(1) not null,
    roll_numbers json not null
);

create table prefs (
    first_run boolean not null
);

insert into prefs values(true);