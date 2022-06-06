from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Category(models.Model):
    name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return self.name


class Listing(models.Model):
    title = models.CharField(max_length=64)
    description = models.TextField(max_length=1000)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listings")
    is_active = models.BooleanField(default=True)
    st_bid = models.FloatField(verbose_name="Starting bid")
    image_url = models.URLField(max_length=200, null=True, blank=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="listings")

    def __str__(self):
        s = f"{self.id}: {self.title} by {self.creator}"
        if not self.is_active:
            s += " (Inactive)"
        return s
