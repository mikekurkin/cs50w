import json

from django.http import HttpRequest, JsonResponse

from .models import Post, User
from .utils import (api_login_required, api_method_required,
                    api_methods_allowed, get_posts_page)


@api_methods_allowed(["GET", "POST"])
def api_posts(request: HttpRequest) -> JsonResponse:
    match request.method:
        case "GET": return api_posts_read(request)
        case "POST": return api_post_create(request)


@api_method_required("GET")
def api_posts_read(request: HttpRequest) -> JsonResponse:
    """Returns page of posts in JSON format.

    GET api/posts
    GET api/posts?p=1
    GET api/posts?author_id=2
    GET api/posts?feed_only=true

    GET parameters:
    author_id -- if present, posts are filtered by author
    feed_only -- if not false-like, only posts by followed users are returned
    p -- page number, first page is returned if not present

    Return JSON keys:
    error -- error description, returned only if error occured
    pages -- total number of pages of posts filtered according to the query
    page -- current page number
    posts -- array of serialized posts

    Each post has following keys:
    post_id, author.user_id, author.username, author.is_following, contents,
    timestamp.humanized, timestamp.exact, likes_count, can_edit, is_liked
    """
    page_n = int(request.GET.get('p', 1))
    author_id = request.GET.get('author_id')
    feed_only = request.GET.get('feed_only')

    # Get n'th page of posts filtered by specific author
    if author_id is not None:
        page = get_posts_page(Post.objects.filter(author__id=author_id),
                              page_n, requester=request.user)

    # Get n'th page of posts filtered by authors that requester follows
    elif feed_only is not None and feed_only.lower() not in ['false', 'no', '0']:
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Must be authenticated."}, status=403)
        page = get_posts_page(Post.objects.filter(author__in=request.user.following.all()),
                              page_n, requester=request.user)

    # Get n'th page of all posts
    else:
        page = get_posts_page(Post.objects.all(),
                              page_n, requester=request.user)

    # Return result, send 404 status code if requested page does not exist
    return JsonResponse(page, status=(404 if page.get('error') else 200))


@api_method_required("POST")
@api_login_required
def api_post_create(request: HttpRequest) -> JsonResponse:
    """Creates new post and returns it in JSON fomrat.

    POST api/posts

    POST parameter:
    contents -- text contents of new post

    Return JSON keys:
    error -- error description, returned only if error occured
    post_id, author.user_id, author.username, author.is_following, contents,
    timestamp.humanized, timestamp.exact, likes_count, can_edit, is_liked
    """
    # Get contents from request
    contents = json.loads(request.body).get("contents")

    # Do not create empty posts
    if contents is None:
        return JsonResponse({"error": "No contents provided."}, status=400)

    # Save to database
    post = Post(author=request.user, contents=contents)
    post.save()

    # Return created post
    post_info = post.serialize(requester=request.user)
    return JsonResponse(post_info)


@api_method_required("GET")
def api_user_read(request: HttpRequest, user_id: int) -> JsonResponse:
    """Returns user info in JSON format.

    GET api/users/<int:user_id>

    URL parameter:
    user_id -- primary key of user in database

    Return JSON keys:
    error -- error description, returned only if error occured
    user_id -- primary key of user in database
    username -- username of user
    last_login.humanized -- humanized last login time
    last_login.exact -- formatted exact last login time
    posts_count -- number of posts authored by user
    followers_count -- number of others that follow this user
    following_count -- number of others this user follows
    is_following -- true if requester follows user, false if not, null if not logged in
    """
    # Try to find user by id, return 404 if not found
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist as e:
        return JsonResponse({"error": str(e)}, status=404)

    # Return user info
    user_info = user.serialize(requester=request.user)
    return JsonResponse(user_info)


@api_methods_allowed(["GET", "PUT"])
def api_post(request: HttpRequest, post_id: int):
    match request.method:
        case "GET": return api_post_read(request, post_id)
        case "PUT": return api_post_update(request, post_id)


@api_method_required("GET")
def api_post_read(request: HttpRequest, post_id: int) -> JsonResponse:
    """Returns post info in JSON format.

    GET api/posts/<int:post_id>

    URL parameter:
    post_id -- primary key of post in database

    Return JSON keys:
    error -- error description, returned only if error occured
    post_id -- primary key of post in database
    author.user_id -- primary key of user in database
    author.username -- username of user
    author.is_following -- true if requester follows user, false if not, null if not logged in
    contents -- text contents of the post
    timestamp.humanized -- humanized post creation time
    timestamp.exact -- formatted exact post creation time
    likes_count -- number of users who liked the post
    can_edit -- true if requester is logged in as author, false otherwise
    is_liked -- true if post is liked by requester, false if not, null if not logged in
    """
    # Try to find post by id, return 404 if not found
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({"error": str(e)}, status=404)

    # Return the post
    post_info = post.serialize(requester=request.user)
    return JsonResponse(post_info)


@api_method_required("PUT")
@api_login_required
def api_post_update(request: HttpRequest, post_id: int) -> JsonResponse:
    """Updates selected post content and returns updated post in JSON format.

    PUT api/posts/<int:post_id>

    URL parameter:
    post_id -- primary key of post in database

    POST parameter:
    contents -- text contents of new post

    Return JSON keys:
    error -- error description, returned only if error occured
    post_id, author.user_id, author.username, author.is_following, contents,
    timestamp.humanized, timestamp.exact, likes_count, can_edit, is_liked
    """
    # Try to find post by id, return 404 if not found
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({"error": str(e)}, status=404)

    # Check if requester is the author, return 403 if not
    if request.user != post.author:
        return JsonResponse({"error": "You are not the author."}, status=403)

    # Get new post contents from request
    contents = json.loads(request.body).get("contents")

    # Check if the contents is empty, do not save if it is
    if contents is None:
        return JsonResponse({"error": "No contents provided."}, status=400)

    # Save the post
    post.contents = contents
    post.save()

    # Return updated post
    post_info = post.serialize(requester=request.user)
    return JsonResponse(post_info)


@api_methods_allowed(["POST", "DELETE"])
@api_login_required
def api_like(request: HttpRequest, post_id: int) -> JsonResponse:
    """Creates or deletes like on a post and returns updated post in JSON format.

    POST   api/posts/<int:post_id>/like
    DELETE api/posts/<int:post_id>/like

    URL parameter:
    post_id -- primary key of post in database

    Return JSON keys:
    error -- error description, returned only if error occured
    post_id, author.user_id, author.username, author.is_following, contents,
    timestamp.humanized, timestamp.exact, likes_count, can_edit, is_liked
    """
    # Try to find post by id, return 404 if not found
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist as e:
        return JsonResponse({"error": str(e)}, status=404)

    # Add or remove like based on request method
    match request.method:
        case "POST": post.liked_by.add(request.user)
        case "DELETE": post.liked_by.remove(request.user)

    post.save()

    # Return updated post
    post_info = post.serialize(requester=request.user)
    return JsonResponse(post_info)


@api_methods_allowed(["POST", "DELETE"])
@api_login_required
def api_follow(request: HttpRequest, user_id: int) -> JsonResponse:
    """Follows or unfollows user and returns updated user info in JSON format.

    POST   api/users/<int:user_id>/follow
    DELETE api/users/<int:user_id>/follow

    URL parameter:
    error -- error description, returned only if error occured
    user_id, username, last_login.humanized, last_login.exact,
    posts_count, followers_count, following_count, is_following
    """
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
