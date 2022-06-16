# Generated by Django 4.0.5 on 2022-06-15 20:15
# flake8: noqa

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0009_listing_st_bid_amount'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bid',
            name='amount',
            field=models.FloatField(validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name='listing',
            name='image_url',
            field=models.URLField(blank=True, null=True, verbose_name='Image URL'),
        ),
        migrations.AlterField(
            model_name='listing',
            name='st_bid',
            field=models.ForeignKey(default=None, editable=False, null=True, on_delete=django.db.models.deletion.CASCADE, to='auctions.bid', verbose_name='Starting Bid'),
        ),
        migrations.AlterField(
            model_name='listing',
            name='st_bid_amount',
            field=models.FloatField(verbose_name='Starting bid (USD)'),
        ),
    ]
