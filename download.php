<?php
/**
 * YouTube Downloader - PHP Backend
 * Handles video downloads using yt-dlp
 */

// Suppress all PHP errors and warnings to ensure clean JSON output
error_reporting(0);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

// Set proper headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

class YouTubeDownloader {
    private $tmpDir;
    private $maxFileSize = 500 * 1024 * 1024; // 500MB limit
    private $allowedFormats = ['hd', '1080p', '720p', 'mp3', 'mp4'];
    
    public function __construct() {
        $this->tmpDir = __DIR__ . '/tmp/';
        
        // Create tmp directory if it doesn't exist
        if (!is_dir($this->tmpDir)) {
            mkdir($this->tmpDir, 0755, true);
        }
        
        // Clean old files on startup
        $this->cleanOldFiles();
    }
    
    public function handleRequest() {
        try {
            // Handle test connection request
            if (isset($_POST['test'])) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Connection successful',
                    'yt_dlp_available' => $this->checkYtDlpAvailable()
                ]);
                return;
            }
            
            // Validate input
            $url = $this->validateUrl($_POST['url'] ?? '');
            $format = $this->validateFormat($_POST['format'] ?? '');
            
            // Check if yt-dlp is available
            if (!$this->checkYtDlpAvailable()) {
                throw new Exception('yt-dlp is not installed or not accessible');
            }
            
            // Download the video
            $result = $this->downloadVideo($url, $format);
            
            echo json_encode([
                'success' => true,
                'filename' => $result['filename'],
                'download_url' => $result['download_url'],
                'filesize' => $result['filesize']
            ]);
            
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function validateUrl($url) {
        $url = trim($url);
        
        if (empty($url)) {
            throw new Exception('URL is required');
        }
        
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new Exception('Invalid URL format');
        }
        
        // Check if it's a YouTube URL
        $youtubePattern = '/^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)/';
        if (!preg_match($youtubePattern, $url)) {
            throw new Exception('Please provide a valid YouTube URL');
        }
        
        return $url;
    }
    
    private function validateFormat($format) {
        if (!in_array($format, $this->allowedFormats)) {
            throw new Exception('Invalid format. Allowed formats: ' . implode(', ', $this->allowedFormats));
        }
        
        return $format;
    }
    
    private function checkYtDlpAvailable() {
        $output = [];
        $returnCode = 0;
        
        // Try the latest version first
        exec('/tmp/yt-dlp --version 2>/dev/null', $output, $returnCode);
        if ($returnCode === 0) {
            return true;
        }
        
        exec('which yt-dlp 2>/dev/null', $output, $returnCode);
        
        if ($returnCode !== 0) {
            // Try alternative installation paths
            $paths = ['/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp', './yt-dlp'];
            foreach ($paths as $path) {
                if (file_exists($path) && is_executable($path)) {
                    return true;
                }
            }
            return false;
        }
        
        return true;
    }
    
    private function getYtDlpCommand() {
        // Use the latest version if available
        if (file_exists('/tmp/yt-dlp') && is_executable('/tmp/yt-dlp')) {
            return '/tmp/yt-dlp';
        }
        return 'yt-dlp';
    }
    
    private function downloadVideo($url, $format) {
        $timestamp = time();
        $randomId = uniqid();
        $outputTemplate = $this->tmpDir . $timestamp . '_' . $randomId . '.%(ext)s';
        
        // Build yt-dlp command based on format with better options to avoid bot detection
        $commonOptions = '--no-playlist --geo-bypass --no-check-certificate --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --add-header "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" --add-header "Accept-Language:en-us,en;q=0.5" --add-header "Sec-Fetch-Mode:navigate" --extractor-retries 5 --fragment-retries 5 --socket-timeout 30';
        
        $ytDlpCmd = $this->getYtDlpCommand();
        
        if ($format === 'hd' || $format === 'mp4') {
            // Best available HD Video (MP4)
            $command = sprintf(
                '%s --format "best[height>=720][ext=mp4]/best[ext=mp4]/best" ' .
                '--merge-output-format mp4 ' .
                '--sleep-interval 1 --max-sleep-interval 3 ' .
                '%s ' .
                '-o %s %s 2>&1',
                $ytDlpCmd,
                $commonOptions,
                escapeshellarg($outputTemplate),
                escapeshellarg($url)
            );
        } elseif ($format === '1080p') {
            // Full HD 1080p Video
            $command = sprintf(
                '%s --format "best[height>=1080][ext=mp4]/best[height=1080]/best[ext=mp4]/best" ' .
                '--merge-output-format mp4 ' .
                '--sleep-interval 1 --max-sleep-interval 3 ' .
                '%s ' .
                '-o %s %s 2>&1',
                $ytDlpCmd,
                $commonOptions,
                escapeshellarg($outputTemplate),
                escapeshellarg($url)
            );
        } elseif ($format === '720p') {
            // HD 720p Video
            $command = sprintf(
                '%s --format "best[height>=720][height<=720][ext=mp4]/best[height=720]/best[ext=mp4]/best" ' .
                '--merge-output-format mp4 ' .
                '--sleep-interval 1 --max-sleep-interval 3 ' .
                '%s ' .
                '-o %s %s 2>&1',
                $ytDlpCmd,
                $commonOptions,
                escapeshellarg($outputTemplate),
                escapeshellarg($url)
            );
        } else {
            // MP3 Audio only
            $command = sprintf(
                '%s --format "bestaudio/best" ' .
                '--extract-audio ' .
                '--audio-format mp3 ' .
                '--audio-quality 0 ' .
                '--sleep-interval 1 --max-sleep-interval 3 ' .
                '%s ' .
                '-o %s %s 2>&1',
                $ytDlpCmd,
                $commonOptions,
                escapeshellarg($outputTemplate),
                escapeshellarg($url)
            );
        }
        
        // Execute the command
        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);
        
        // Log the full command and output for debugging
        error_log("yt-dlp command: " . $command);
        error_log("yt-dlp return code: " . $returnCode);
        error_log("yt-dlp output: " . implode("\n", $output));
        
        if ($returnCode !== 0) {
            $errorMessage = implode("\n", $output);
            throw new Exception('Download failed: ' . $this->parseYtDlpError($errorMessage));
        }
        
        // Find the downloaded file
        $downloadedFile = $this->findDownloadedFile($timestamp, $randomId);
        
        if (!$downloadedFile) {
            throw new Exception('Downloaded file not found');
        }
        
        // Check file size
        $filesize = filesize($downloadedFile);
        if ($filesize > $this->maxFileSize) {
            unlink($downloadedFile);
            throw new Exception('File too large (max 500MB allowed)');
        }
        
        // Generate a clean filename
        $extension = pathinfo($downloadedFile, PATHINFO_EXTENSION);
        $cleanFilename = 'download_' . date('Y-m-d_H-i-s') . '.' . $extension;
        
        // Create download URL
        $downloadUrl = 'private/serve_file.php?file=' . urlencode(basename($downloadedFile));
        
        return [
            'filename' => $cleanFilename,
            'download_url' => $downloadUrl,
            'filesize' => $filesize,
            'filepath' => $downloadedFile
        ];
    }
    
    private function findDownloadedFile($timestamp, $randomId) {
        $pattern = $this->tmpDir . $timestamp . '_' . $randomId . '.*';
        $files = glob($pattern);
        
        if (empty($files)) {
            return null;
        }
        
        // Return the first matching file
        return $files[0];
    }
    
    private function getVideoTitle($url) {
        $ytDlpCmd = $this->getYtDlpCommand();
        $command = sprintf(
            '%s --get-title --no-warnings %s 2>/dev/null',
            $ytDlpCmd,
            escapeshellarg($url)
        );
        
        $title = trim(shell_exec($command));
        
        if (empty($title)) {
            return 'youtube_video_' . date('Y-m-d_H-i-s');
        }
        
        return $title;
    }
    
    private function sanitizeFilename($filename) {
        // Remove or replace invalid characters
        $filename = preg_replace('/[^\w\s-.]/', '', $filename);
        $filename = preg_replace('/\s+/', '_', $filename);
        $filename = trim($filename, '_-.');
        
        // Limit length
        if (strlen($filename) > 100) {
            $filename = substr($filename, 0, 100);
        }
        
        return $filename ?: 'download';
    }
    
    private function parseYtDlpError($errorMessage) {
        // Common error patterns and user-friendly messages
        $errorPatterns = [
            '/Video unavailable/' => 'Video is unavailable or private',
            '/This video is not available/' => 'Video is not available in your region',
            '/Private video/' => 'This is a private video',
            '/Sign in to confirm your age/' => 'Age-restricted video cannot be downloaded',
            '/Video removed/' => 'Video has been removed',
            '/Copyright/' => 'Video is copyright protected',
            '/network/' => 'Network connection error',
            '/No video formats found/' => 'No suitable video format found'
        ];
        
        foreach ($errorPatterns as $pattern => $message) {
            if (preg_match($pattern, $errorMessage)) {
                return $message;
            }
        }
        
        // Return generic error if no pattern matches
        return 'Unable to download video. Please check the URL and try again.';
    }
    
    private function cleanOldFiles() {
        $files = glob($this->tmpDir . '*');
        $maxAge = 3600; // 1 hour
        
        foreach ($files as $file) {
            if (is_file($file) && (time() - filemtime($file)) > $maxAge) {
                unlink($file);
            }
        }
    }
}

// Handle the request with error catching
try {
    $downloader = new YouTubeDownloader();
    $downloader->handleRequest();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
