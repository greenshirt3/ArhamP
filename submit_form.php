<?php
// --- CORS Headers (CRUCIAL for GitHub Pages to RabHost communication) ---
// IMPORTANT: Replace 'https://YOUR-GITHUB-PAGES-URL' with your actual GitHub Pages URL (e.g., https://yourusername.github.io)
header("Access-Control-Allow-Origin: https://YOUR-GITHUB-PAGES-URL"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// Handle preflight OPTIONS request from the browser
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// --- 1. CONFIGURATION ---
$recipient_email = "info@arhamprinters.pk"; 
$website_domain = "ArhamPrinters.pk";

// --- 2. INPUT DATA PROCESSING ---

// Receive JSON data from the fetch request
$input_json = file_get_contents("php://input");
$form_data = json_decode($input_json, true);

if (empty($form_data)) {
    echo json_encode(["success" => false, "message" => "No form data received."]);
    exit;
}

// Extract essential fields
$source = isset($form_data['form_source']) ? $form_data['form_source'] : 'General Inquiry';
$name = isset($form_data['name']) ? $form_data['name'] : 'N/A';
$phone = isset($form_data['phone']) ? $form_data['phone'] : 'N/A';
$details = isset($form_data['details']) ? $form_data['details'] : 'N/A';

$subject = "NEW WEB SUBMISSION: " . $source . " from " . $name;

// --- 3. BUILD EMAIL BODY ---

$email_body = "<h2>New Submission from " . $website_domain . "</h2>";
$email_body .= "<p><b>Source:</b> " . htmlspecialchars($source) . "</p>";
$email_body .= "<hr>";
$email_body .= "<h3>Customer Details</h3>";
$email_body .= "<p><b>Name:</b> " . htmlspecialchars($name) . "</p>";
$email_body .= "<p><b>Phone (Contact):</b> " . htmlspecialchars($phone) . "</p>";

// Detailed data table for all form fields
$email_body .= "<h3>Submission Details</h3><table border='1' cellpadding='10' cellspacing='0' width='100%'>";
foreach ($form_data as $key => $value) {
    if (!in_array($key, ['form_source'])) {
        $key_display = ucfirst(str_replace('_', ' ', $key));
        $value_display = is_array($value) ? implode(", ", $value) : nl2br(htmlspecialchars($value));
        
        $email_body .= "<tr><td width='30%' style='font-weight: bold;'>{$key_display}</td><td>{$value_display}</td></tr>";
    }
}
$email_body .= "</table>";

// --- 4. SEND EMAIL ---

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= 'From: Web Orders <no-reply@arhamprinters.pk>' . "\r\n"; 
$headers .= 'Reply-To: ' . htmlspecialchars($recipient_email) . "\r\n";

if (mail($recipient_email, $subject, $email_body, $headers)) {
    echo json_encode(["success" => true, "message" => "Submission successful. Email sent."]);
} else {
    http_response_code(500); 
    echo json_encode(["success" => false, "message" => "Failed to send email. Check hosting mail settings."]);
}
?>