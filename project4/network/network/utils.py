from django.core import paginator
from django.http import JsonResponse

from humanize import naturaldate, naturaltime
from datetime import datetime, timedelta, timezone



def get_posts_page(posts, page, requester=None):
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
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                "error": "Must be authenticated."
            }, status=403)

        return func(request, *args, **kwargs)

    return wrapper


def api_method_required(method):
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
    if datetime.now().date() < timestamp.date() + timedelta(days=3):
        return naturaltime(timestamp, when=datetime.now(timezone.utc))
    else:
        return naturaldate(timestamp)
