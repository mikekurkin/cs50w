from django.contrib import admin
from .models import User, Category, Listing, Bid, Comment


class BidAdmin(admin.ModelAdmin):
    list_display = ('pk', 'amount', 'bidder', 'bid_listing', 'time')
    list_filter = ('bidder', 'bid_listing',)


class CommentAdmin(admin.ModelAdmin):
    list_display = ('pk', 'short_text', 'author', 'comment_listing', 'time')
    list_filter = ('author', 'comment_listing',)


class ListingAdmin(admin.ModelAdmin):
    list_display = ('pk', 'title', 'seller', 'st_bid', 'bids_count', 'winning_bid', 'time')
    list_filter = ('seller',)

    def bids_count(self, obj):
        return obj.bids.count()



# Register your models here.
admin.site.register(User)
admin.site.register(Category)
admin.site.register(Listing, ListingAdmin)
admin.site.register(Bid, BidAdmin)
admin.site.register(Comment, CommentAdmin)
