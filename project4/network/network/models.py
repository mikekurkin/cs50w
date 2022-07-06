from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    followers = models.ManyToManyField(
        "User",
        through="FollowRelationship",
        through_fields=("follows", "follower"),
        related_name="following")


class Post(models.Model):
    author = models.ForeignKey("User", on_delete=models.PROTECT, related_name="posts")
    contents = models.TextField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)
    liked_by = models.ManyToManyField(
        "User",
        through="Like",
        related_name="liked_posts",
        editable=True)

    class Meta:
        ordering = ['-timestamp']


class FollowRelationship(models.Model):
    follower = models.ForeignKey("User", on_delete=models.CASCADE, related_name="following_relationships")
    follows = models.ForeignKey("User", on_delete=models.CASCADE, related_name="follows_relationships")
    timestamp = models.DateTimeField(auto_now_add=True)


class Like(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="likes")
    posts = models.ForeignKey("Post", on_delete=models.CASCADE, related_name="likes")
    timestamp = models.DateTimeField(auto_now_add=True)
