import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core import paginator
from django.core.serializers import serialize
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse

from .models import User, Post


PER_PAGE = 10


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
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


def get_posts_page(posts, page):
    p = paginator.Paginator(posts, PER_PAGE)
    try:
        return {
            "pages": p.num_pages,
            "posts": serialize('json', p.page(page).object_list),
        }
    except paginator.EmptyPage as e:
        return {
            "pages": p.num_pages,
            "error": str(e),
        }


def api_posts_page(request, n=1):
    if request.method != "GET":
        return JsonResponse({
            "error": "GET request required."
        }, status=400)

    page = get_posts_page(Post.objects.all(), n)

    return JsonResponse(page, status=(404 if page.get('error') else 200))


def api_following_posts_page(request, n=1):
    if request.method != "GET":
        return JsonResponse({
            "error": "GET request required."
        }, status=400)

    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Must be authenticated."
        }, status=403)

    page = get_posts_page(Post.objects.filter(author__in=request.user.following.all()), n)

    return JsonResponse(page, status=(404 if page.get('error') else 200))


def api_user(request, user_id):
    if request.method != "GET":
        return JsonResponse({
            "error": "GET request required."
        }, status=400)

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    user_info = serialize('json', [user],
                          fields=('username', 'last_login', 'first_name', 'last_name', 'date_joined'))

    return HttpResponse(user_info)


def api_user_posts_page(request, user_id, n):
    if request.method != "GET":
        return JsonResponse({
            "error": "GET request required."
        }, status=400)

    page = get_posts_page(Post.objects.filter(author__pk=user_id), n)

    return JsonResponse(page, status=(404 if page.get('error') else 200))


def api_post_get(request, post_id):
    if request.method != "GET":
        return JsonResponse({
            "error": "GET request required."
        }, status=400)

    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    post_info = serialize('json', [post])

    return HttpResponse(post_info)


def api_post_likes(request, post_id):
    if request.method != "GET":
        return JsonResponse({
            "error": "GET request required."
        }, status=400)

    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    post_likes = {'post_id': post.id,
                  'likes_count': post.likes.count()}

    return JsonResponse(post_likes)


def api_post_edit(request, post_id):
    if request.method != "PUT":
        return JsonResponse({
            "error": "PUT request required."
        }, status=400)

    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Must be authenticated."
        }, status=403)

    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    if request.user != post.author:
        return JsonResponse({
            "error": "You are not the author."
        }, status=403)

    contents = json.loads(request.body).get("contents")

    if contents is None:
        return JsonResponse({
            "error": "No contents provided."
        }, status=400)

    post.contents = contents
    post.save()

    post_info = serialize('json', [post])

    return HttpResponse(post_info)


def api_post_new(request):
    if request.method != "POST":
        return JsonResponse({
            "error": "POST request required."
        }, status=400)

    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Must be authenticated."
        }, status=403)

    contents = request.POST.get("contents")

    if contents is None:
        return JsonResponse({
            "error": "No contents provided."
        }, status=400)

    post = Post(author=request.user, contents=contents)
    post.save()

    post_info = serialize('json', [post])

    return HttpResponse(post_info)


def api_post_like(request, post_id):
    if request.method != "POST":
        return JsonResponse({
            "error": "POST request required."
        }, status=400)

    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Must be authenticated."
        }, status=403)

    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    post.liked_by.add(request.user)
    post.save()

    post_likes = {'post_id': post.id,
                  'likes_count': post.likes.count()}

    return JsonResponse(post_likes)


def api_post_unlike(request, post_id):
    if request.method != "POST":
        return JsonResponse({
            "error": "POST request required."
        }, status=400)

    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Must be authenticated."
        }, status=403)

    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    post.liked_by.remove(request.user)
    post.save()

    post_likes = {'post_id': post.id,
                  'likes_count': post.likes.count()}

    return JsonResponse(post_likes)


def api_user_follow(request, user_id):
    if request.method != "POST":
        return JsonResponse({
            "error": "POST request required."
        }, status=400)

    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Must be authenticated."
        }, status=403)

    try:
        user = Post.objects.get(pk=user_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    user.followers.add(request.user)
    user.save()

    user_info = serialize('json', [user],
                          fields=('username', 'last_login', 'first_name', 'last_name', 'date_joined'))

    return HttpResponse(user_info)


def api_user_unfollow(request, user_id):
    if request.method != "POST":
        return JsonResponse({
            "error": "POST request required."
        }, status=400)

    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Must be authenticated."
        }, status=403)

    try:
        user = Post.objects.get(pk=user_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    user.followers.remove(request.user)
    user.save()

    user_info = serialize('json', [user],
                          fields=('username', 'last_login', 'first_name', 'last_name', 'date_joined'))

    return HttpResponse(user_info)
