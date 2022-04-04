CREATE USER 'attendance'@'localhost' IDENTIFIED WITH mysql_native_password BY 'aGr3enF1eldWithN0tMuchIn!t';
GRANT SELECT ON attendance_app.* TO 'attendance'@'localhost';