from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Listing, Category, Bid


def index(request):
    active_listings = Listing.objects.filter(is_active=True)
    return render(request, "auctions/index.html", {
        "listings": active_listings
    })


def listing_show(request, listing_id, message=None):
    listing = Listing.objects.get(pk=listing_id)
    return render(request, "auctions/listing.html", {
        "listing": listing,
        "message": message
    })


@login_required
def listing_new(request):
    if request.method == "POST":
        title = request.POST.get("title")
        description = request.POST.get("description")
        st_bid_amount = float(request.POST.get("st_bid"))
        image_url = request.POST.get("image_url")
        if image_url == "":
            image_url = None
        category = request.POST.get("category")
        if category is not None:
            category = int(category)
        seller = request.user

        listing = Listing(title=title, description=description, image_url=image_url,
                          category=category, seller=seller, is_active=True)
        print(listing.pk)
        listing.save()
        print(listing.pk)

        st_bid = Bid(bid_listing=listing, bidder=seller, amount=st_bid_amount)
        st_bid.save()

        listing.st_bid = st_bid
        listing.save()

        return HttpResponseRedirect(reverse("listing", args=(listing.pk,)))

    listing = Listing()
    categories = Category.objects.all()
    return render(request, "auctions/listing_new.html", {
        "listing": listing,
        "categories": categories
    })


@login_required
def bid_new(request, listing_id):
    if request.method == "POST":
        listing = Listing.objects.get(pk=listing_id)

        bidder = request.user
        amount = request.POST.get("bid_amount")
        try:
            amount = round(float(amount), 2)
        except ValueError:
            amount = None
        if amount is None or amount <= 0:
            return HttpResponseRedirect(reverse("listing", args=(listing_id, )))
        if listing.winning_bid() is not None and amount < listing.winning_bid().amount + 0.01:
            return HttpResponseRedirect(reverse("listing", args=(listing_id, )))

        new_bid = Bid(bid_listing=listing, bidder=bidder, amount=amount)
        new_bid.save()
        print(new_bid)

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
