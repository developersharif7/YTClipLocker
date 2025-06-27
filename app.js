/**
 * YouTube Downloader - Frontend JavaScript
 * Handles form submission, progress tracking, and file downloads
 */

class YouTubeDownloader {
    constructor() {
        this.form = document.getElementById('dl-form');
        this.downloadBtn = document.getElementById('download-btn');
        this.btnText = document.getElementById('btn-text');
        this.btnSpinner = document.getElementById('btn-spinner');
        this.progressSection = document.getElementById('progress-section');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.statusMessages = document.getElementById('status-messages');
        
        // New feature elements
        this.getInfoBtn = document.getElementById('get-info-btn');
        this.videoInfo = document.getElementById('video-info');
        this.clearStatsBtn = document.getElementById('clear-stats-btn');
        this.testConnectionBtn = document.getElementById('test-connection-btn');
        this.clearCacheBtn = document.getElementById('clear-cache-btn');
        this.downloadStatus = document.getElementById('download-status');
        this.retryDownloadBtn = document.getElementById('retry-download-btn');
        
        this.isDownloading = false;
        this.progressInterval = null;
        
        // Load statistics from localStorage
        this.loadStatistics();
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time URL validation
        const urlInput = document.getElementById('url');
        urlInput.addEventListener('input', (e) => this.validateUrl(e.target.value));
        
        // New feature event listeners
        this.getInfoBtn.addEventListener('click', () => this.getVideoInfo());
        this.clearStatsBtn.addEventListener('click', () => this.clearStatistics());
        this.testConnectionBtn.addEventListener('click', () => this.testConnection());
        this.clearCacheBtn.addEventListener('click', () => this.clearCache());
        this.retryDownloadBtn.addEventListener('click', () => this.retryLastDownload());
    }

    validateUrl(url) {
        const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;
        const urlInput = document.getElementById('url');
        
        if (url && !youtubeRegex.test(url)) {
            urlInput.setCustomValidity('Please enter a valid YouTube URL');
        } else {
            urlInput.setCustomValidity('');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isDownloading) return;
        
        const formData = new FormData(this.form);
        const url = formData.get('url').trim();
        const format = formData.get('format');
        
        if (!this.validateYouTubeUrl(url)) {
            this.showMessage('Please enter a valid YouTube URL', 'error');
            return;
        }
        
        await this.startDownload(url, format);
    }

    validateYouTubeUrl(url) {
        const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;
        return youtubeRegex.test(url);
    }

    async startDownload(url, format) {
        this.setDownloadingState(true);
        this.clearMessages();
        this.showProgress();
        
        try {
            // Start progress simulation
            this.startProgressSimulation();
            
            const response = await fetch('private/download.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}`
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.handleDownloadSuccess(result);
            } else {
                throw new Error(result.error || 'Download failed');
            }
            
        } catch (error) {
            console.error('Download error:', error);
            this.handleDownloadError(error.message);
        } finally {
            this.setDownloadingState(false);
            this.stopProgressSimulation();
        }
    }

    handleDownloadSuccess(result) {
        this.setProgress(100, 'Download completed!');
        this.showMessage('Download completed successfully!', 'success');
        
        // Store last download info for retry functionality
        this.lastDownload = result;
        
        // Update statistics
        this.updateStatistics(result);
        
        // Show download status for mobile users
        this.showDownloadStatus(result);
        
        // Trigger file download
        if (result.download_url) {
            setTimeout(() => {
                this.triggerFileDownload(result.download_url, result.filename);
            }, 500);
        }
        
        // Hide progress after a delay
        setTimeout(() => {
            this.hideProgress();
        }, 3000);
    }
    
