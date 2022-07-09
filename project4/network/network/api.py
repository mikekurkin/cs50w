import json

from django.http import JsonResponse

from .utils import api_login_required, api_method_required, get_posts_page
from .models import User, Post


@api_method_required("GET")
def api_posts_page(request, n=1):
    page = get_posts_page(Post.objects.all(), n, requester=request.user)
    return JsonResponse(page, status=(404 if page.get('error') else 200))


@api_method_required("GET")
@api_login_required
def api_following_posts_page(request, n=1):
    page = get_posts_page(Post.objects.filter(author__in=request.user.following.all()), n,  requester=request.user)

    return JsonResponse(page, status=(404 if page.get('error') else 200))


@api_method_required("GET")
def api_user(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    user_info = user.serialize(verbose=True)

    return JsonResponse(user_info)


@api_method_required("GET")
def api_user_posts_page(request, user_id, n):
    page = get_posts_page(Post.objects.filter(author__pk=user_id), n, requester=request.user)

    return JsonResponse(page, status=(404 if page.get('error') else 200))


@api_method_required("GET")
def api_post_get(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    post_info = post.serialize(requester=request.user)

    return JsonResponse(post_info)


@api_method_required("PUT")
@api_login_required
def api_post_edit(request, post_id):
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

    post_info = post.serialize(requester=request.user)

    return JsonResponse(post_info)


@api_method_required("POST")
@api_login_required
def api_post_new(request):
    contents = json.loads(request.body).get("contents")

    if contents is None:
        return JsonResponse({
            "error": "No contents provided."
        }, status=400)

    post = Post(author=request.user, contents=contents)
    post.save()

    post_info = post.serialize(requester=request.user)

    return JsonResponse(post_info)


@api_method_required("POST")
@api_login_required
def api_post_like(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    post.liked_by.add(request.user)
    post.save()

    post_info = post.serialize(requester=request.user)

    return JsonResponse(post_info)


@api_method_required("POST")
@api_login_required
def api_post_unlike(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    post.liked_by.remove(request.user)
    post.save()

    post_info = post.serialize(requester=request.user)

    return JsonResponse(post_info)


@api_method_required("POST")
@api_login_required
def api_user_follow(request, user_id):
    try:
        user = Post.objects.get(pk=user_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    user.followers.add(request.user)
    user.save()

    user_info = user.serialize(verbose=True)

    return JsonResponse(user_info)


@api_method_required("POST")
@api_login_required
def api_user_unfollow(request, user_id):
    try:
        user = Post.objects.get(pk=user_id)
    except Post.DoesNotExist as e:
        return JsonResponse({
            "error": str(e)
        }, status=404)

    user.followers.remove(request.user)
    user.save()

    user_info = user.serialize(verbose=True)

    return JsonResponse(user_info)
