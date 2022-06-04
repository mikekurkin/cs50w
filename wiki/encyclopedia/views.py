from django import forms
from django.shortcuts import render, redirect
from django.urls import reverse

from random import choice

import re

from . import util


class EntryForm(forms.Form):
    form_name = forms.CharField(label="", max_length=80, widget=forms.TextInput(attrs={'placeholder': "Title"}))
    contents = forms.CharField(label="", widget=forms.Textarea(attrs={'placeholder': "Contents"}))


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


def render_error(request, status=500, text=None):
    # content = str(status) if text is None else str(status) + ": " + text
    return render(request, "encyclopedia/error.html", {
        "status": status,
        "text": text
    }, status=status)


def edit(request, name=None):
    new_entry = name is None

    if request.method == 'POST':
        form = EntryForm(request.POST)

        if not form.is_valid():
            return render(request, "encyclopedia/edit.html", {
                "name": name,
                "form": form
            })
            
        form_name = form.cleaned_data['form_name']
        contents = form.cleaned_data['contents']

        if new_entry and (fname := util.get_formatted_name(form_name)):
            return render_error(request, 409, f'Entry "{fname}" already exists')

        util.save_entry(form_name, contents)
        return redirect(reverse("entry", args=[form_name]))

    data = None
    if not new_entry:
        contents = util.get_entry(name)
        data = {'form_name': name, 'contents': contents}

    form = EntryForm(data)

    if not new_entry:
        form.fields['form_name'].widget.attrs['readonly'] = True

    return render(request, "encyclopedia/edit.html", {
        "name": name,
        "form": form
    }
    )


def entry(request, name):
    fname = util.get_formatted_name(name)
    if fname is None:
        return render_error(request, 404, f'Entry "{name}" not found')

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
