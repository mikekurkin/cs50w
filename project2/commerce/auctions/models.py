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
    is_active = models.BooleanField(default=True)
    st_bid_amount = models.FloatField(verbose_name="Starting bid (USD)")
    time = models.DateTimeField(auto_now_add="True")
    seller = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="listings"
    )
    st_bid = models.ForeignKey(
        'Bid',
        null=True,
        default=None,
        editable=False,
        on_delete=models.SET_NULL,
        verbose_name="Starting Bid"
    )
    image_url = models.URLField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name="Image URL"
    )
    category = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="listings"
    )

    # Creates or updates starting Bid object based on amount
    def save(self,  *args, **kwargs):
        if self.st_bid is None:
            super().save(*args, **kwargs)
            bid = Bid(bid_listing=self, bidder=self.seller, amount=self.st_bid_amount)
            bid.save()
            self.st_bid = bid
        else:
            if self.st_bid.amount != self.st_bid_amount:
                self.st_bid.amount = self.st_bid_amount
            if self.st_bid.bidder != self.seller:
                self.st_bid.bidder = self.seller
            self.st_bid.save()
        super().save(*args, **kwargs)

    # Returns the Bid with highest amount
    def winning_bid(self):
        bids = self.bids.all()
        if len(bids) == 0:
            return None
        return max(bids)

    # Returns the bidder of the winning bid
    def winner(self):
        if self.is_active or self.winning_bid() is None:
            return None
        return self.winning_bid().bidder

    # Returns truncated description to use in listing cards
    def short_description(self):
        return (self.description[:197] + "...") if len(self.description) > 200 else self.description

    def __str__(self):
        s = f"{self.id}: {self.title}"

        if not self.is_active:
            s += " (Closed)"
        return s


@total_ordering
class Bid(models.Model):
    bid_listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="bids")
    bidder = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bids")
    time = models.DateTimeField(auto_now_add="True")
    amount = models.FloatField()

    # Rounds bid amount to two decimal places before saving
    def save(self, *args, **kwargs):
        self.amount = round(self.amount, 2)
        super().save(*args, **kwargs)

    # Those make bid comparison easier
    def __eq__(self, other):
        if type(other) != type(self):
            return False
        return self.bid_listing == other.bid_listing and self.amount == other.amount

    def __gt__(self, other):
        if type(other) != type(self):
            return False
        return self.bid_listing == other.bid_listing and self.amount > other.amount

    def __str__(self):
        s = f"#{self.pk}: {self.amount} for #{self.bid_listing.pk} by {self.bidder}"
        return s


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
