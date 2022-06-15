from django import forms

from .models import Listing


class ListingForm(forms.ModelForm):
    class Meta:
        model = Listing
        fields = ['title', 'st_bid_amount', 'description', 'image_url', 'category']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.get('title').widget.attrs['autofocus'] = True
        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            field_label = visible.label
            if not visible.field.required:
                field_label += " (Optional)"

            if visible.widget_type == 'select':
                visible.field.empty_label = field_label
            else:
                visible.field.widget.attrs['placeholder'] = field_label