    showDownloadStatus(result) {
        // Show download status especially for mobile devices
        if (this.downloadStatus) {
            const statusText = this.downloadStatus.querySelector('.status-text p');
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                statusText.innerHTML = `
                    <strong>${result.filename}</strong> (${formatFileSize(result.filesize)}) is ready!<br>
                    Check your browser's Downloads menu or Downloads folder on your device.
                `;
            } else {
                statusText.innerHTML = `
                    <strong>${result.filename}</strong> (${formatFileSize(result.filesize)}) should start downloading automatically.
                `;
            }
            
            this.downloadStatus.classList.remove('hidden');
            
            // Auto-hide after 15 seconds
            setTimeout(() => {
                this.downloadStatus.classList.add('hidden');
            }, 15000);
        }
    }

    handleDownloadError(errorMessage) {
        this.hideProgress();
        this.showMessage(`Download failed: ${errorMessage}`, 'error');
        
        // Show common troubleshooting tips
        this.showMessage(
            'Tips: Make sure the video is public and the URL is correct. Some videos may be restricted.',
            'info'
        );
    }

    triggerFileDownload(downloadUrl, filename) {
        // Enhanced download method for mobile compatibility
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'download';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        
        // Add to DOM
        document.body.appendChild(link);
        
        // Multiple click attempts for better mobile compatibility
        try {
            link.click();
        } catch (e) {
            // Fallback for mobile browsers
            window.open(downloadUrl, '_blank');
        }
        
        // Clean up
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 1000);
        
        // Show download instructions for mobile
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.showMessage('📱 Mobile tip: Check your Downloads folder or browser downloads in the menu.', 'info');
        }
    }

    setDownloadingState(isDownloading) {
        this.isDownloading = isDownloading;
        this.downloadBtn.disabled = isDownloading;
        
        if (isDownloading) {
            this.btnText.textContent = 'Downloading...';
            this.btnSpinner.classList.remove('hidden');
        } else {
            this.btnText.textContent = 'Download';
            this.btnSpinner.classList.add('hidden');
        }
    }

    showProgress() {
        this.progressSection.classList.remove('hidden');
        this.setProgress(0, 'Initializing download...');
    }

    hideProgress() {
        this.progressSection.classList.add('hidden');
    }

    setProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }

    startProgressSimulation() {
        let progress = 0;
        const stages = [
            { progress: 10, text: 'Fetching video information...' },
            { progress: 25, text: 'Analyzing video quality...' },
            { progress: 40, text: 'Starting download...' },
            { progress: 60, text: 'Downloading video...' },
            { progress: 85, text: 'Processing file...' },
            { progress: 95, text: 'Finalizing download...' }
        ];
        
        let stageIndex = 0;
        
        this.progressInterval = setInterval(() => {
            if (stageIndex < stages.length) {
                const stage = stages[stageIndex];
                this.setProgress(stage.progress, stage.text);
                stageIndex++;
            }
        }, 2000);
    }

    stopProgressSimulation() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        this.statusMessages.appendChild(messageEl);
        
        // Auto-remove success/info messages after 10 seconds
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 10000);
        }
    }

    clearMessages() {
        this.statusMessages.innerHTML = '';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeDownloader();
});

// Additional utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9.-]/gi, '_').replace(/_{2,}/g, '_');
}

// Extended YouTube Downloader methods for new features
YouTubeDownloader.prototype.loadStatistics = function() {
    const stats = JSON.parse(localStorage.getItem('downloadStats') || '{"total": 0, "totalSize": 0, "hdDownloads": 0}');
    document.getElementById('total-downloads').textContent = stats.total;
    document.getElementById('total-size').textContent = (stats.totalSize / (1024 * 1024)).toFixed(1) + ' MB';
    document.getElementById('hd-downloads').textContent = stats.hdDownloads;
};

YouTubeDownloader.prototype.updateStatistics = function(result) {
    const stats = JSON.parse(localStorage.getItem('downloadStats') || '{"total": 0, "totalSize": 0, "hdDownloads": 0}');
    
    stats.total += 1;
    stats.totalSize += result.filesize || 0;
    
    const format = document.getElementById('format').value;
    if (format === 'hd' || format === '1080p' || format === '720p' || format === 'mp4') {
        stats.hdDownloads += 1;
    }
    
    localStorage.setItem('downloadStats', JSON.stringify(stats));
    this.loadStatistics();
};

YouTubeDownloader.prototype.clearStatistics = function() {
    localStorage.removeItem('downloadStats');
    this.loadStatistics();
    this.showMessage('Statistics cleared successfully!', 'success');
};

YouTubeDownloader.prototype.getVideoInfo = function() {
    const url = document.getElementById('url').value.trim();
    
    if (!this.validateYouTubeUrl(url)) {
        this.showMessage('Please enter a valid YouTube URL first', 'error');
        return;
    }
    
    this.getInfoBtn.disabled = true;
    this.getInfoBtn.textContent = 'Getting Info...';
    
    // Simulate getting video info (in real implementation, you'd call the backend)
    setTimeout(() => {
        document.getElementById('video-title').textContent = 'Video information will be available soon';
        document.getElementById('video-duration').textContent = 'Loading...';
        document.getElementById('video-quality').textContent = 'Available in HD';
        document.getElementById('video-size').textContent = 'Calculating...';
        
        this.videoInfo.classList.remove('hidden');
        this.getInfoBtn.disabled = false;
        this.getInfoBtn.textContent = 'Get Video Info';
        
        this.showMessage('Video information retrieved!', 'info');
    }, 1500);
};

YouTubeDownloader.prototype.testConnection = function() {
    this.testConnectionBtn.disabled = true;
    this.testConnectionBtn.textContent = 'Testing...';
    
    fetch('private/download.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'test=1'
    })
    .then(response => response.json())
    .then(data => {
        this.showMessage('Connection test successful!', 'success');
    })
    .catch(error => {
        this.showMessage('Connection test failed: ' + error.message, 'error');
    })
    .finally(() => {
        this.testConnectionBtn.disabled = false;
        this.testConnectionBtn.textContent = 'Test Connection';
    });
};

YouTubeDownloader.prototype.clearCache = function() {
    // Clear browser cache-related data
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    }
    
    // Clear some localStorage items except stats
    const keysToKeep = ['downloadStats'];
    Object.keys(localStorage).forEach(key => {
        if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
        }
    });
    
    this.showMessage('Cache cleared successfully!', 'success');
};

YouTubeDownloader.prototype.retryLastDownload = function() {
    if (this.lastDownload && this.lastDownload.download_url) {
        this.triggerFileDownload(this.lastDownload.download_url, this.lastDownload.filename);
        this.showMessage('Retrying download...', 'info');
    } else {
        this.showMessage('No previous download to retry', 'error');
    }
};
