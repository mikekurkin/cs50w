from django.contrib import admin

from .models import FollowRelationship, Like, Post, User


class LikeInline(admin.StackedInline):
    model = Like
    extra = 1
    classes = ['collapse']


class FollowInline(admin.StackedInline):
    model = FollowRelationship
    extra = 1
    fk_name = "follower"
    classes = ['collapse']


class UserAdmin(admin.ModelAdmin):
    inlines = (LikeInline, FollowInline)

    fields = ('username', ('is_staff', 'is_superuser', 'is_active'),
              ('date_joined', 'last_login'))

    list_display = ('id', 'username', 'posts_count', 'followers_count',
                    'following_count', 'date_joined', 'last_login')

    def posts_count(self, obj):
        return obj.posts.count()

    def followers_count(self, obj):
        return obj.followers.count()

    def following_count(self, obj):
        return obj.following.count()


class PostAdmin(admin.ModelAdmin):
    inlines = (LikeInline,)

    list_display = ('id', 'author', 'contents', 'timestamp', 'likes_count')

    def likes_count(self, obj):
        return obj.likes.count()


# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)
# admin.site.register(FollowRelationship)
# admin.site.register(Like)
