<?php
// update_db.php
// PURPOSE: Reads your NEW itemsprice.json and updates the database

// --- DATABASE CONFIG ---
$db_host = 'sdb-h.hosting.stackcp.net';
$db_name = 'Arhamprinters-31383649a9';
$db_user = 'Arhamprinters-31383649a9';
$db_pass = 'Skaea@rabhost1'; // <--- PASTE PASSWORD

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("DB Connection Error: " . $e->getMessage());
}

// Check for the file
$json_file = 'itemsprice.json'; 
if (!file_exists($json_file)) { die("Error: itemsprice.json not found!"); }

$json_content = file_get_contents($json_file);
$data = json_decode($json_content, true);

if (!$data) { die("Error: JSON file is empty or has invalid format (syntax error)."); }

echo "<h3>Updating Database...</h3>";

// 1. Clear the old data
$pdo->query("TRUNCATE TABLE pricing_items");

// 2. Insert new data
function processNode($pdo, $node, $path = []) {
    foreach ($node as $key => $value) {
        $currentPath = $path;
        if (is_array($value) && isset($value[0]) && is_array($value[0])) {
            foreach ($value as $item) {
                $price = isset($item['price']) ? $item['price'] : 0;
                $details = $item;
                unset($details['price']); 
                insertRow($pdo, $currentPath, $key, $price, json_encode($details), 1);
            }
        } elseif (!is_array($value)) {
            insertRow($pdo, $currentPath, $key, $value, null, 0);
        } else {
            $currentPath[] = $key;
            processNode($pdo, $value, $currentPath);
        }
    }
}

function insertRow($pdo, $path, $last_key, $price, $json, $is_obj) {
    $cat = $path[0] ?? ''; $prod = $path[1] ?? ''; $v1 = $path[2] ?? ''; $v2 = $path[3] ?? ''; 
    $stmt = $pdo->prepare("INSERT INTO pricing_items (category, product, variant_1, variant_2, variant_3, price, details_json, is_object_list) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$cat, $prod, $v1, $v2, $last_key, $price, $json, $is_obj]);
}

processNode($pdo, $data);
echo "<h3>SUCCESS: Database updated with your new file!</h3>";
?>