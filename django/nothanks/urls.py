from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name = 'nothanks-home'),
    path('game/<room_uid>', views.gameRoom, name = 'nothanks-game-room'),
    path('join/<room_uid>', views.joinRoom, name = 'nothanks-join-room'),
]

