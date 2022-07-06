
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("api/posts/p/<int:n>/", views.api_posts_page, name="api_posts_page"),
    path("api/posts/following/p/<int:n>/", views.api_following_posts_page, name="api_following_posts_page"),
    path("api/user/<int:user_id>/", views.api_user, name="api_user"),
    path("api/user/<int:user_id>/posts/p/<int:n>/", views.api_user_posts_page, name="api_user_posts_page"),
    path("api/posts/<int:post_id>/", views.api_post_get, name="api_post_get"),
    path("api/posts/<int:post_id>/likes/", views.api_post_likes, name="api_post_likes"),
    path("api/posts/<int:post_id>/edit/", views.api_post_edit, name="api_post_edit"),
    path("api/posts/new/", views.api_post_new, name="api_post_new"),
    path("api/posts/<int:post_id>/like/", views.api_post_like, name="api_post_like"),
    path("api/posts/<int:post_id>/unlike/", views.api_post_unlike, name="api_post_unlike"),
    path("api/user/<int:user_id>/follow/", views.api_user_follow, name="api_user_follow"),
    path("api/user/<int:user_id>/unfollow/", views.api_user_unfollow, name="api_user_unfollow"),
]
