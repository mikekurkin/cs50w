from django import forms
from django.core.validators import MinValueValidator

from .models import Bid, Comment, Listing


class BidForm(forms.ModelForm):
    class Meta:
        model = Bid
        fields = ['amount']

    def __init__(self, bid_listing=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        amount_f = self.fields.get('amount')
        amount_w = amount_f.widget
        amount_w.attrs['autofocus'] = True
        amount_w.attrs['class'] = 'form-control form-control-lg'
        if bid_listing is not None and bid_listing.winning_bid() is not None:
            amount_f.validators.append(
                MinValueValidator(bid_listing.winning_bid().amount + 0.01,
                                  message="The bid must be higher than the current winning bid"))
            amount_w.attrs['min'] = bid_listing.winning_bid().amount + 0.01
            amount_w.attrs['value'] = int(bid_listing.winning_bid().amount) + 1
        else:
            amount_w.attrs['min'] = 0
            amount_f.validators.append(MinValueValidator(0))


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['text']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.get('text').widget.attrs['placeholder'] = 'Write a comment'
        self.fields.get('text').widget.attrs['class'] = 'form-control'
        self.fields.get('text').widget.attrs['rows'] = '2'


class ListingForm(forms.ModelForm):
    class Meta:
        model = Listing
        fields = ['title', 'st_bid_amount', 'description', 'image_url', 'category']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.get('title').widget.attrs['autofocus'] = True
        self.fields.get('st_bid_amount').widget.attrs['min'] = 0
        self.fields.get('st_bid_amount').validators.append(MinValueValidator(0))
        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            field_label = visible.label
            if not visible.field.required:
                field_label += " (Optional)"

            if visible.widget_type == 'select':
                visible.field.empty_label = field_label
            else:
                visible.field.widget.attrs['placeholder'] = field_label
