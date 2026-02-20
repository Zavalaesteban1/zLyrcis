from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_conversation_conversationmessage'),
    ]

    operations = [
        migrations.RunSQL(
            # Forward migration: Convert tables to utf8mb4
            sql=[
                # Drop foreign key constraint to avoid incompatibility during conversion
                "ALTER TABLE api_conversationmessage DROP FOREIGN KEY api_conversationmess_conversation_id_ad996a5b_fk_api_conve;",
                
                # Convert Conversation table first
                "ALTER TABLE api_conversation CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                "ALTER TABLE api_conversation MODIFY id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                "ALTER TABLE api_conversation MODIFY title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                
                # Convert ConversationMessage table
                "ALTER TABLE api_conversationmessage CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                "ALTER TABLE api_conversationmessage MODIFY conversation_id VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                "ALTER TABLE api_conversationmessage MODIFY content LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                
                # Re-add foreign key constraint
                "ALTER TABLE api_conversationmessage ADD CONSTRAINT api_conversationmess_conversation_id_ad996a5b_fk_api_conve FOREIGN KEY (conversation_id) REFERENCES api_conversation(id);",
                
                # Convert VideoJob table
                "ALTER TABLE api_videojob CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                "ALTER TABLE api_videojob MODIFY song_title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                "ALTER TABLE api_videojob MODIFY artist VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                "ALTER TABLE api_videojob MODIFY error_message LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                
                # Convert UserProfile table
                "ALTER TABLE api_userprofile CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                "ALTER TABLE api_userprofile MODIFY role VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                
                # Convert database default charset
                "ALTER DATABASE zLyrics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
            ],
            # Reverse migration: Convert back to utf8 (not recommended, but included for completeness)
            reverse_sql=[
                "ALTER TABLE api_conversationmessage DROP FOREIGN KEY api_conversationmess_conversation_id_ad996a5b_fk_api_conve;",
                "ALTER TABLE api_conversationmessage CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;",
                "ALTER TABLE api_conversation CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;",
                "ALTER TABLE api_videojob CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;",
                "ALTER TABLE api_userprofile CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;",
                "ALTER TABLE api_conversationmessage ADD CONSTRAINT api_conversationmess_conversation_id_ad996a5b_fk_api_conve FOREIGN KEY (conversation_id) REFERENCES api_conversation(id);",
            ],
        ),
    ]
