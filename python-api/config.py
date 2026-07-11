import os

class Settings:
    API_TITLE = "SSDK Tools Hub API"
    API_VERSION = "v1"
    
    # Environment configs
    ENV = os.getenv("ENV", "development")
    
    # Security CORS
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://ssdk-tools-hub.vercel.app",
        "https://ssdk-tools-hub.com"
    ]
    
    # Temporary Files Management
    TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_outputs")
    MAX_FILE_SIZE_MB = 15

settings = Settings()

# Ensure temp directory exists
os.makedirs(settings.TEMP_DIR, exist_ok=True)
