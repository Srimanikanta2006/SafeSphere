import os

class Config:
    # Model Paths
    YAMNET_MODEL_URL = "https://tfhub.dev/google/yamnet/1"
    YOLO_MODEL_PATH = "yolov8n.pt" # Auto-downloads to models/ if not present
    
    # Thresholds
    AUDIO_CONFIDENCE_THRESHOLD = 0.4
    FIRE_CONFIDENCE_THRESHOLD = 0.5
    JERK_THRESHOLD = 15.0
    ACCELERATION_THRESHOLD = 25.0
    
    # Event Cooldowns (seconds)
    EVENT_COOLDOWN = 10
    
    # Severity Point System
    POINTS_SCREAM = 30
    POINTS_REPEATED_SCREAM = 20
    POINTS_MOTION_SPIKE = 20
    POINTS_CRASH = 20
    POINTS_FIRE = 50
    POINTS_SMOKE = 30
    POINTS_DISTRESS_KEYWORD = 40
    POINTS_GLASS_BREAK = 30
    POINTS_INACTIVITY = 40
    
    # Buffers
    AUDIO_BUFFER_SIZE = 1 # Second
    MOTION_BUFFER_SIZE = 50 # Samples

config = Config()
