from django.contrib.auth.models import AbstractUser
from django.db import models

from .utils import humanize_timestamp


class User(AbstractUser):
    followers = models.ManyToManyField(
        "User",
        through="FollowRelationship",
        through_fields=("follows", "follower"),
        related_name="following")

    def serialize(self, short=False, requester=None):
        """Returns serialized user info"""
        res = {
            "user_id": self.pk,
            "username": self.username,
        }
        if not short:
            res.update({
                "last_login": {
                    "humanized": humanize_timestamp(self.last_login),
                    "exact": self.last_login.strftime("%d %b %Y, %H:%M"),
                },
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
    author = models.ForeignKey(
        "User", on_delete=models.PROTECT, related_name="posts")
    contents = models.TextField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)
    liked_by = models.ManyToManyField(
        "User",
        through="Like",
        related_name="liked_posts",
        editable=True)

    def __str__(self):
        return(f'Post #{self.id} by {self.author.username}')

    def serialize(self, requester=None):
        """returns serialized post info"""
        res = {
            "post_id": self.pk,
            "author": self.author.serialize(short=True),
            "contents": self.contents,
            "timestamp": {
                "humanized": humanize_timestamp(self.timestamp),
                "exact": self.timestamp.strftime("%d %b %Y, %H:%M"),
            },
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
        # Reverse chronological order
        ordering = ['-timestamp']


class FollowRelationship(models.Model):
    follower = models.ForeignKey(
        "User", on_delete=models.CASCADE, related_name="following_relationships")
    follows = models.ForeignKey(
        "User", on_delete=models.CASCADE, related_name="follows_relationships")
    timestamp = models.DateTimeField(auto_now_add=True)


class Like(models.Model):
    user = models.ForeignKey(
        "User", on_delete=models.CASCADE, related_name="likes")
    posts = models.ForeignKey(
        "Post", on_delete=models.CASCADE, related_name="likes")
    timestamp = models.DateTimeField(auto_now_add=True)
