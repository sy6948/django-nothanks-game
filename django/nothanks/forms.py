from django import forms
from django.forms import ModelForm, TextInput
from .models import Player

class PlayerUpdateForm(ModelForm):
    class Meta:
        model = Player
        # exclude = ["token", "date_created"]
        fields = ["username"]
        widgets = {
            'username': TextInput(attrs={
                'class': "form-control",
                'placeholder': 'Name'
            })
        }
        labels = {
            'username': '',
        }