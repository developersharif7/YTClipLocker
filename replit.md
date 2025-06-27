# YouTube Downloader - Private Tool

## Overview

This is a simple, private YouTube video downloader designed for personal use. The application allows users to download YouTube videos in HD quality (720p+) or extract audio as MP3 files. It's built as a lightweight web application using vanilla HTML, CSS, JavaScript for the frontend and PHP for the backend processing.

## System Architecture

### Frontend Architecture
- **Technology**: Vanilla HTML5, CSS3, and JavaScript (ES6+)
- **Design Pattern**: Class-based JavaScript with event-driven architecture
- **UI Components**: Single-page application with form-based interface
- **Styling**: CSS Grid/Flexbox with gradient backgrounds and modern UI elements
- **Validation**: Real-time URL validation using regex patterns

### Backend Architecture
- **Technology**: PHP (no framework)
- **Processing Engine**: yt-dlp for YouTube video extraction
- **File Management**: Temporary file system with automatic cleanup
- **API Design**: RESTful JSON endpoints with CORS support
- **Security**: Input validation, file size limits, and format restrictions

## Key Components

### 1. Frontend Components (`app.js`)
- **YouTubeDownloader Class**: Main application controller
- **Form Handler**: Manages user input and submission
- **Progress Tracker**: Real-time download progress monitoring
- **URL Validator**: YouTube URL pattern validation
- **Status Manager**: User feedback and error handling

### 2. Backend Components (`private/download.php`)
- **YouTubeDownloader Class**: Server-side download manager
- **Input Validation**: URL and format sanitization
- **File Processing**: yt-dlp integration for video/audio extraction
- **Temporary Storage**: File management with automatic cleanup
- **Response Handler**: JSON API responses with error handling

### 3. User Interface (`index.html`, `style.css`)
- **Clean Form Design**: URL input and format selection
- **Progress Visualization**: Progress bar and status messages
- **Responsive Layout**: Mobile-friendly design
- **Modern Styling**: Gradient backgrounds and smooth transitions

## Data Flow

1. **User Input**: User pastes YouTube URL and selects format (HD MP4 or MP3)
2. **Frontend Validation**: Real-time URL validation using regex patterns
3. **Form Submission**: AJAX request to PHP backend with form data
4. **Backend Processing**: 
   - Input validation and sanitization
   - yt-dlp command execution for video extraction
   - Temporary file creation and management
5. **Progress Tracking**: Real-time progress updates via polling
6. **File Delivery**: Direct download link generation
7. **Cleanup**: Automatic temporary file removal

## External Dependencies

### Required System Tools
- **yt-dlp**: Primary tool for YouTube video extraction and download
- **ffmpeg**: Optional for audio/video processing and format conversion
- **PHP**: Server-side scripting (version 7.4+ recommended)

### Browser Requirements
- Modern browsers supporting ES6+ JavaScript
- XMLHttpRequest/Fetch API support
- HTML5 form validation support

## Deployment Strategy

### Development Environment (Replit)
- **Runtime**: PHP module with stable Nix channel (24.05)
- **Server**: Built-in PHP development server on port 5000
- **Workflow**: Automated startup with parallel task execution
- **File Structure**: Organized with private backend directory

### File Organization
```
/
├── index.html          # Main application interface
├── app.js             # Frontend JavaScript logic
├── style.css          # Application styling
├── private/           # Backend PHP files
│   ├── download.php   # Main download handler
│   └── tmp/           # Temporary file storage
└── .replit            # Replit configuration
```

### Security Considerations
- Backend files in `/private/` directory for security
- Input validation on both frontend and backend
- File size limits (500MB) to prevent abuse
- Temporary file cleanup to manage storage
- CORS headers for controlled access

## Changelog

- June 27, 2025: Major mobile download improvements
  - Fixed file serving for mobile devices with proper headers
  - Enhanced download mechanism with mobile compatibility
  - Added download status display with retry functionality
  - Improved chunked file serving for large videos
  - Added mobile-specific download instructions

- June 27, 2025: Enhanced HD quality options and features
  - Added multiple quality options: 1080p, 720p, Best MP4, MP3
  - Upgraded to latest yt-dlp version (2025.06.25)
  - Fixed JSON response issues
  - Added comprehensive features section below main form
  - Implemented download statistics and quick actions

- June 26, 2025: Initial setup
  - Basic YouTube downloader with PHP backend
  - HTML/CSS frontend with progress tracking
  - yt-dlp integration for video downloads

## User Preferences

Preferred communication style: Simple, everyday language.