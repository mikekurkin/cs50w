from django import forms
from django.http import Http404
from django.shortcuts import render, redirect
from django.urls import reverse

from random import choice

import re

from . import util


class EntryForm(forms.Form):
    form_name = forms.CharField(label="", max_length=80, widget=forms.TextInput(attrs={'placeholder': "Title"}))
    contents = forms.CharField(label="", widget=forms.Textarea(attrs={'placeholder': "Contents"}))

    name.widget.attrs['placeholder'] = "Title"


def index(request):
    entries = util.list_entries()
    query: str = request.GET.get("q")

    if query is not None:
        fquery = util.get_formatted_name(query)
        if fquery is not None:
            return redirect(reverse("entry", args=[fquery]))

        entries = filter(lambda x: query.lower() in x.lower(), entries)

    return render(request, "encyclopedia/index.html", {
        "query": query,
        "entries": entries
    })


def edit(request, name=None):

    new_entry = True if name is None else False

    data = None
    if not new_entry:
        contents = util.get_entry(name)
        data = {'name': name, 'contents': contents}

    form = EntryForm(data)
    if not new_entry:
        form.fields['name'].widget.attrs['readonly'] = True

    return render(request, "encyclopedia/edit.html", {
        "name": name,
        "form": form
    }
    )


def entry(request, name):
    fname = util.get_formatted_name(name)
    if fname is None:
        raise Http404("Page not found")

    if fname != name:
        return redirect(reverse("entry", args=[fname]))

    content = util.get_entry(name)
    if content is None:
        raise Http404("Page not found")

    content = util.md_to_html(content)

    return render(request, "encyclopedia/entry.html", {
        "entry_title": name,
        "entry_content": content
    })


def random(request):
    entries = util.list_entries()
    entry = choice(entries)

    return redirect(reverse("entry", args=[entry]))
