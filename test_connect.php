<?php
// test_connect.php
// PURPOSE: Simple check to see if we can connect to the database.

ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>Testing Database Connection...</h2>";

// DATABASE DETAILS
$db_host = 'sdb-h.hosting.stackcp.net';
$db_name = 'Arhamprinters-31383649a9';
$db_user = 'Arhamprinters-31383649a9';

// *** CRITICAL: Put your password inside the double quotes below ***
$db_pass = "Skaea@rabhost1"; 

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<h3 style='color:green'>✅ SUCCESS! Password and Connection are correct.</h3>";
} catch (PDOException $e) {
    echo "<h3 style='color:red'>❌ FAILED!</h3>";
    echo "<p>Error message: " . $e->getMessage() . "</p>";
    echo "<p>Please check your password again.</p>";
}
?>