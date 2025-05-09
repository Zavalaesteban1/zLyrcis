# Generated by Django 5.1.6 on 2025-03-03 22:12

import api.models
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='VideoJob',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('spotify_url', models.URLField(max_length=255)),
                ('song_title', models.CharField(blank=True, max_length=255)),
                ('artist', models.CharField(blank=True, max_length=255)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('video_file', models.FileField(blank=True, null=True, upload_to=api.models.video_upload_path)),
                ('error_message', models.TextField(blank=True)),
            ],
        ),
    ]
