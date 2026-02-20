from django.db import migrations, connection


def convert_to_utf8mb4(apps, schema_editor):
    """
    Convert MySQL tables to utf8mb4 charset to support emojis.
    PostgreSQL already supports UTF-8 natively, so this is MySQL-only.
    """
    # Only run on MySQL databases
    if connection.vendor != 'mysql':
        print(f"Skipping utf8mb4 conversion - not needed for {connection.vendor}")
        return
    
    with connection.cursor() as cursor:
        print("Converting MySQL tables to utf8mb4...")
        
        # Drop foreign key constraint to avoid incompatibility during conversion
        cursor.execute("ALTER TABLE api_conversationmessage DROP FOREIGN KEY api_conversationmess_conversation_id_ad996a5b_fk_api_conve;")
        
        # Convert Conversation table first
        cursor.execute("ALTER TABLE api_conversation CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute("ALTER TABLE api_conversation MODIFY id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute("ALTER TABLE api_conversation MODIFY title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        
        # Convert ConversationMessage table
        cursor.execute("ALTER TABLE api_conversationmessage CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute("ALTER TABLE api_conversationmessage MODIFY conversation_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute("ALTER TABLE api_conversationmessage MODIFY content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        
        # Re-add foreign key constraint
        cursor.execute("ALTER TABLE api_conversationmessage ADD CONSTRAINT api_conversationmess_conversation_id_ad996a5b_fk_api_conve FOREIGN KEY (conversation_id) REFERENCES api_conversation(id);")
        
        # Convert VideoJob table
        cursor.execute("ALTER TABLE api_videojob CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute("ALTER TABLE api_videojob MODIFY song_title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute("ALTER TABLE api_videojob MODIFY artist VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute("ALTER TABLE api_videojob MODIFY error_message LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        
        # Convert UserProfile table
        cursor.execute("ALTER TABLE api_userprofile CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute("ALTER TABLE api_userprofile MODIFY role VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        
        # Get database name from connection settings
        db_name = connection.settings_dict['NAME']
        cursor.execute(f"ALTER DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        
        print("Successfully converted tables to utf8mb4")


def reverse_utf8mb4(apps, schema_editor):
    """Reverse the utf8mb4 conversion (not recommended)"""
    if connection.vendor != 'mysql':
        return
    
    with connection.cursor() as cursor:
        cursor.execute("ALTER TABLE api_conversationmessage DROP FOREIGN KEY api_conversationmess_conversation_id_ad996a5b_fk_api_conve;")
        cursor.execute("ALTER TABLE api_conversationmessage CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;")
        cursor.execute("ALTER TABLE api_conversation CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;")
        cursor.execute("ALTER TABLE api_videojob CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;")
        cursor.execute("ALTER TABLE api_userprofile CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;")
        cursor.execute("ALTER TABLE api_conversationmessage ADD CONSTRAINT api_conversationmess_conversation_id_ad996a5b_fk_api_conve FOREIGN KEY (conversation_id) REFERENCES api_conversation(id);")


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_conversation_conversationmessage'),
    ]

    operations = [
        migrations.RunPython(
            convert_to_utf8mb4,
            reverse_utf8mb4,
        ),
    ]
