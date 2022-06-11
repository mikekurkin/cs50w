from django.contrib.auth.models import AbstractUser
from django.db import models
from functools import total_ordering


class User(AbstractUser):
    watchlist = models.ManyToManyField('Listing', blank=True, related_name="watchers")


class Category(models.Model):
    name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return self.name


class Listing(models.Model):
    title = models.CharField(max_length=64)
    description = models.TextField(max_length=1000)
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listings")
    is_active = models.BooleanField(default=True)
    st_bid = models.ForeignKey('Bid', null=True, default=None, on_delete=models.CASCADE, verbose_name="Starting bid")
    time = models.DateTimeField(auto_now_add="True")
    image_url = models.URLField(max_length=200, null=True, blank=True)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="listings")

    def winning_bid(self):
        bids = self.bids.all()
        if len(bids) == 0:
            return None
        return max(bids)

    def winner(self):
        if self.is_active or self.winning_bid() is None:
            return None
        return self.winning_bid().bidder

    def short_description(self):
        return (self.description[:197] + "...") if len(self.description) > 200 else self.description

    def __str__(self):
        s = f"{self.id}: {self.title} by {self.seller}"
        bids_count = len(self.bids.all())
        if bids_count == 0:
            s += ", no bids"
        elif bids_count == 1:
            s += f", starting bid {self.st_bid.amount}"
        else:
            if self.winning_bid() is not None:
                s += f", {bids_count - 1} bid{'s' if bids_count > 2 else ''}, max {self.winning_bid().amount}"

        if not self.is_active:
            s += " (Closed)"
        return s


@total_ordering
class Bid(models.Model):
    bid_listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="bids")
    bidder = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bids")
    time = models.DateTimeField(auto_now_add="True")
    amount = models.FloatField()

    def __str__(self):
        s = f"For #{self.bid_listing.pk}: {self.amount} by {self.bidder} ({self.time})"
        return s

    def __eq__(self, other):
        if type(other) != type(self):
            return False
        return self.bid_listing == other.bid_listing and self.amount == other.amount

    def __gt__(self, other):
        if type(other) != type(self):
            return False
        return self.bid_listing == other.bid_listing and self.amount > other.amount


class Comment(models.Model):
    comment_listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    time = models.DateTimeField(auto_now_add="True")
    text = models.TextField(max_length=200)

    def short_text(self):
        return (self.text[:22] + "...") if len(self.text) > 25 else self.text

    def __str__(self):
        s = f"For #{self.comment_listing.pk}: \"{self.short_text()}\" by {self.author} ({self.time})"
        return s
