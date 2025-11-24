<?php
// get_prices.php - Updated to implement 6-Category mapping
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// --- DATABASE CONFIG ---
$db_host = 'sdb-h.hosting.stackcp.net';
$db_name = 'Arhamprinters-31383649a9';
$db_user = 'Arhamprinters-31383649a9';
$db_pass = 'Skaea@rabhost1'; 

// --- CATEGORY MAPPING ---
// Map old database categories to the new consolidated front-end categories.
$category_map = [
    'Business Essentials' => 'Business & Office Essentials',
    'Office Essentials' => 'Business & Office Essentials',
    'Marketing Essentials' => 'Marketing & Promotional Items',
    'Promotional Items' => 'Marketing & Promotional Items',
    'Souvenirs' => 'Marketing & Promotional Items',
    // Note: Digital Media Marketing has no direct products in pricing_items, so it is handled by the front-end 'quote' links.
    'Digital Printing' => 'Custom & Large Format', // Digital Print products moved here
    'Photo Printing' => 'Custom & Large Format',
    'Banners' => 'Custom & Large Format',
    '3D Wallpaper' => 'Custom & Large Format',
    'Shields' => 'Custom & Large Format',
    'Flags/Fabric' => 'Custom & Large Format',
    'Box Pkg' => 'Custom & Large Format',
    'Wedding Invitation Cards' => 'Special Occasions (Wedding)', // Kept separate for clarity/flexibility
    'Digital Printing Pricing' => 'B/W and Color Prints', // Tiered printing data
];

try {
    // Attempt to establish database connection
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    // Return a structured error message if connection fails
    die(json_encode(["error" => "DB Connection Error: " . $e->getMessage()]));
}

$final_json = [];
$wedding_prices_map = []; // Map to store unique wedding card prices {CardName: BulkPrice}

// --- 1. Fetch ALL Pricing Items ---
$stmt = $pdo->query("SELECT * FROM pricing_items ORDER BY id ASC");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as $row) {
    $c = $row['category'];
    $p = $row['product'];
    $v1 = $row['variant_1'];
    $v2 = $row['variant_2'];
    $v3 = $row['variant_3'];
    $price = (float)$row['price'];
    
    // Determine the new consolidated category for the front-end
    $new_category = $category_map[$c] ?? $c;

    if ($c == 'Wedding Invitation Cards' && $v1 == 'Bulk (100 pcs)') {
        // Store the bulk price (for 100 pcs) for later merging with meta data
        $wedding_prices_map[$p] = $price;
        continue;
    }
    
    // Process standard pricing models (is_object_list = 1)
    if ($row['is_object_list'] == 1) {
        $obj = json_decode($row['details_json'] ?? '[]', true);
        $obj['price'] = $price; 
        
        if ($v1) $obj['variant_1'] = $v1;
        if ($v2) $obj['variant_2'] = $v2;
        if ($v3) $obj['variant_3'] = $v3;

        if (!isset($final_json[$new_category][$p])) {
            $final_json[$new_category][$p] = [];
        }
        $final_json[$new_category][$p][] = $obj;

    } else {
        // Simple Tiered Pricing (Digital Printing Pricing - is_object_list = 0)
        if ($c == 'Digital Printing Pricing') {
             // Structure: [Category][Product=Size][V1=Color][V2=GSM][V3=Range]
             if (!isset($final_json[$new_category][$p][$v1][$v2])) {
                 $final_json[$new_category][$p][$v1][$v2] = [];
             }
             $final_json[$new_category][$p][$v1][$v2][$v3] = $price;
        } else {
            // Default flat storage for other simple non-list entries
            $final_json[$new_category][$p] = $price;
        }
    }
}

