"""
Django management command to set up Telegram authentication for audio downloads
"""

import asyncio
from django.core.management.base import BaseCommand
from django.conf import settings

try:
    from telethon import TelegramClient
    from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError
    from core.telegram_audio import test_telegram_setup
    TELETHON_AVAILABLE = True
except ImportError:
    TELETHON_AVAILABLE = False


class Command(BaseCommand):
    help = 'Set up Telegram authentication for audio downloads via Deezer bot'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-url',
            type=str,
            help='Optional Spotify URL to test download after setup',
        )

    def handle(self, *args, **options):
        if not TELETHON_AVAILABLE:
            self.stdout.write(self.style.ERROR(
                'Telethon not installed. Install with: pip install telethon cryptg'
            ))
            return

        self.stdout.write(self.style.WARNING('\n=== Telegram Audio Download Setup ===\n'))

        # Check configuration
        api_id = getattr(settings, 'TELEGRAM_API_ID', None)
        api_hash = getattr(settings, 'TELEGRAM_API_HASH', None)
        phone = getattr(settings, 'TELEGRAM_PHONE', None)
        bot_username = getattr(settings, 'TELEGRAM_DEEZER_BOT', '@deezload2bot')
        session_file = getattr(settings, 'TELEGRAM_SESSION_FILE', 'telegram_session')

        if not api_id or not api_hash:
            self.stdout.write(self.style.ERROR(
                'Missing TELEGRAM_API_ID and/or TELEGRAM_API_HASH in settings.'
            ))
            self.stdout.write('Get your credentials from: https://my.telegram.org/apps\n')
            return

        if not phone:
            self.stdout.write(self.style.ERROR('Missing TELEGRAM_PHONE in settings.'))
            self.stdout.write('Set your phone number in .env (format: +1234567890)\n')
            return

        self.stdout.write(f'API ID: {api_id}')
        self.stdout.write(f'Phone: {phone}')
        self.stdout.write(f'Bot: {bot_username}')
        self.stdout.write(f'Session file: {session_file}\n')

        # Run async setup
        asyncio.run(self._async_setup(api_id, api_hash, phone, session_file, options.get('test_url')))

    async def _async_setup(self, api_id, api_hash, phone, session_file, test_url):
        """Async setup process"""
        from pathlib import Path
        
        # Session file path (in backend directory)
        session_path = Path(settings.BASE_DIR) / session_file
        
        self.stdout.write(f'\nConnecting to Telegram...')
        
        client = TelegramClient(str(session_path), int(api_id), api_hash)
        
        try:
            await client.connect()
            
            # Check if already authorized
            if await client.is_user_authorized():
                self.stdout.write(self.style.SUCCESS('✓ Already authenticated!\n'))
            else:
                self.stdout.write('Not authenticated yet. Starting authentication...\n')
                
                # Send code request
                await client.send_code_request(phone)
                self.stdout.write(self.style.WARNING(
                    f'A code has been sent to {phone}'
                ))
                
                # Get code from user
                code = input('Enter the code: ').strip()
                
                try:
                    await client.sign_in(phone, code)
                    self.stdout.write(self.style.SUCCESS('✓ Authentication successful!\n'))
                except SessionPasswordNeededError:
                    self.stdout.write(self.style.WARNING(
                        'Two-step verification is enabled.'
                    ))
                    password = input('Enter your password: ').strip()
                    await client.sign_in(password=password)
                    self.stdout.write(self.style.SUCCESS('✓ Authentication successful!\n'))
                except PhoneCodeInvalidError:
                    self.stdout.write(self.style.ERROR('Invalid code. Please try again.'))
                    await client.disconnect()
                    return
            
            # Disconnect the client BEFORE testing (SQLite can only be opened by one client)
            await client.disconnect()
            self.stdout.write('Authentication complete. Disconnecting...\n')
            
            # Wait a moment for the session file to be fully released
            await asyncio.sleep(1)
            
            # Test the setup with a new client connection
            self.stdout.write('\nTesting Telegram setup...\n')
            success = await test_telegram_setup(test_url)
            
            if success:
                self.stdout.write(self.style.SUCCESS(
                    '\n✓ Setup complete! Telegram audio download is ready.\n'
                ))
                self.stdout.write(f'Session saved to: {session_path}\n')
                self.stdout.write(self.style.WARNING(
                    'IMPORTANT: Keep the .session file secure (it contains your credentials)\n'
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    '\n✗ Setup test failed. Please check the output above.\n'
                ))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\nError: {e}\n'))
            try:
                await client.disconnect()
            except:
                pass
