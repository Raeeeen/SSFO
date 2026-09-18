# SSFO — DTR Management Website

This is the **web-based admin dashboard for SSFO**, a Daily Time Record (DTR) attendance system developed as a **capstone project for a government organization**. The project was created to help automate employee attendance tracking and reduce the need for manually recorded attendance.

The SSFO system has two parts: the **SSFO Mobile App** and the **SSFO Website**. The mobile application is responsible for face recognition and recording employee attendance, while this website is used by administrators to view, search, and manage the attendance records collected by the mobile app.

Face recognition was used as an added security measure to help ensure that employees record their own attendance and reduce the possibility of someone recording attendance on behalf of another employee.

Attendance recorded through the mobile application is stored in the system and made available through this web dashboard.

## How It Works

1. An employee uses the SSFO Mobile App.
2. The employee's face is scanned and recognized to verify their identity.
3. The employee's time-in or time-out is recorded.
4. The attendance data is stored and made available to the SSFO Website.
5. The administrator can view the employees who attended on a specific day.
6. The administrator can search for or select a specific employee.
7. The administrator can view the employee's DTR, including their attendance dates, time-in, time-out, and total hours.
8. The administrator can print the employee's DTR as a PDF for documentation and backup.

## Project Structure

**SSFO Mobile App**
Face Scan → Employee Verification → Attendance Recorded → Attendance Data

**SSFO Website**
Attendance Data → Admin Dashboard → Search/Select Employee → DTR Records → PDF Printing / Backup

## DTR Management

Administrators can search for or select an employee and view their complete attendance records. The DTR includes information such as:

* Attendance date
* Time-in
* Time-out
* Total hours worked

The administrator can then print the employee's DTR as a PDF for documentation, record keeping, and backups.

## Project Purpose

The website was developed as part of a **capstone project for a government organization** to help automate employee attendance tracking and improve the security of the attendance process.

Instead of relying entirely on manually recorded attendance sheets, employees can use the SSFO Mobile App to verify their identity through face recognition and record their attendance. The web dashboard then provides administrators with a centralized place to monitor attendance, search individual employees, review DTR records, and generate printable PDF copies.

## Related Project

**SSFO Mobile — Face Recognition DTR System**

The mobile application is the attendance-recording component of SSFO. It handles face registration, face recognition, and employee time-in/time-out recording, while this website handles the administration and viewing of the resulting DTR records.

## Project Status

**Not Currently Running**

As of **September 18, 2026**, this project is no longer running. The Firebase backend has been shut down, so the website and its connected attendance system are no longer available.