// --- 2. Wedding Card Meta Data (Merged with fetched prices) ---
$wedding_card_meta = [
    "Classic Designs" => [
        ["cardName" => "Card Design #105", "imageFile" => "img/wedding/105 (1).webp", "additionalImages" => ["img/wedding/105 (2).webp"], "description" => "Elegant traditional design with intricate patterns."],
        ["cardName" => "Card Design #107", "imageFile" => "img/wedding/107 (1).webp", "additionalImages" => ["img/wedding/107 (2).webp"], "description" => "Classic layout with timeless appeal."],
        ["cardName" => "Card Design #200", "imageFile" => "img/wedding/200.webp", "description" => "Simple and elegant traditional design."],
        ["cardName" => "Card Design #205", "imageFile" => "img/wedding/205.webp", "description" => "Classic pattern with gold accents."],
        ["cardName" => "Card Design #210", "imageFile" => "img/wedding/210.webp", "description" => "Traditional design with rich colors."],
        ["cardName" => "Card Design #215", "imageFile" => "img/wedding/215.webp", "description" => "Elegant classic layout."],
        ["cardName" => "Card Design #220", "imageFile" => "img/wedding/220.webp", "description" => "Timeless traditional design."],
        ["cardName" => "Card Design #251", "imageFile" => "img/wedding/251.webp", "description" => "Classic design with ornate borders."],
        ["cardName" => "Card Design #257", "imageFile" => "img/wedding/257.webp", "description" => "Traditional layout with floral motifs."],
        ["cardName" => "Card Design #259", "imageFile" => "img/wedding/259.webp", "description" => "Elegant classic design."],
        ["cardName" => "Card Design #263", "imageFile" => "img/wedding/263.webp", "description" => "Traditional pattern with gold detailing."],
        ["cardName" => "Card Design #270", "imageFile" => "img/wedding/270.webp", "description" => "Classic design with rich textures."],
        ["cardName" => "Card Design #271", "imageFile" => "img/wedding/271.webp", "description" => "Traditional layout with intricate patterns."],
        ["cardName" => "Card Design #272", "imageFile" => "img/wedding/272.webp", "description" => "Elegant classic design."],
        ["cardName" => "Card Design #274", "imageFile" => "img/wedding/274.webp", "description" => "Traditional design with ornate elements."],
        ["cardName" => "Card Design #275", "imageFile" => "img/wedding/275.webp", "description" => "Classic layout with timeless appeal."],
        ["cardName" => "Card Design #276", "imageFile" => "img/wedding/276.webp", "description" => "Traditional design with rich colors."],
        ["cardName" => "Card Design #277", "imageFile" => "img/wedding/277.webp", "description" => "Elegant classic pattern."],
        ["cardName" => "Card Design #278", "imageFile" => "img/wedding/278.webp", "description" => "Traditional design with intricate details."],
        ["cardName" => "Card Design #279", "imageFile" => "img/wedding/279.webp", "description" => "Classic layout with gold accents."],
        ["cardName" => "Card Design #281", "imageFile" => "img/wedding/281.webp", "description" => "Traditional design with elegant patterns."],
        ["cardName" => "Card Design #516", "imageFile" => "img/wedding/516.webp", "description" => "Classic design with traditional motifs."],
        ["cardName" => "Card Design #533", "imageFile" => "img/wedding/533.webp", "description" => "Elegant traditional layout."],
        ["cardName" => "Card Design #865", "imageFile" => "img/wedding/865 (1).webp", "additionalImages" => ["img/wedding/865 (2).webp"], "description" => "Simple, elegant design with standard paper stock."]
    ],
    "Modern & Minimalist" => [
        ["cardName" => "Card Design #870", "imageFile" => "img/wedding/870 (1).webp", "additionalImages" => ["img/wedding/870 (2).webp"], "description" => "Contemporary layout with foil accents and heavy matte finish."],
        ["cardName" => "Card Design #1018", "imageFile" => "img/wedding/1018 (1).webp", "additionalImages" => ["img/wedding/1018 (2).webp"], "description" => "Clean modern design with minimalist approach."],
        ["cardName" => "Card Design #1032", "imageFile" => "img/wedding/1032 (1).webp", "additionalImages" => ["img/wedding/1032 (2).webp"], "description" => "Sleek contemporary layout."],
        ["cardName" => "Card Design #1070", "imageFile" => "img/wedding/1070 (1).webp", "additionalImages" => ["img/wedding/1070 (2).webp"], "description" => "Modern design with clean lines."],
        ["cardName" => "Card Design #1101", "imageFile" => "img/wedding/1101.webp", "additionalImages" => ["img/wedding/1101 1.webp"], "description" => "Minimalist contemporary design."],
        ["cardName" => "Card Design #1107", "imageFile" => "img/wedding/1107.webp", "description" => "Sleek modern layout."],
        ["cardName" => "Card Design #1122", "imageFile" => "img/wedding/1122.webp", "description" => "Clean minimalist design."],
        ["cardName" => "Card Design #1126", "imageFile" => "img/wedding/1126.webp", "additionalImages" => ["img/wedding/1126 2.webp"], "description" => "Contemporary minimalist approach."],
        ["cardName" => "Card Design #1141", "imageFile" => "img/wedding/1141.webp", "description" => "Modern design with simple elegance."],
        ["cardName" => "Card Design #1200", "imageFile" => "img/wedding/1200 (1).webp", "additionalImages" => ["img/wedding/1200 (2).webp"], "description" => "Clean contemporary layout."],
        ["cardName" => "Card Design #1215", "imageFile" => "img/wedding/1215 (1).webp", "additionalImages" => ["img/wedding/1215 (2).webp"], "description" => "Minimalist design with modern appeal."],
        ["cardName" => "Card Design #1225", "imageFile" => "img/wedding/1225 (1).webp", "additionalImages" => ["img/wedding/1225 (2).webp"], "description" => "Sleek contemporary design."],
        ["cardName" => "Card Design #1280", "imageFile" => "img/wedding/1280 (1).webp", "additionalImages" => ["img/wedding/1280 (2).webp"], "description" => "Modern minimalist layout."],
        ["cardName" => "Card Design #1300", "imageFile" => "img/wedding/1300 (1).webp", "additionalImages" => ["img/wedding/1300 (2).webp"], "description" => "Clean contemporary design."],
        ["cardName" => "Card Design #1310", "imageFile" => "img/wedding/1310 (1).webp", "additionalImages" => ["img/wedding/1310 (2).webp"], "description" => "Modern approach with simple elegance."],
        ["cardName" => "Card Design #1320", "imageFile" => "img/wedding/1320 (1).webp", "additionalImages" => ["img/wedding/1320 (2).webp", "img/wedding/1320 (3).webp"], "description" => "Contemporary design with clean aesthetics."],
        ["cardName" => "Card Design #1340", "imageFile" => "img/wedding/1340 (1).webp", "additionalImages" => ["img/wedding/1340 (2).webp"], "description" => "Minimalist modern layout."],
        ["cardName" => "Card Design #1350", "imageFile" => "img/wedding/1350 (1).webp", "additionalImages" => ["img/wedding/1350 (2).webp", "img/wedding/1350 (3).webp"], "description" => "Sleek contemporary design."],
        ["cardName" => "Card Design #1360", "imageFile" => "img/wedding/1360 (1).webp", "additionalImages" => ["img/wedding/1360 (2).webp", "img/wedding/1360 (3).webp"], "description" => "Modern minimalist approach."],
        ["cardName" => "Card Design #1400", "imageFile" => "img/wedding/1400 (1).webp", "additionalImages" => ["img/wedding/1400 (2).webp"], "description" => "Clean contemporary layout."],
        ["cardName" => "Card Design #1580", "imageFile" => "img/wedding/1580.webp", "description" => "Modern design with minimalist appeal."],
        ["cardName" => "Card Design #1745", "imageFile" => "img/wedding/1745.webp", "description" => "Sleek contemporary design."]
    ],
    "Premium Collection" => [
        ["cardName" => "Card Design #419", "imageFile" => "img/wedding/419 (1).webp", "additionalImages" => ["img/wedding/419 (2).webp", "img/wedding/419 (3).webp", "img/wedding/419 (4).webp", "img/wedding/419 (5).webp"], "description" => "Luxury design with premium finishes."],
        ["cardName" => "Card Design #521", "imageFile" => "img/wedding/521 (1).webp", "additionalImages" => ["img/wedding/521 (2).webp"], "description" => "Premium design with elegant details."],
        ["cardName" => "Card Design #602", "imageFile" => "img/wedding/602 (1).webp", "additionalImages" => ["img/wedding/602 (2).webp", "img/wedding/602 (3).webp", "img/wedding/602 (4).webp", "img/wedding/602 (5).webp", "img/wedding/602 (6).webp", "img/wedding/602 (7).webp", "img/wedding/602 (8).webp", "img/wedding/602 (9).webp", "img/wedding/602 (10).webp"], "description" => "High-end comprehensive wedding collection."],
        ["cardName" => "Card Design #665", "imageFile" => "img/wedding/665 (1).webp", "additionalImages" => ["img/wedding/665 (2).webp", "img/wedding/665 (3).webp", "img/wedding/665 (4).webp", "img/wedding/665 (5).webp", "img/wedding/665 (6).webp", "img/wedding/665 (7).webp", "img/wedding/665 (8).webp", "img/wedding/665 (9).webp", "img/wedding/665 (10).webp", "img/wedding/665 (11).webp", "img/wedding/665 (12).webp", "img/wedding/665 (13).webp", "img/wedding/665 (14).webp"], "description" => "High-end design with velvet touch coating and gold leaf stamping."],
        ["cardName" => "Card Design #746", "imageFile" => "img/wedding/746 (1).webp", "additionalImages" => ["img/wedding/746 (2).webp", "img/wedding/746 (3).webp", "img/wedding/746 (4).webp"], "description" => "Premium design with luxurious elements."],
        ["cardName" => "Card Design #770", "imageFile" => "img/wedding/770 (1).webp", "additionalImages" => ["img/wedding/770 (2).webp", "img/wedding/770 (3).webp", "img/wedding/770 (4).webp", "img/wedding/770 (5).webp", "img/wedding/770 (6).webp"], "description" => "Luxury collection with multiple design options."],
        ["cardName" => "Card Design #775", "imageFile" => "img/wedding/775 (1).webp", "additionalImages" => ["img/wedding/775 (2).webp"], "description" => "Premium design with elegant finishes."],
        ["cardName" => "Card Design #786", "imageFile" => "img/wedding/786 (1).webp", "additionalImages" => ["img/wedding/786 (2).webp"], "description" => "High-end design with premium details."],
        ["cardName" => "Card Design #1071", "imageFile" => "img/wedding/1071 (1).webp", "additionalImages" => ["img/wedding/1071 (2).webp", "img/wedding/1071 (3).webp", "img/wedding/1071 (4).webp", "img/wedding/1071 (5).webp", "img/wedding/1071 (6).webp", "img/wedding/1071 (7).webp", "img/wedding/1071 (8).webp", "img/wedding/1071 (9).webp", "img/wedding/1071 (10).webp", "img/wedding/1071 (11).webp", "additionalImages" => ["img/wedding/1071 (12).webp"]], "description" => "Comprehensive premium wedding collection."],
        ["cardName" => "Card Design #1077", "imageFile" => "img/wedding/1077 (1).webp", "additionalImages" => ["img/wedding/1077 (4).webp", "img/wedding/1077 (5).webp", "img/wedding/1077 (6).webp", "img/wedding/1077 (7).webp", "img/wedding/1077 (8).webp"], "description" => "Luxury design series with premium options."],
        ["cardName" => "Card Design #1081", "imageFile" => "img/wedding/1081 (1).webp", "additionalImages" => ["img/wedding/1081 (2).webp", "img/wedding/1081 (3).webp", "img/wedding/1081 (4).webp"], "description" => "Premium collection with elegant variations."],
        ["cardName" => "Card Design #1082", "imageFile" => "img/wedding/1082 (1).webp", "additionalImages" => ["img/wedding/1082 (2).webp", "img/wedding/1082 (3).webp", "img/wedding/1082 (4).webp"], "description" => "High-end design series."],
        ["cardName" => "Card Design #1137", "imageFile" => "img/wedding/1137 (1).webp", "additionalImages" => ["img/wedding/1137 (2).webp", "img/wedding/1137 (3).webp"], "description" => "Premium design with luxurious appeal."],
        ["cardName" => "Card Design #1150", "imageFile" => "img/wedding/1150 (1).webp", "additionalImages" => ["img/wedding/1150 (2).webp"], "description" => "Elegant premium collection."],
        ["cardName" => "Card Design #1205", "imageFile" => "img/wedding/1205 (1).webp", "additionalImages" => ["img/wedding/1205 (2).webp"], "description" => "High-end design with premium finishes."],
        ["cardName" => "Card Design #1212", "imageFile" => "img/wedding/1212 (1).webp", "additionalImages" => ["img/wedding/1212 (2).webp", "img/wedding/1212 (3).webp"], "description" => "Luxury design series."],
        ["cardName" => "Card Design #1218", "imageFile" => "img/wedding/1218 (1).webp", "additionalImages" => ["img/wedding/1218 (2).webp"], "description" => "Premium elegant design."],
        ["cardName" => "Card Design #1220", "imageFile" => "img/wedding/1220 (1).webp", "additionalImages" => ["img/wedding/1220 (2).webp", "img/wedding/1220 (3).webp", "img/wedding/1220 (4).webp"], "description" => "Comprehensive premium collection."],
        ["cardName" => "Card Design #1222", "imageFile" => "img/wedding/1222 (1).webp", "additionalImages" => ["img/wedding/1222 (2).webp"], "description" => "High-end design with luxury elements."],
        ["cardName" => "Card Design #1230", "imageFile" => "img/wedding/1230 (1).webp", "additionalImages" => ["img/wedding/1230 (2).webp"], "description" => "Premium elegant layout."],
        ["cardName" => "Card Design #1235", "imageFile" => "img/wedding/1235 (1).webp", "additionalImages" => ["img/wedding/1235 (2).webp"], "description" => "Luxury design with premium appeal."],
        ["cardName" => "Card Design #1250", "imageFile" => "img/wedding/1250 (1).webp", "additionalImages" => ["img/wedding/1250 (2).webp"], "description" => "High-end collection."],
        ["cardName" => "Card Design #1295", "imageFile" => "img/wedding/1295 (1).webp", "additionalImages" => ["img/wedding/1295 (2).webp"], "description" => "Premium design series."],
        ["cardName" => "Card Design #1301", "imageFile" => "img/wedding/1301 (1).webp", "additionalImages" => ["img/wedding/1301 (2).webp"], "description" => "Luxury elegant design."],
        ["cardName" => "Card Design #1305", "imageFile" => "img/wedding/1305 (1).webp", "additionalImages" => ["img/wedding/1305 (2).webp"], "description" => "High-end premium collection."],
        ["cardName" => "Card Design #1315", "imageFile" => "img/wedding/1315 (1).webp", "additionalImages" => ["img/wedding/1315 (2).webp"], "description" => "Premium design with luxury finishes."],
        ["cardName" => "Card Design #1325", "imageFile" => "img/wedding/1325 (1).webp", "additionalImages" => ["img/wedding/1325 (2).webp", "img/wedding/1325 (3).webp"], "description" => "Comprehensive luxury series."],
        ["cardName" => "Card Design #1330", "imageFile" => "img/wedding/1330 (1).webp", "additionalImages" => ["img/wedding/1330 (2).webp"], "description" => "High-end elegant design."],
        ["cardName" => "Card Design #1335", "imageFile" => "img/wedding/1335 (1).webp", "additionalImages" => ["img/wedding/1335 (2).webp"], "description" => "Premium luxury collection."],
        ["cardName" => "Card Design #1345", "imageFile" => "img/wedding/1345 (1).webp", "additionalImages" => ["img/wedding/1345 (2).webp", "img/wedding/1345 (3).webp"], "description" => "Luxury design series with multiple options."],
        ["cardName" => "Card Design #1355", "imageFile" => "img/wedding/1355 (1).webp", "additionalImages" => ["img/wedding/1355 (2).webp"], "description" => "High-end premium design."],
        ["cardName" => "Card Design #1360", "imageFile" => "img/wedding/1360 (1).webp", "additionalImages" => ["img/wedding/1360 (2).webp", "img/wedding/1360 (3).webp"], "description" => "Modern minimalist approach."],
        ["cardName" => "Card Design #1365", "imageFile" => "img/wedding/1365 (1).webp", "additionalImages" => ["img/wedding/1365 (2).webp", "img/wedding/1365 (3).webp"], "description" => "Comprehensive luxury collection."],
        ["cardName" => "Card Design #1403", "imageFile" => "img/wedding/1403 (1).webp", "additionalImages" => ["img/wedding/1403 (2).webp"], "description" => "Premium design with elegant appeal."],
        ["cardName" => "Card Design #1502", "imageFile" => "img/wedding/1502 (1).webp", "additionalImages" => ["img/wedding/1502 (2).webp", "img/wedding/1502 (3).webp"], "description" => "Luxury series with premium options."],
        ["cardName" => "Card Design #1550", "imageFile" => "img/wedding/1550 (1).webp", "additionalImages" => ["img/wedding/1550 (2).webp"], "description" => "High-end elegant design."],
        ["cardName" => "Card Design #1555", "imageFile" => "img/wedding/1555 (1).webp", "additionalImages" => ["img/wedding/1555 (2).webp", "img/wedding/1555 (3).webp", "img/wedding/1555 (4).webp", "img/wedding/1555 (5).webp", "img/wedding/1555 (6).webp"], "description" => "Comprehensive premium luxury collection."],
        ["cardName" => "Card Design #1610", "imageFile" => "img/wedding/1610 (1).webp", "additionalImages" => ["img/wedding/1610 (2).webp"], "description" => "High-end design with luxury appeal."],
        ["cardName" => "Card Design #1700", "imageFile" => "img/wedding/1700 (1).webp", "additionalImages" => ["img/wedding/1700 (2).webp", "img/wedding/1700 (3).webp"], "description" => "Premium luxury series."],
        ["cardName" => "Card Design #1710", "imageFile" => "img/wedding/1710 (1).webp", "additionalImages" => ["img/wedding/1710 (2).webp"], "description" => "High-end elegant collection."],
        ["cardName" => "Card Design #1720", "imageFile" => "img/wedding/1720 (1).webp", "additionalImages" => ["img/wedding/1720 (2).webp"], "description" => "Premium design with luxury elements."],
        ["cardName" => "Card Design #1725", "imageFile" => "img/wedding/1725 (1).webp", "additionalImages" => ["img/wedding/1725 (2).webp"], "description" => "High-end luxury collection."],
        ["cardName" => "Card Design #1750", "imageFile" => "img/wedding/1750 (1).webp", "additionalImages" => ["img/wedding/1750 (2).webp", "img/wedding/1750 (3).webp"], "description" => "Premium design series with elegant options."],
        ["cardName" => "Card Design #1760", "imageFile" => "img/wedding/1760 (1).webp", "additionalImages" => ["img/wedding/1760 (2).webp"], "description" => "Luxury high-end design."],
        ["cardName" => "Card Design #1770", "imageFile" => "img/wedding/1770 (1).webp", "additionalImages" => ["img/wedding/1770 (2).webp", "img/wedding/1770 (3).webp"], "description" => "Comprehensive premium collection."],
        ["cardName" => "Card Design #1780", "imageFile" => "img/wedding/1780 (1).webp", "additionalImages" => ["img/wedding/1780 (2).webp", "img/wedding/1780 (3).webp"], "description" => "Luxury design series."],
        ["cardName" => "Card Design #1785", "imageFile" => "img/wedding/1785 (1).webp", "additionalImages" => ["img/wedding/1785 (2).webp", "img/wedding/1785 (3).webp"], "description" => "High-end premium options."],
        ["cardName" => "Card Design #1790", "imageFile" => "img/wedding/1790 (1).webp", "additionalImages" => ["img/wedding/1790 (2).webp", "img/wedding/1790 (3).webp"], "description" => "Premium luxury collection."],
        ["cardName" => "Card Design #1795", "imageFile" => "img/wedding/1795 (1).webp", "additionalImages" => ["img/wedding/1795 (2).webp", "img/wedding/1795 (3).webp"], "description" => "Comprehensive high-end series."],
        ["cardName" => "Card Design #1801", "imageFile" => "img/wedding/1801 (1).webp", "additionalImages" => ["img/wedding/1801 (2).webp", "img/wedding/1801 (3).webp"], "description" => "Luxury design with premium appeal."],
        ["cardName" => "Card Design #1850", "imageFile" => "img/wedding/1850 (1).webp", "additionalImages" => ["img/wedding/1850 (2).webp", "img/wedding/1850 (3).webp"], "description" => "High-end elegant collection."],
        ["cardName" => "Card Design #1855", "imageFile" => "img/wedding/1855 (1).webp", "additionalImages" => ["img/wedding/1855 (2).webp", "img/wedding/1855 (3).webp", "img/wedding/1855 (4).webp"], "description" => "Heavy weight stock with custom laser cutting and bespoke insert envelopes."],
        ["cardName" => "Card Design #1910", "imageFile" => "img/wedding/1910 (1).webp", "additionalImages" => ["img/wedding/1910 (2).webp"], "description" => "Premium luxury design."],
        ["cardName" => "Card Design #1920", "imageFile" => "img/wedding/1920 (1).webp", "additionalImages" => ["img/wedding/1920 (2).webp"], "description" => "High-end elegant series."],
        ["cardName" => "Card Design #1935", "imageFile" => "img/wedding/1935 (1).webp", "additionalImages" => ["img/wedding/1935 (2).webp"], "description" => "Premium design with luxury appeal."],
        ["cardName" => "Card Design #1940", "imageFile" => "img/wedding/1940 (1).webp", "additionalImages" => ["img/wedding/1940 (2).webp", "img/wedding/1940 (3).webp"], "description" => "Comprehensive luxury collection."],
        ["cardName" => "Card Design #1945", "imageFile" => "img/wedding/1945 (1).webp", "additionalImages" => ["img/wedding/1945 (2).webp", "img/wedding/1945 (3).webp"], "description" => "High-end premium series."],
        ["cardName" => "Card Design #1950", "imageFile" => "img/wedding/1950 (1).webp", "additionalImages" => ["img/wedding/1950 (2).webp", "img/wedding/1950 (3).webp"], "description" => "Luxury design with elegant options."],
        ["cardName" => "Card Design #1955", "imageFile" => "img/wedding/1955 (1).webp", "additionalImages" => ["img/wedding/1955 (2).webp"], "description" => "Premium high-end collection."],
        ["cardName" => "Card Design #1960", "imageFile" => "img/wedding/1960 (1).webp", "additionalImages" => ["img/wedding/1960 (2).webp"], "description" => "Luxury design with premium finishes."],
        ["cardName" => "Card Design #1970", "imageFile" => "img/wedding/1970 (1).webp", "additionalImages" => ["img/wedding/1970 (2).webp", "img/wedding/1970 (3).webp"], "description" => "Comprehensive premium series."],
        ["cardName" => "Card Design #1980", "imageFile" => "img/wedding/1980 (1).webp", "additionalImages" => ["img/wedding/1980 (2).webp", "img/wedding/1980 (3).webp"], "description" => "High-end luxury collection."],
        ["cardName" => "Card Design #1990", "imageFile" => "img/wedding/1990 (1).webp", "additionalImages" => ["img/wedding/1990 (2).webp"], "description" => "Premium design with elegant appeal."],
        ["cardName" => "Card Design #1995", "imageFile" => "img/wedding/1995 (1).webp", "additionalImages" => ["img/wedding/1995 (2).webp"], "description" => "Luxury high-end series."],
        ["cardName" => "Card Design #2000", "imageFile" => "img/wedding/2000 (1).webp", "additionalImages" => ["img/wedding/2000 (2).webp"], "description" => "Premium design collection."],
        ["cardName" => "Card Design #2005", "imageFile" => "img/wedding/2005 (1).webp", "additionalImages" => ["img/wedding/2005 (2).webp"], "description" => "High-end luxury design."],
        ["cardName" => "Card Design #2010", "imageFile" => "img/wedding/2010 (1).webp", "additionalImages" => ["img/wedding/2010 (2).webp"], "description" => "Premium elegant series."],
        ["cardName" => "Card Design #2015", "imageFile" => "img/wedding/2015 (1).webp", "additionalImages" => ["img/wedding/2015 (2).webp"], "description" => "Luxury design with premium appeal."],
        ["cardName" => "Card Design #2020", "imageFile" => "img/wedding/2020 (1).webp", "additionalImages" => ["img/wedding/2020 (2).webp"], "description" => "High-end collection."],
        ["cardName" => "Card Design #2024", "imageFile" => "img/wedding/2024 (1).webp", "additionalImages" => ["img/wedding/2024 (2).webp"], "description" => "Premium luxury design."],
        ["cardName" => "Card Design #2025", "imageFile" => "img/wedding/2025 (1).webp", "additionalImages" => ["img/wedding/2025 (2).webp", "img/wedding/2025 (3).webp"], "description" => "Comprehensive high-end series."],
        ["cardName" => "Card Design #2030", "imageFile" => "img/wedding/2030 (1).webp", "additionalImages" => ["img/wedding/2030 (2).webp", "img/wedding/2030 (3).webp"], "description" => "Luxury design collection."],
        ["cardName" => "Card Design #2040", "imageFile" => "img/wedding/2040 (1).webp", "additionalImages" => ["img/wedding/2040 (2).webp", "img/wedding/2040 (3).webp", "img/wedding/2040 (4).webp"], "description" => "Premium comprehensive series."],
        ["cardName" => "Card Design #2050", "imageFile" => "img/wedding/2050 (1).webp", "additionalImages" => ["img/wedding/2050 (2).webp", "img/wedding/2050 (3).webp"], "description" => "High-end luxury collection."],
        ["cardName" => "Card Design #2070", "imageFile" => "img/wedding/2070 (1).webp", "additionalImages" => ["img/wedding/2070 (2).webp", "img/wedding/2070 (3).webp"], "description" => "Premium design series."],
        ["cardName" => "Card Design #2075", "imageFile" => "img/wedding/2075 (1).webp", "additionalImages" => ["img/wedding/2075 (2).webp", "img/wedding/2075 (3).webp", "img/wedding/2075 (4).webp"], "description" => "Comprehensive luxury options."],
        ["cardName" => "Card Design #2085", "imageFile" => "img/wedding/2085 (1).webp", "additionalImages" => ["img/wedding/2085 (2).webp", "img/wedding/2085 (3).webp"], "description" => "High-end premium design."],
        ["cardName" => "Card Design #2090", "imageFile" => "img/wedding/2090 (1).webp", "additionalImages" => ["img/wedding/2090 (2).webp", "img/wedding/2090 (3).webp"], "description" => "Luxury elegant collection."],
        ["cardName" => "Card Design #2100", "imageFile" => "img/wedding/2100 (1).webp", "additionalImages" => ["img/wedding/2100 (2).webp", "img/wedding/2100 (3).webp", "img/wedding/2100 (4).webp"], "description" => "Comprehensive premium series."],
        ["cardName" => "Card Design #2105", "imageFile" => "img/wedding/2105 (1).webp", "additionalImages" => ["img/wedding/2105 (2).webp", "img/wedding/2105 (3).webp", "img/wedding/2105 (4).webp"], "description" => "High-end luxury options."],
        ["cardName" => "Card Design #2110", "imageFile" => "img/wedding/2110 (1).webp", "additionalImages" => ["img/wedding/2110 (2).webp", "img/wedding/2110 (3).webp"], "description" => "Premium design collection."],
        ["cardName" => "Card Design #2115", "imageFile" => "img/wedding/2115 (1).webp", "additionalImages" => ["img/wedding/2115 (2).webp", "img/wedding/2115 (3).webp"], "description" => "Luxury high-end series."],
        ["cardName" => "Card Design #2120", "imageFile" => "img/wedding/2120 (1).webp", "additionalImages" => ["img/wedding/2120 (2).webp", "img/wedding/2120 (3).webp", "img/wedding/2120 (4).webp"], "description" => "Comprehensive premium collection."],
        ["cardName" => "Card Design #2125", "imageFile" => "img/wedding/2125 (1).webp", "additionalImages" => ["img/wedding/2125 (2).webp", "img/wedding/2125 (3).webp"], "description" => "High-end luxury design."],
        ["cardName" => "Card Design #2130", "imageFile" => "img/wedding/2130 (1).webp", "additionalImages" => ["img/wedding/2130 (2).webp", "img/wedding/2130 (3).webp"], "description" => "Premium elegant series."],
        ["cardName" => "Card Design #2135", "imageFile" => "img/wedding/2135 (1).webp", "additionalImages" => ["img/wedding/2135 (2).webp", "img/wedding/2135 (3).webp"], "description" => "Luxury comprehensive collection."],
        ["cardName" => "Card Design #2140", "imageFile" => "img/wedding/2140 (1).webp", "additionalImages" => ["img/wedding/2140 (2).webp", "img/wedding/2140 (3).webp"], "description" => "High-end premium options."],
        ["cardName" => "Card Design #3001", "imageFile" => "img/wedding/3001 (1).webp", "additionalImages" => ["img/wedding/3001 (2).webp", "img/wedding/3001 (3).webp"], "description" => "Premium luxury series."],
        ["cardName" => "Card Design #3002", "imageFile" => "img/wedding/3002 (1).webp", "additionalImages" => ["img/wedding/3002 (2).webp", "img/wedding/3002 (3).webp"], "description" => "High-end comprehensive collection."],
        ["cardName" => "Card Design #3005", "imageFile" => "img/wedding/3005 (1).webp", "additionalImages" => ["img/wedding/3005 (2).webp"], "description" => "Premium elegant design."],
        ["cardName" => "Card Design #3010", "imageFile" => "img/wedding/3010.webp", "additionalImages" => ["img/wedding/3010 (2).webp"], "description" => "Simple and elegant design."],
        ["cardName" => "Card Design #3020", "imageFile" => "img/wedding/3020 (1).webp", "additionalImages" => ["img/wedding/3020 (2).webp"], "description" => "Luxury high-end series."],
        ["cardName" => "Card Design #3030", "imageFile" => "img/wedding/3030 (1).webp", "additionalImages" => ["img/wedding/3030 (2).webp"], "description" => "High-end luxury design."],
        ["cardName" => "Card Design #3050", "imageFile" => "img/wedding/3050 (1).webp", "additionalImages" => ["img/wedding/3050 (2).webp"], "description" => "Premium elegant series."],
        ["cardName" => "Card Design #3075", "imageFile" => "img/wedding/3075 (1).webp", "additionalImages" => ["img/wedding/3075 (2).webp"], "description" => "Luxury high-end collection."],
        ["cardName" => "Card Design #3095", "imageFile" => "img/wedding/3095 (1).webp", "additionalImages" => ["img/wedding/3095 (2).webp", "img/wedding/3095 (3).webp"], "description" => "Premium comprehensive series."],
        ["cardName" => "Card Design #3110", "imageFile" => "img/wedding/3110 (1).webp", "additionalImages" => ["img/wedding/3110 (2).webp"], "description" => "High-end luxury options."]
    ]
];

// Merge prices from database into the meta data structure
foreach ($wedding_card_meta as $category => &$cards) {
    foreach ($cards as &$card) {
        $cardName = $card['cardName'];
        if (isset($wedding_prices_map[$cardName])) {
            // Found price in database (price is for 100 pcs)
            $card['bulkPrice100'] = $wedding_prices_map[$cardName];
        } else {
            // Default or fallback price if not found in DB
            $card['bulkPrice100'] = 1500.00;
        }
    }
}
unset($cards); // Break the reference with the last element

$final_json['Wedding Card Designs'] = $wedding_card_meta;

echo json_encode($final_json, JSON_PRETTY_PRINT);
?>