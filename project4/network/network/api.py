import json

from django.http import JsonResponse

from .utils import api_login_required, api_method_required, api_methods_allowed, get_posts_page
from .models import User, Post


@api_methods_allowed(["GET", "POST"])
def api_posts(request):
    match request.method:
        case "GET": return api_posts_read(request)
        case "POST": return api_post_create(request)


@api_method_required("GET")
def api_posts_read(request):
    page_n = int(request.GET.get('p', 1))
    author_id = request.GET.get('author_id')
    feed_only = request.GET.get('feed_only')

    if author_id is not None:
        page = get_posts_page(Post.objects.filter(author__id=author_id),
                              page_n, requester=request.user)

    elif feed_only is not None and feed_only.lower() not in ['false', 'no', '0']:
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Must be authenticated."}, status=403)
        page = get_posts_page(Post.objects.filter(author__in=request.user.following.all()),
                              page_n, requester=request.user)

    else:
        page = get_posts_page(Post.objects.all(),
                              page_n, requester=request.user)

    return JsonResponse(page, status=(404 if page.get('error') else 200))


@api_method_required("POST")
@api_login_required
def api_post_create(request):
    contents = json.loads(request.body).get("contents")

    if contents is None:
        return JsonResponse({"error": "No contents provided."}, status=400)

    post = Post(author=request.user, contents=contents)
    post.save()

    post_info = post.serialize(requester=request.user)

    return JsonResponse(post_info)


@api_method_required("GET")
def api_user_read(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist as e:
        return JsonResponse({"error": str(e)}, status=404)

    user_info = user.serialize(requester=request.user)

    return JsonResponse(user_info)


@api_methods_allowed(["GET", "PUT"])
def api_post(request, post_id):
    match request.method:
        case "GET": return api_post_read(request, post_id)
        case "PUT": return api_post_update(request, post_id)


@api_method_required("GET")
def api_post_read(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({"error": str(e)}, status=404)

    post_info = post.serialize(requester=request.user)

    return JsonResponse(post_info)


@api_method_required("PUT")
@api_login_required
def api_post_update(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({"error": str(e)}, status=404)

    if request.user != post.author:
        return JsonResponse({"error": "You are not the author."}, status=403)

    contents = json.loads(request.body).get("contents")

    if contents is None:
        return JsonResponse({"error": "No contents provided."}, status=400)

    post.contents = contents
    post.save()

    post_info = post.serialize(requester=request.user)

    return JsonResponse(post_info)


@api_methods_allowed(["POST", "DELETE"])
@api_login_required
def api_like(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({"error": str(e)}, status=404)

    match request.method:
        case "POST": post.liked_by.add(request.user)
        case "DELETE": post.liked_by.remove(request.user)

    post.save()

    post_info = post.serialize(requester=request.user)

    return JsonResponse(post_info)


@api_methods_allowed(["POST", "DELETE"])
@api_login_required
def api_follow(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist as e:
        return JsonResponse({"error": str(e)}, status=404)

    match request.method:
        case "POST": user.followers.add(request.user)
        case "DELETE": user.followers.remove(request.user)

    user.save()

    user_info = user.serialize(requester=request.user)

    return JsonResponse(user_info)
