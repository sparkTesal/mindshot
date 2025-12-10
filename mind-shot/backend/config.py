"""
Mind Shot MVP 配置文件
"""
import os
from datetime import timedelta

# Flask 配置
SECRET_KEY = os.environ.get('SECRET_KEY', 'mind-shot-secret-key-change-in-production')
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

# 数据库配置
DATABASE_PATH = os.environ.get('DATABASE_PATH', 'mindshot.db')

# 文件上传配置
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# OpenAI 配置
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-3.5-turbo')

# CORS 配置
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
