from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse

from .models import User


def index(request):
    return render(request, "network/index.html")


@login_required
def following(request):
    return render(request, "network/following.html")


def user_view(request, user_id):
    # Try to find user by id
    user = get_object_or_404(User, id=user_id)
    # Redirect to username-based url
    return HttpResponseRedirect(reverse(username_view, args=[user.username]))


def username_view(request, username):
    # Try to find user by username
    user = get_object_or_404(User, username__iexact=username)
    # If username was not exact (i.e. wrong capitalization), redirect to correct
    if user.username != username:
        return HttpResponseRedirect(reverse(username_view, args=[user.username]))
    return render(request, "network/user_view.html", user.serialize(requester=request.user))


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            nextPath = request.POST.get("next", reverse("index"))
            return HttpResponseRedirect(nextPath)
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
