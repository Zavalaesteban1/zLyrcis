from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_album_cover_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='profile_picture',
            field=models.ImageField(blank=True, default=None, null=True, upload_to='profile_pictures/'),
        ),
    ]
