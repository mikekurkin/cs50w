from datetime import datetime, timedelta, timezone

from django.core import paginator
from django.http import JsonResponse
from humanize import naturaldate, naturaltime

PER_PAGE = 10


def get_posts_page(posts, page, requester=None):
    """Returns dict of posts page using Django's Paginator"""
    p = paginator.Paginator(posts, PER_PAGE)
    res = {
        "pages": p.num_pages,
        "page": page,
    }
    try:
        res["posts"] = [post.serialize(requester=requester)
                        for post in p.page(page).object_list]
    except paginator.EmptyPage as e:
        res["error"] = str(e)

    return res


def api_login_required(func):
    """Decorator for API handlers that checks that the user is logged in, returning error if not."""
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                "error": "Must be authenticated."
            }, status=403)

        return func(request, *args, **kwargs)

    return wrapper


def api_method_required(method):
    """Decorator for API handlers that checks that request has requered method, returning error if not."""
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            if request.method != method:
                return JsonResponse({
                    "error": f"{method} request required."
                }, status=400)

            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def api_methods_allowed(methods):
    """Decorator for API handlers that checks that request has one of allowed methods, returning error if not."""
    def decorator(func):
        def wrapper(request, *args, **kwargs):
            if request.method not in methods:
                return JsonResponse({
                    "error": f"Only {', '.join(methods)} requests allowed."
                }, status=400)

            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def humanize_timestamp(timestamp: datetime) -> str:
    """Returns human-friendly formatted timestamp"""
    if datetime.now().date() < timestamp.date() + timedelta(days=3):
        return naturaltime(timestamp, when=datetime.now(timezone.utc))
    else:
        return naturaldate(timestamp)
