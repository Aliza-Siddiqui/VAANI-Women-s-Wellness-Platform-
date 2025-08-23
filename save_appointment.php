<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set proper headers
header('Content-Type: text/plain; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    try {
        // Sanitize input data
        $name = htmlspecialchars($_POST["name"] ?? '', ENT_QUOTES, 'UTF-8');
        $email = filter_var($_POST["email"] ?? '', FILTER_SANITIZE_EMAIL);
        $phone = htmlspecialchars($_POST["phone"] ?? '', ENT_QUOTES, 'UTF-8');
        $concern = htmlspecialchars($_POST["concern"] ?? '', ENT_QUOTES, 'UTF-8');
        $appointment_time = $_POST["appointment_time"] ?? '';
        $current_period_date = $_POST["current_period_date"] ?? '';
        $predicted_period_date = $_POST["predicted_period_date"] ?? '';
        $booking_type = $_POST["booking_type"] ?? 'regular';

        // Validate required fields
        if (empty($name) || empty($email)) {
            echo "Error: Name and email are required fields.";
            exit;
        }

        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo "Error: Invalid email format.";
            exit;
        }

        // Database configuration - Your actual setup
        $servername = "localhost";
        $username = "root";  
        $password = "";      
        $dbname = "period_tracker";  

        // Create connection
        $conn = new mysqli($servername, $username, $password, $dbname);

        // Check connection
        if ($conn->connect_error) {
            echo "Connection failed: " . $conn->connect_error;
            exit;
        }

        // Prepare and execute insert statement - ALL FIELDS
        $stmt = $conn->prepare("INSERT INTO appointments (name, email, phone, concern, appointment_date, current_period_date, predicted_period_date, booking_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        if (!$stmt) {
            echo "Prepare failed: " . $conn->error;
            exit;
        }

        $stmt->bind_param("ssssssss", $name, $email, $phone, $concern, $appointment_time, $current_period_date, $predicted_period_date, $booking_type);

        if ($stmt->execute()) {
            echo "✅ Appointment saved successfully! ID: " . $conn->insert_id;
        } else {
            echo "Error executing query: " . $stmt->error;
        }

        $stmt->close();
        $conn->close();

    } catch (Exception $e) {
        echo "Error: " . $e->getMessage();
    }
} else {
    echo "Error: Only POST requests are allowed.";
}
?>
