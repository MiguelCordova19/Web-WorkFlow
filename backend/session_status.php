<?php
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '.workflow.estuclan.com',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'loggedIn' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'],
            'userType' => $_SESSION['user_type'],
            'email' => isset($_SESSION['user_email']) ? $_SESSION['user_email'] : '',
            'phone' => isset($_SESSION['user_phone']) ? $_SESSION['user_phone'] : '',
            'location' => isset($_SESSION['user_location']) ? $_SESSION['user_location'] : '',
            'bio' => isset($_SESSION['user_bio']) ? $_SESSION['user_bio'] : ''
        ]
    ]);
} else if (isset($_SESSION['company_id'])) {
    echo json_encode([
        'loggedIn' => true,
        'user' => [
            'id' => $_SESSION['company_id'],
            'name' => $_SESSION['company_name'],
            'userType' => $_SESSION['user_type'],
            'email' => isset($_SESSION['company_email']) ? $_SESSION['company_email'] : '',
            'phone' => isset($_SESSION['company_phone']) ? $_SESSION['company_phone'] : '',
            'website' => isset($_SESSION['company_website']) ? $_SESSION['company_website'] : '',
            'location' => isset($_SESSION['company_location']) ? $_SESSION['company_location'] : '',
            'description' => isset($_SESSION['company_description']) ? $_SESSION['company_description'] : ''
        ]
    ]);
} else {
    echo json_encode(['loggedIn' => false]);
} 