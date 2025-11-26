<?php
// --- CORS Headers (CRUCIAL for GitHub Pages to RabHost communication) ---
// IMPORTANT: Replace 'https://YOUR-GITHUB-PAGES-URL' with your actual GitHub Pages URL (e.g., https://yourusername.github.io)
header("Access-Control-Allow-Origin: https://YOUR-GITHUB-PAGES-URL"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// --- 1. CONFIGURATION & SETUP ---
$recipient_email = "info@arhamprinters.pk"; 
$website_domain = "ArhamPrinters.pk";

// Define the directory where uploaded files will be saved (make sure this directory exists and is writable)
$upload_dir = 'uploads/print_orders/'; 
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

$response = ["success" => false, "message" => "An unknown error occurred."];

try {
    // --- 2. FILE HANDLING ---
    if (!isset($_FILES['documentFile']) || $_FILES['documentFile']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("File upload failed or file was not received.");
    }

    $file_info = $_FILES['documentFile'];
    $original_file_name = basename($file_info['name']);
    $unique_filename = uniqid('print_') . '_' . $original_file_name;
    $target_file = $upload_dir . $unique_filename;

    if (!move_uploaded_file($file_info['tmp_name'], $target_file)) {
        throw new Exception("Could not move uploaded file to target directory.");
    }
    
    // --- 3. DATA EXTRACTION ---
    $form_data = $_POST;
    $order_id = $form_data['order_id'] ?? 'N/A';
    $name = $form_data['name'] ?? 'N/A';
    $phone = $form_data['phone'] ?? 'N/A';
    $price_display = $form_data['total_price_display'] ?? 'N/A';
    $specs_json = $form_data['specs_json'] ?? '{}';
    $specs = json_decode($specs_json, true);

    // --- 4. BUILD EMAIL BODY ---

    $subject = "NEW DOCUMENT PRINT ORDER: " . $order_id;
    
    $email_body = "<h2>New Document Print Order Submitted (ID: {$order_id})</h2>";
    $email_body .= "<p><b>Source:</b> Document Printing Calculator</p>";
    $email_body .= "<hr>";

    $email_body .= "<h3>Customer Details</h3>";
    $email_body .= "<p><b>Name:</b> " . htmlspecialchars($name) . "</p>";
    $email_body .= "<p><b>Phone:</b> " . htmlspecialchars($phone) . "</p>";
    $email_body .= "<p><b>Estimated Price:</b> " . htmlspecialchars($price_display) . "</p>";

    $email_body .= "<h3>Print Specifications</h3>";
    $email_body .= "<table border='1' cellpadding='10' cellspacing='0' width='100%'>";
    $email_body .= "<tr><td width='30%'>Print Color</td><td>" . htmlspecialchars($specs['color'] ?? 'N/A') . "</td></tr>";
    $email_body .= "<tr><td>Print Siding</td><td>" . htmlspecialchars($specs['siding'] ?? 'N/A') . "</td></tr>";
    $email_body .= "<tr><td>Paper Size</td><td>" . htmlspecialchars($specs['size'] ?? 'N/A') . "</td></tr>";
    $email_body .= "<tr><td>Paper GSM</td><td>" . htmlspecialchars($specs['gsm'] ?? 'N/A') . "</td></tr>";
    $email_body .= "<tr><td>Total Sheets</td><td>" . htmlspecialchars($specs['sheets'] ?? 'N/A') . "</td></tr>";
    $email_body .= "<tr><td>Total Pages</td><td>" . htmlspecialchars($specs['pages'] ?? 'N/A') . "</td></tr>";
    $email_body .= "</table>";

    $email_body .= "<h3>File Information</h3>";
    // IMPORTANT: Provide the file path relative to your web root for easy access.
    $email_body .= "<p><b>File Name:</b> " . $original_file_name . "</p>";
    $email_body .= "<p><b>Server Path:</b> <a href='{$target_file}'>{$target_file}</a></p>";

    // --- 5. SEND EMAIL ---

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= 'From: Document Orders <no-reply@arhamprinters.pk>' . "\r\n"; 
    $headers .= 'Reply-To: ' . htmlspecialchars($recipient_email) . "\r\n";

    if (mail($recipient_email, $subject, $email_body, $headers)) {
        $response = ["success" => true, "message" => "Order submitted and file uploaded successfully."];
    } else {
        // Log an error if the email failed but the file was uploaded
        $response = ["success" => false, "message" => "File uploaded, but email notification failed to send."];
    }

} catch (Exception $e) {
    $response = ["success" => false, "message" => "Processing error: " . $e->getMessage()];
    http_response_code(500); 
}

// Ensure output is JSON
echo json_encode($response);
?>