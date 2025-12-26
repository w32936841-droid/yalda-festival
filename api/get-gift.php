<?php
// version: 0.2 - Get Gift API
header('Content-Type: application/json; charset=utf-8');

// Load database config
require_once __DIR__ . '/../config.php';

// Get user_id from request
$user_id = isset($_POST['user_id']) ? trim($_POST['user_id']) : null;

if (empty($user_id)) {
    echo json_encode(['success' => false, 'message' => 'شناسه کاربر الزامی است'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // 1. Get all gifts with weights
    $stmt = $pdo->query("SELECT id, type, title, weight FROM gifts WHERE weight > 0");
    $gifts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($gifts)) {
        echo json_encode(['success' => false, 'message' => 'هیچ هدیه‌ای موجود نیست'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. Calculate total weight
    $total_weight = array_sum(array_column($gifts, 'weight'));

    // 3. Generate random number between 1 and total_weight
    $random = rand(1, $total_weight);

    // 4. Select gift based on weight
    $cumulative = 0;
    $selected_gift = null;

    foreach ($gifts as $gift) {
        $cumulative += $gift['weight'];
        if ($random <= $cumulative) {
            $selected_gift = $gift;
            break;
        }
    }

    // 5. Generate unique gift code
    $gift_code = strtoupper('YALDA-' . bin2hex(random_bytes(4)));

    // 6. Log the gift in gift_logs
    $stmt = $pdo->prepare("INSERT INTO gift_logs (user_id, gift_id, gift_code) VALUES (?, ?, ?)");
    $stmt->execute([$user_id, $selected_gift['id'], $gift_code]);

    // 7. Return response
    echo json_encode([
        'success' => true,
        'gift' => [
            'type' => $selected_gift['type'],
            'title' => $selected_gift['title'],
            'code' => $gift_code
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'خطا در دریافت هدیه'], JSON_UNESCAPED_UNICODE);
}
