from django.contrib import admin
from .models import Email, User


class EmailAdmin(admin.ModelAdmin):
    list_display = ('pk', 'user', 'sender', 'subject', 'timestamp')


# Register your models here.
admin.site.register(User)
admin.site.register(Email, EmailAdmin)
