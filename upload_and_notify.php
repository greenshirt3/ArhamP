<?php
// --- CONFIGURATION START ---
$uploadDir = 'uploads/'; // Directory relative to this script's location
$recipientEmail = 'orders@arhamprinters.pk'; // **CRITICAL: CHANGE THIS TO YOUR ACTUAL EMAIL ADDRESS**
$senderEmail = 'noreply@arhamprinters.pk'; // Must be a valid email from your domain for best delivery
// --- CONFIGURATION END ---

// Ensure the directory exists
if (!is_dir($uploadDir)) {
    // Attempt to create directory with necessary permissions
    if (!mkdir($uploadDir, 0777, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create uploads directory. Check site root folder permissions.']);
        exit;
    }
}

// Set JSON header for API response
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

if (empty($_FILES['documentFile'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No file uploaded.']);
    exit;
}

// 1. Process File Upload
$file = $_FILES['documentFile'];
$orderId = $_POST['order_id'] ?? 'UNKNOWN';
$totalPriceDisplay = $_POST['total_price_display'] ?? 'N/A';
$specsJson = $_POST['specs_json'] ?? '{}';
$specs = json_decode($specsJson, true);

$fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
$originalFileName = $file['name'];
$safeFileName = $orderId . '_' . time() . '.' . $fileExtension;
$targetPath = $uploadDir . $safeFileName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error saving file to server. Check folder permissions (must be 777 or 755).']);
    exit;
}

// 2. Format Specifications for Email
$specsList = "";
if ($specs) {
    foreach ($specs as $key => $value) {
        $specsList .= "- " . ucfirst($key) . ": " . $value . "\n";
    }
}

// 3. Send Email Notification
$subject = "NEW DOCUMENT PRINT ORDER RECEIVED (ID: $orderId)";
$message = "A new document print order has been placed on your website.\n\n";
$message .= "--- ORDER DETAILS ---\n";
$message .= "Order ID: $orderId\n";
$message .= "Original File Name: $originalFileName\n";
$message .= "File Saved As: $safeFileName\n";
$message .= "File Location (for FTP/cPanel access): /" . $targetPath . "\n"; // Relative path is usually sufficient
$message .= "Total Estimated Price (Excl. Delivery): $totalPriceDisplay\n\n";
$message .= "--- SPECIFICATIONS ---\n";
$message .= $specsList . "\n";
$message .= "Action Required: Please download the file, confirm print quality, and contact the customer for delivery details.\n";

$headers = "From: Arham Printers Auto-Order <$senderEmail>\r\n";
$headers .= "Reply-To: $senderEmail\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Attempt to send email
$mailSuccess = mail($recipientEmail, $subject, $message, $headers);

if ($mailSuccess) {
    echo json_encode([
        'success' => true,
        'message' => 'File uploaded and email sent successfully.',
        'order_id' => $orderId,
        'file_path' => $targetPath
    ]);
} else {
    // If file uploaded but email failed (less common if hosting is configured)
    echo json_encode([
        'success' => true, 
        'message' => 'File uploaded successfully, but email notification failed to send. Please check your uploads folder manually.', 
        'order_id' => $orderId,
        'file_path' => $targetPath
    ]);
}
?>