from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("listing/<int:listing_id>", views.listing_show, name="listing"),
    path("listing/<int:listing_id>/close", views.listing_close, name="listing_close"),
    path("listing/<int:listing_id>/bid", views.bid_new, name="bid_new"),
    path("listing/<int:listing_id>/comment", views.comment_new, name="comment_new"),
    path("listing/<int:listing_id>/watch", views.watch_listing, name="watch_listing"),
    path("listing/<int:listing_id>/unwatch", views.unwatch_listing, name="unwatch_listing"),
    path("listing/new", views.listing_new, name="listing_new"),
    path("watchlist", views.watchlist, name="watchlist"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register")
]
