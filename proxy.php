<?php
// Ce fichier sert de pont entre Hostinger et votre serveur Node.js
// Il contourne les restrictions de proxy du serveur Apache mutualisé

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? $_GET['path'] : '';
// Utiliser localhost au lieu de 127.0.0.1 peut être plus stable sur certains serveurs Hostinger
$url = "http://localhost:3000/api/" . $path;

// Récupérer les en-têtes de la requête originale
$headers = array();
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (strtolower($name) !== 'host' && strtolower($name) !== 'content-length') {
            $headers[] = "$name: $value";
        }
    }
}
$headers[] = 'Content-Type: application/json';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if ($method == 'POST' || $method == 'PUT' || $method == 'PATCH') {
    $data = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    header('Content-Type: application/json');
    http_response_code(502);
    echo json_encode(["message" => "Proxy Error: " . $error_msg]);
    curl_close($ch);
    exit;
}

curl_close($ch);

header('Content-Type: application/json');
http_response_code($httpCode);
echo $response;
?>
