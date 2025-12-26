<?php
// version: 0.2 - db config

$DB_HOST = "localhost";
$DB_NAME = "onvipir1_yalda_festival";
$DB_USER = "onvipir1_yalda_user";
$DB_PASS = "k5n4jBjM@W=(8Ya-";

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed");
}
