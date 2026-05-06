"""
Convert Telegram session file to string for Railway deployment
Run this locally: python convert_session.py
"""
import os
from pathlib import Path
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

# Try to load from .env file
try:
    import dotenv
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        dotenv.load_dotenv(env_path)
        print(f"✓ Loaded .env from {env_path}")
except ImportError:
    print("⚠️ python-dotenv not installed, trying environment variables directly")

# Load from environment or use defaults
API_ID = os.getenv('TELEGRAM_API_ID', '')
API_HASH = os.getenv('TELEGRAM_API_HASH', '')
SESSION_FILE = 'telegram_session'  # without .session extension

if not API_ID or not API_HASH:
    print("ERROR: Set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables")
    print("Or edit this script to hardcode them temporarily")
    exit(1)

print(f"Converting session file: {SESSION_FILE}.session")
print(f"Using API_ID: {API_ID}")

# Check if session file exists
session_path = Path(f"{SESSION_FILE}.session")
if not session_path.exists():
    print(f"\nERROR: Session file not found: {session_path}")
    print(f"Looking in directory: {Path.cwd()}")
    print("\nSession files found:")
    for f in Path.cwd().glob("*.session"):
        print(f"  - {f.name}")
    exit(1)

try:
    # Create client and connect
    client = TelegramClient(SESSION_FILE, int(API_ID), API_HASH)
    client.connect()
    
    # Check if authorized
    if not client.is_user_authorized():
        print("\nERROR: Session is not authorized!")
        print("Run 'python manage.py setup_telegram' first to create an authorized session")
        client.disconnect()
        exit(1)
    
    # Get the string session
    session_string = StringSession.save(client.session)
    
    if not session_string or session_string == 'None':
        print("\nERROR: Failed to extract session string")
        print("The session might be corrupted. Try re-running setup_telegram")
        client.disconnect()
        exit(1)
    
    print("\n" + "="*80)
    print("SUCCESS! Copy this string to Railway as TELEGRAM_SESSION_STRING:")
    print("="*80)
    print(session_string)
    print("="*80)
    print(f"\nString length: {len(session_string)} characters")
    print("\nNext steps:")
    print("1. Copy the string above")
    print("2. Go to Railway → Your service → Variables")
    print("3. Add variable: TELEGRAM_SESSION_STRING = <paste string>")
    print("4. Deploy the updated code")
    
    client.disconnect()
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    print("\nMake sure:")
    print("- The telegram_session.session file exists in this directory")
    print("- TELEGRAM_API_ID and TELEGRAM_API_HASH are correct")
    print("- The session was created with the same API credentials")
