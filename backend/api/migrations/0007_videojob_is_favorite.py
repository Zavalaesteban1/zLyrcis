# Generated migration file

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_videojob_is_favorite_only'),
    ]

    operations = [
        migrations.AddField(
            model_name='videojob',
            name='is_favorite',
            field=models.BooleanField(default=False),
        ),
    ]
