from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/game/(?P<room_uid>\w+)/(?P<user_id>[\w-]+)/$", consumers.ChatConsumer.as_asgi()),
]