<?php
/**
 * ============================================
 * Laundry Suite — PHP Backend API
 * ============================================
 * 
 * Endpoint tunggal untuk sinkronisasi data dari client (localStorage) ke MySQL.
 * 
 * Setup Database:
 * 1. Buat database MySQL: `laundry_suite`
 * 2. Jalankan SQL di bawah ini untuk membuat tabel.
 * 3. Sesuaikan kredensial di bagian $DB_CONFIG.
 * 
 * Endpoint:
 *   POST /api.php  { action: "sync", data: { orders, customers, todos, deliveries } }
 *   POST /api.php  { action: "get_orders" }
 *   POST /api.php  { action: "get_customers" }
 *   POST /api.php  { action: "save_order", data: { ...orderData } }
 */

// ===== CORS Headers =====
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ===== Database Configuration =====
$DB_CONFIG = [
    'host'     => 'localhost',
    'dbname'   => 'laundry_suite',
    'username' => 'root',
    'password' => '',
    'charset'  => 'utf8mb4',
];

// ===== Database Connection =====
function getDB($config) {
    try {
        $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}";
        $pdo = new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}

// ===== Response Helper =====
function respond($success, $data = null, $error = null) {
    echo json_encode([
        'success' => $success,
        'data'    => $data,
        'error'   => $error,
        'timestamp' => date('c'),
    ]);
    exit();
}

// ===== Read JSON Body =====
$body = json_decode(file_get_contents('php://input'), true);

if (!$body || !isset($body['action'])) {
    respond(false, null, 'Invalid request. Expected JSON with "action" field.');
}

$action = $body['action'];
$data   = $body['data'] ?? null;

// ===== Connect to DB =====
$db = getDB($DB_CONFIG);
if (!$db) {
    // If DB is not available, still respond gracefully
    if ($action === 'sync') {
        respond(false, null, 'Database connection failed. Data saved locally only.');
    }
    respond(false, null, 'Database connection failed.');
}

