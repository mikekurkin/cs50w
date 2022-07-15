
from django.urls import path

from . import api, views

urlpatterns = [
    path("", views.index, name="index"),
    path("feed", views.following, name="following"),
    path("user/<int:user_id>", views.user_view, name="user_view"),
    path("u/<str:username>", views.username_view, name="username_view"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("api/posts", api.api_posts, name="api_posts_page"),
    path("api/posts/<int:post_id>", api.api_post, name="api_post"),
    path("api/posts/<int:post_id>/like", api.api_like, name="api_set_liked"),
    path("api/users/<int:user_id>", api.api_user_read, name="api_user"),
    path("api/users/<int:user_id>/follow",
         api.api_follow, name="api_set_following"),
]
