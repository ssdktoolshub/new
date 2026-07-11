import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from config import settings
import threading
import time
import os

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)

# CORS middleware mapping
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register main API router
app.include_router(api_router)

# Daemon thread logic to clean files older than 10 minutes (600 seconds)
def cleanup_temp_files():
    while True:
        try:
            now = time.time()
            if os.path.exists(settings.TEMP_DIR):
                for file_name in os.listdir(settings.TEMP_DIR):
                    file_path = os.path.join(settings.TEMP_DIR, file_name)
                    if os.path.isfile(file_path):
                        # Delete if last write time is older than 600s
                        if os.stat(file_path).st_mtime < now - 600:
                            os.remove(file_path)
                            print(f"[Cleanup Daemon] Expired temp file removed: {file_name}")
        except Exception as e:
            print(f"[Cleanup Daemon Error] {e}")
        time.sleep(300) # Sleep for 5 minutes

@app.on_event("startup")
async def startup_event():
    # Spin up background cleaner thread
    cleanup_thread = threading.Thread(target=cleanup_temp_files, daemon=True)
    cleanup_thread.start()
    print("[Server startup] Temp files cleanup daemon initialized.")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "api_title": settings.API_TITLE,
        "version": settings.API_VERSION
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