// ===== Initialize Tables =====
function initTables($db) {
    $db->exec("
        CREATE TABLE IF NOT EXISTS customers (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(30) NOT NULL,
            address TEXT,
            loyalty_points INT DEFAULT 0,
            total_kg_washed DECIMAL(10,2) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_phone (phone)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(50) PRIMARY KEY,
            receipt_number VARCHAR(30) NOT NULL UNIQUE,
            customer_id VARCHAR(50) NOT NULL,
            items_json TEXT NOT NULL,
            total_weight DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(12,0) NOT NULL,
            discount DECIMAL(12,0) DEFAULT 0,
            final_price DECIMAL(12,0) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            loyalty_points_earned INT DEFAULT 0,
            loyalty_discount_applied TINYINT(1) DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            estimated_done DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_created (created_at),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS todos (
            id VARCHAR(50) PRIMARY KEY,
            text TEXT NOT NULL,
            completed TINYINT(1) DEFAULT 0,
            priority VARCHAR(10) DEFAULT 'medium',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS deliveries (
            id VARCHAR(50) PRIMARY KEY,
            order_id VARCHAR(50),
            customer_name VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(30),
            address TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            type VARCHAR(10) DEFAULT 'delivery',
            scheduled_at DATETIME,
            completed_at DATETIME NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(50) PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            display_name VARCHAR(255),
            role VARCHAR(20) DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
}

// Ensure tables exist
try {
    initTables($db);
} catch (Exception $e) {
    // Tables might already exist, continue
}

// ===== Action Handlers =====
switch ($action) {

    // ---------- Full Sync ----------
    case 'sync':
        if (!$data) respond(false, null, 'No data provided for sync.');

        $db->beginTransaction();
        try {
            $synced = ['customers' => 0, 'orders' => 0, 'todos' => 0, 'deliveries' => 0];

            // Sync customers
            if (!empty($data['customers'])) {
                $stmt = $db->prepare("
                    INSERT INTO customers (id, name, phone, address, loyalty_points, total_kg_washed, created_at)
                    VALUES (:id, :name, :phone, :address, :lp, :tkg, :cat)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name), phone = VALUES(phone), address = VALUES(address),
                        loyalty_points = VALUES(loyalty_points), total_kg_washed = VALUES(total_kg_washed)
                ");
                foreach ($data['customers'] as $c) {
                    $stmt->execute([
                        ':id' => $c['id'], ':name' => $c['name'], ':phone' => $c['phone'],
                        ':address' => $c['address'] ?? '', ':lp' => $c['loyaltyPoints'] ?? 0,
                        ':tkg' => $c['totalKgWashed'] ?? 0, ':cat' => date('Y-m-d H:i:s', strtotime($c['createdAt'] ?? 'now')),
                    ]);
                    $synced['customers']++;
                }
            }

            // Sync orders
            if (!empty($data['orders'])) {
                $stmt = $db->prepare("
                    INSERT INTO orders (id, receipt_number, customer_id, items_json, total_weight, total_price, discount, final_price, status, loyalty_points_earned, loyalty_discount_applied, notes, created_at, estimated_done)
                    VALUES (:id, :rn, :cid, :items, :tw, :tp, :disc, :fp, :st, :lpe, :lda, :notes, :cat, :ed)
                    ON DUPLICATE KEY UPDATE
                        status = VALUES(status), notes = VALUES(notes)
                ");
                foreach ($data['orders'] as $o) {
                    $stmt->execute([
                        ':id' => $o['id'], ':rn' => $o['receiptNumber'],
                        ':cid' => $o['customer']['id'] ?? '',
                        ':items' => json_encode($o['items']),
                        ':tw' => $o['totalWeight'], ':tp' => $o['totalPrice'],
                        ':disc' => $o['discount'] ?? 0, ':fp' => $o['finalPrice'],
                        ':st' => $o['status'], ':lpe' => $o['loyaltyPointsEarned'] ?? 0,
                        ':lda' => $o['loyaltyDiscountApplied'] ? 1 : 0,
                        ':notes' => $o['notes'] ?? '',
                        ':cat' => date('Y-m-d H:i:s', strtotime($o['createdAt'] ?? 'now')),
                        ':ed' => date('Y-m-d H:i:s', strtotime($o['estimatedDone'] ?? 'now')),
                    ]);
                    $synced['orders']++;
                }
            }

            // Sync todos
            if (!empty($data['todos'])) {
                $stmt = $db->prepare("
                    INSERT INTO todos (id, text, completed, priority, created_at, completed_at)
                    VALUES (:id, :text, :comp, :prio, :cat, :coat)
                    ON DUPLICATE KEY UPDATE
                        text = VALUES(text), completed = VALUES(completed), priority = VALUES(priority), completed_at = VALUES(completed_at)
                ");
                foreach ($data['todos'] as $t) {
                    $stmt->execute([
                        ':id' => $t['id'], ':text' => $t['text'],
                        ':comp' => $t['completed'] ? 1 : 0,
                        ':prio' => $t['priority'] ?? 'medium',
                        ':cat' => date('Y-m-d H:i:s', strtotime($t['createdAt'] ?? 'now')),
                        ':coat' => isset($t['completedAt']) ? date('Y-m-d H:i:s', strtotime($t['completedAt'])) : null,
                    ]);
                    $synced['todos']++;
                }
            }

            // Sync deliveries
            if (!empty($data['deliveries'])) {
                $stmt = $db->prepare("
                    INSERT INTO deliveries (id, order_id, customer_name, customer_phone, address, status, type, scheduled_at, completed_at, notes)
                    VALUES (:id, :oid, :cn, :cp, :addr, :st, :tp, :sa, :ca, :notes)
                    ON DUPLICATE KEY UPDATE
                        status = VALUES(status), completed_at = VALUES(completed_at), notes = VALUES(notes)
                ");
                foreach ($data['deliveries'] as $d) {
                    $stmt->execute([
                        ':id' => $d['id'], ':oid' => $d['orderId'] ?? '',
                        ':cn' => $d['customerName'], ':cp' => $d['customerPhone'] ?? '',
                        ':addr' => $d['address'], ':st' => $d['status'],
                        ':tp' => $d['type'] ?? 'delivery',
                        ':sa' => isset($d['scheduledAt']) ? date('Y-m-d H:i:s', strtotime($d['scheduledAt'])) : null,
                        ':ca' => isset($d['completedAt']) ? date('Y-m-d H:i:s', strtotime($d['completedAt'])) : null,
                        ':notes' => $d['notes'] ?? '',
                    ]);
                    $synced['deliveries']++;
                }
            }

            $db->commit();
            respond(true, ['synced' => $synced, 'syncedAt' => date('c')]);

        } catch (Exception $e) {
            $db->rollBack();
            respond(false, null, 'Sync failed: ' . $e->getMessage());
        }
        break;

    // ---------- Get Orders ----------
    case 'get_orders':
        $rows = $db->query("
            SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, c.loyalty_points
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC
            LIMIT 200
        ")->fetchAll();
        respond(true, $rows);
        break;

    // ---------- Get Customers ----------
    case 'get_customers':
        $rows = $db->query("SELECT * FROM customers ORDER BY name ASC")->fetchAll();
        respond(true, $rows);
        break;

    // ---------- Save Single Order ----------
    case 'save_order':
        if (!$data) respond(false, null, 'No order data provided.');

        try {
            // Ensure customer exists
            $custStmt = $db->prepare("
                INSERT INTO customers (id, name, phone, address, loyalty_points, total_kg_washed)
                VALUES (:id, :name, :phone, :address, :lp, :tkg)
                ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), address = VALUES(address)
            ");
            $c = $data['customer'];
            $custStmt->execute([
                ':id' => $c['id'], ':name' => $c['name'], ':phone' => $c['phone'],
                ':address' => $c['address'] ?? '', ':lp' => $c['loyaltyPoints'] ?? 0,
                ':tkg' => $c['totalKgWashed'] ?? 0,
            ]);

            // Insert order
            $stmt = $db->prepare("
                INSERT INTO orders (id, receipt_number, customer_id, items_json, total_weight, total_price, discount, final_price, status, notes, created_at, estimated_done)
                VALUES (:id, :rn, :cid, :items, :tw, :tp, :disc, :fp, :st, :notes, :cat, :ed)
            ");
            $stmt->execute([
                ':id' => $data['id'], ':rn' => $data['receiptNumber'],
                ':cid' => $c['id'], ':items' => json_encode($data['items']),
                ':tw' => $data['totalWeight'], ':tp' => $data['totalPrice'],
                ':disc' => $data['discount'] ?? 0, ':fp' => $data['finalPrice'],
                ':st' => $data['status'] ?? 'pending', ':notes' => $data['notes'] ?? '',
                ':cat' => date('Y-m-d H:i:s', strtotime($data['createdAt'] ?? 'now')),
                ':ed' => date('Y-m-d H:i:s', strtotime($data['estimatedDone'] ?? 'now')),
            ]);

            respond(true, ['message' => 'Order saved successfully', 'id' => $data['id']]);
        } catch (Exception $e) {
            respond(false, null, 'Save failed: ' . $e->getMessage());
        }
        break;

    // ---------- Update Order Status ----------
    case 'update_status':
        if (!$data || !isset($data['id'], $data['status'])) {
            respond(false, null, 'Missing id or status.');
        }
        try {
            $stmt = $db->prepare("UPDATE orders SET status = :st WHERE id = :id");
            $stmt->execute([':st' => $data['status'], ':id' => $data['id']]);
            respond(true, ['message' => 'Status updated']);
        } catch (Exception $e) {
            respond(false, null, 'Update failed: ' . $e->getMessage());
        }
        break;

    // ---------- Auth: Login ----------
    case 'login':
        if (!$data || !isset($data['username'], $data['password'])) {
            respond(false, null, 'Username and password required.');
        }
        $stmt = $db->prepare("SELECT * FROM users WHERE username = :u OR email = :u");
        $stmt->execute([':u' => $data['username']]);
        $user = $stmt->fetch();

        if ($user && $data['password'] === $user['password']) { // In production use password_verify
            unset($user['password']); // Don't send password back
            respond(true, $user);
        } else {
            respond(false, null, 'Username atau password salah.');
        }
        break;

    // ---------- Auth: Register ----------
    case 'register':
        if (!$data || !isset($data['username'], $data['email'], $data['password'], $data['display_name'])) {
            respond(false, null, 'Semua data wajib diisi.');
        }

        // Check if exists
        $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE username = :u OR email = :e");
        $stmt->execute([':u' => $data['username'], ':e' => $data['email']]);
        if ($stmt->fetchColumn() > 0) {
            respond(false, null, 'Username atau email sudah digunakan.');
        }

        try {
            $stmt = $db->prepare("
                INSERT INTO users (username, email, password, display_name, role)
                VALUES (:u, :e, :p, :d, :r)
            ");
            $stmt->execute([
                ':u' => $data['username'],
                ':e' => $data['email'],
                ':p' => $data['password'], // In production use password_hash
                ':d' => $data['display_name'],
                ':r' => 'user'
            ]);
            respond(true, ['message' => 'Registrasi berhasil']);
        } catch (Exception $e) {
            respond(false, null, 'Gagal mendaftar: ' . $e->getMessage());
        }
        break;

    default:
        respond(false, null, "Unknown action: {$action}");
}
