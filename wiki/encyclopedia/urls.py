from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("random", views.random, name="random"),
    path("new", views.edit, name="new"),
    path("wiki/<str:name>", views.entry, name="entry"),
    path("wiki/<str:name>/edit", views.edit, name="edit")
]
