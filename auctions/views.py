from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.utils.http import urlencode

from .models import User, Listing, Category, Bid, Comment
from .forms import BidForm, ListingForm


def index(request):
    active_listings = Listing.objects.filter(is_active=True)
    return render(request, "auctions/index.html", {
        "listings": active_listings
    })


def error_404(request, exception):
    return render(request, "auctions/error.html", {
        "status": 404,
        "text": f"{request.path} not found"
    }, status=404)


def categories(request):
    categories = Category.objects.all()
    return render(request, "auctions/categories.html", {
        "categories": categories
    })


def category(request, category_id):
    category = get_object_or_404(Category, pk=category_id)
    category_listings = category.listings.all()
    return render(request, "auctions/category.html", {
        "category_name": category.name,
        "listings": category_listings
    })


def redirect_with_msg(m, *args, **kwargs):
    rev = reverse(*args, **kwargs)
    ret = rev + "?" + urlencode({'m': m})
    return HttpResponseRedirect(ret)


@login_required
def watch_listing(request, listing_id, set=True):
    listing = get_object_or_404(Listing, pk=listing_id)
    user = request.user
    if set:
        user.watchlist.add(listing)
    else:
        if listing in user.watchlist.all():
            user.watchlist.remove(listing)
    user.save()
    return HttpResponseRedirect(reverse("listing", args=(listing_id,)))


@login_required
def unwatch_listing(request, listing_id):
    return watch_listing(request=request, listing_id=listing_id, set=False)


@login_required
def watchlist(request):
    list = request.user.watchlist.all()
    return render(request, "auctions/watchlist.html", {
        "listings": list
    })


def listing_show(request, listing_id, message=None):
    listing = get_object_or_404(Listing, pk=listing_id)
    m = request.GET.get("m")
    if m is not None:
        message = m
    return render(request, "auctions/listing.html", {
        "listing": listing,
        "message": message,
        "bid_form": BidForm(bid_listing=listing),
    })


@login_required
def listing_close(request, listing_id):
    if request.method == "POST":
        listing = get_object_or_404(Listing, pk=listing_id)
        print(listing.seller, request.user)
        if listing.seller == request.user:
            listing.is_active = False
            listing.save()

    return HttpResponseRedirect(reverse("listing", args=(listing_id,)))


@login_required
def listing_new(request):
    if request.method == "POST":
        form = ListingForm(request.POST)
        if not form.is_valid():
            return render(request, "auctions/listing_new.html", {
                "form": form,
            })
        f = form.cleaned_data

        title = f.get('title')
        description = f.get('description')
        st_bid_amount = f.get('st_bid_amount')
        image_url = f.get('image_url')
        category = f.get('category')

        listing = Listing(
            title=title,
            description=description,
            st_bid_amount=st_bid_amount,
            image_url=image_url,
            category=category,
            seller=request.user,
            is_active=True
            )
        listing.save()

        return HttpResponseRedirect(reverse("listing", args=(listing.pk,)))

    form = ListingForm()
    return render(request, "auctions/listing_new.html", {
        "form": form,
    })


@login_required
def bid_new(request, listing_id):
    if request.method == "POST":
        listing = get_object_or_404(Listing, pk=listing_id)
        if not listing.is_active:
            return HttpResponseRedirect(reverse("listing", args=(listing_id, )))

        bidder = request.user

        form = BidForm(listing, request.POST)
        if not form.is_valid():
            return render(request, "auctions/listing.html", {
                "listing": listing,
                "bid_form": form,
            })
        amount = form.cleaned_data.get('amount')

        new_bid = Bid(bid_listing=listing, bidder=bidder, amount=amount)
        new_bid.save()

    return HttpResponseRedirect(reverse("listing", args=(listing_id,)))


@login_required
def comment_new(request, listing_id):
    if request.method == "POST":
        listing = get_object_or_404(Listing, pk=listing_id)

        author = request.user
        text = request.POST.get("comment_text")

        if text is None or text == "":
            return redirect_with_msg("Please fill in your comment", "listing", args=(listing_id, ))

        new_comment = Comment(comment_listing=listing, author=author, text=text)
        new_comment.save()

    return HttpResponseRedirect(reverse("listing", args=(listing_id,)))


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
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


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
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")
