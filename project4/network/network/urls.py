
from django.urls import path

from . import api, views

urlpatterns = [
    path("", views.index, name="index"),
    path("following/", views.following, name="following"),
    path("user/<int:user_id>/", views.user_view, name="user_view"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register, name="register"),
    path("api/posts/p/<int:n>/", api.api_posts_page, name="api_posts_page"),
    path("api/posts/following/p/<int:n>/", api.api_following_posts_page, name="api_following_posts_page"),
    path("api/posts/user/<int:user_id>/p/<int:n>/", api.api_user_posts_page, name="api_user_posts_page"),
    path("api/user/<int:user_id>/", api.api_user, name="api_user"),
    path("api/posts/<int:post_id>/", api.api_post_get, name="api_post_get"),
    path("api/posts/<int:post_id>/edit/", api.api_post_edit, name="api_post_edit"),
    path("api/posts/new/", api.api_post_new, name="api_post_new"),
    path("api/posts/<int:post_id>/like/", api.api_post_like, name="api_post_like"),
    path("api/posts/<int:post_id>/unlike/", api.api_post_unlike, name="api_post_unlike"),
    path("api/user/<int:user_id>/follow/", api.api_user_follow, name="api_user_follow"),
    path("api/user/<int:user_id>/unfollow/", api.api_user_unfollow, name="api_user_unfollow"),
]
