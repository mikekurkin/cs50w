from django.contrib.auth.models import AbstractUser
from django.db import models

from .utils import humanize_timestamp


class User(AbstractUser):
    followers = models.ManyToManyField(
        "User",
        through="FollowRelationship",
        through_fields=("follows", "follower"),
        related_name="following")

    def serialize(self, verbose=False, requester=None):
        res = {
            "user_id": self.pk,
            "username": self.username,
        }
        if verbose:
            res.update({
                "last_login": humanize_timestamp(self.last_login),
                "posts_count": self.posts.count(),
                "followers_count": self.followers.count(),
                "following_count": self.following.count(),
            })
        if requester is not None:
            res["is_following"] = \
                None if not requester.is_authenticated or requester == self \
                else True if requester in self.followers.all() \
                else False

        return res


class Post(models.Model):
    author = models.ForeignKey("User", on_delete=models.PROTECT, related_name="posts")
    contents = models.TextField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)
    liked_by = models.ManyToManyField(
        "User",
        through="Like",
        related_name="liked_posts",
        editable=True)

    def serialize(self, requester=None):
        res = {
            "post_id": self.pk,
            "author": self.author.serialize(),
            "contents": self.contents,
            "timestamp": humanize_timestamp(self.timestamp),
            "likes_count": self.liked_by.distinct().count(),
        }
        if requester is not None:
            res["can_edit"] = \
                True if requester == self.author and requester.is_authenticated \
                else False
            res["is_liked"] = \
                None if not requester.is_authenticated \
                else True if requester in self.liked_by.all() \
                else False
        return res

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
