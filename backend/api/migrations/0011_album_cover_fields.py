from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_videojob_is_learned_difficulty_rating_last_practiced'),
    ]

    operations = [
        migrations.AddField(
            model_name='videojob',
            name='album_cover',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='conversationmessage',
            name='album_cover',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
