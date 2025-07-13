<?php
require_once '../vendor/autoload.php'; // Dompdf
session_start();
require_once 'db.php';

use Dompdf\Dompdf;
use Dompdf\Options;

header('Content-Type: application/json');

if (!isset($_SESSION['company_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado como empresa']);
    exit;
}

if (!isset($_GET['test_id'])) {
    echo json_encode(['success' => false, 'message' => 'ID de test requerido']);
    exit;
}

$testId = intval($_GET['test_id']);
$companyId = $_SESSION['company_id'];

// Obtener datos del test y empresa
$stmt = $conn->prepare('SELECT st.title, st.description, c.company_name FROM skill_tests st JOIN companies c ON st.company_id = c.id WHERE st.id = ? AND st.company_id = ?');
$stmt->bind_param('ii', $testId, $companyId);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Test no encontrado o no autorizado']);
    exit;
}
$test = $result->fetch_assoc();
$stmt->close();

// Obtener asignaciones y resultados
$stmt = $conn->prepare('
    SELECT ta.id as assignment_id, u.name as user_name, u.email as user_email, ta.status, ta.total_score, ta.max_score, ta.completed_at
    FROM test_assignments ta
    JOIN users u ON ta.user_id = u.id
    WHERE ta.test_id = ?
    ORDER BY ta.completed_at DESC, ta.assigned_at DESC
');
$stmt->bind_param('i', $testId);
$stmt->execute();
$result = $stmt->get_result();
$assignments = [];
while ($row = $result->fetch_assoc()) {
    $assignments[] = $row;
}
$stmt->close();

// Generar HTML para el PDF
$html = '<h2>Resultados del Test: ' . htmlspecialchars($test['title']) . '</h2>';
$html .= '<p><strong>Empresa:</strong> ' . htmlspecialchars($test['company_name']) . '</p>';
$html .= '<p><strong>Descripción:</strong> ' . htmlspecialchars($test['description']) . '</p>';
$html .= '<table border="1" cellpadding="5" cellspacing="0" width="100%" style="border-collapse:collapse; margin-top:20px;">
    <thead>
        <tr>
            <th>Candidato</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Puntaje</th>
            <th>Fecha Completado</th>
        </tr>
    </thead>
    <tbody>';
foreach ($assignments as $a) {
    $html .= '<tr>';
    $html .= '<td>' . htmlspecialchars($a['user_name']) . '</td>';
    $html .= '<td>' . htmlspecialchars($a['user_email']) . '</td>';
    $html .= '<td>' . htmlspecialchars($a['status']) . '</td>';
    $score = ($a['total_score'] !== null && $a['max_score'] > 0) ? ($a['total_score'] . ' / ' . $a['max_score']) : 'N/A';
    $html .= '<td>' . $score . '</td>';
    $html .= '<td>' . ($a['completed_at'] ? $a['completed_at'] : '-') . '</td>';
    $html .= '</tr>';
}
$html .= '</tbody></table>';

// Opciones Dompdf
$options = new Options();
$options->set('isHtml5ParserEnabled', true);
$options->set('isRemoteEnabled', true);
$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

// Descargar PDF
$pdfName = 'resultados_test_' . $testId . '.pdf';
header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="' . $pdfName . '"');
echo $dompdf->output();
exit; 