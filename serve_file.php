<?php
/**
 * File Serving Script
 * Serves downloaded files and cleans up after delivery
 */

// Security check - only allow access to tmp files
$filename = $_GET['file'] ?? '';
$tmpDir = __DIR__ . '/tmp/';
$filepath = $tmpDir . basename($filename);

// Validate file exists and is in tmp directory
if (empty($filename) || !file_exists($filepath) || !is_file($filepath)) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit;
}

// Security check - ensure file is in tmp directory
$realPath = realpath($filepath);
$realTmpDir = realpath($tmpDir);
if (strpos($realPath, $realTmpDir) !== 0) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

// Get file info
$filesize = filesize($filepath);
$extension = pathinfo($filepath, PATHINFO_EXTENSION);

// Set appropriate headers for better mobile download support
header('Content-Type: application/force-download');
header('Content-Type: application/octet-stream');
header('Content-Type: application/download');
header('Content-Disposition: attachment; filename="' . basename($filename) . '"');
header('Content-Transfer-Encoding: binary');
header('Content-Length: ' . $filesize);
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Pragma: public');
header('Expires: 0');

// Read and output file in chunks for large files
$handle = fopen($filepath, 'rb');
if ($handle) {
    while (!feof($handle)) {
        echo fread($handle, 8192); // Read 8KB chunks
        flush();
    }
    fclose($handle);
}

// Schedule file for cleanup after a delay (don't delete immediately)
ignore_user_abort(true);
register_shutdown_function(function() use ($filepath) {
    sleep(5); // Wait 5 seconds before cleanup
    if (file_exists($filepath)) {
        unlink($filepath);
    }
});
?>