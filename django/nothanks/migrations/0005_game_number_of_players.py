# Generated by Django 4.1.2 on 2023-01-31 07:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nothanks', '0004_player_date_created'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='number_of_players',
            field=models.IntegerField(default=0),
        ),
    ]
