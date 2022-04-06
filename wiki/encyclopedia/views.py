# from django import forms
from django.http import Http404
from django.shortcuts import render, redirect
from django.urls import reverse

from random import choice

from . import util


def index(request):
    entries = util.list_entries()
    query: str = request.GET.get("q")

    if query is not None:
        fquery = util.format_entry_name(query)
        if fquery is not None:
            return redirect(reverse("entry", args=[fquery]))

        entries = filter(lambda x: query.lower() in x.lower(), entries)

    return render(request, "encyclopedia/index.html", {
        "query": query,
        "entries": entries
    })


def entry(request, name):
    fname = util.format_entry_name(name)
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
