"""Django 4.2 - Development settings without authentication"""
from .com import *

# Disable authentication for API endpoints
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.BrowsableAPIRenderer',
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.CoreJSONRenderer',
    ),
}

# Disable CSRF for API endpoints
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

# Allow all hosts
ALLOWED_HOSTS = ['*']

# Debug mode
DEBUG = True

print("🔓 Authentication disabled for API endpoints")
