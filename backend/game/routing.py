from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/lobby/(?P<room_code>\w+)/(?P<player_id>[^/]+)/$", consumers.LobbyConsumer.as_asgi()),
]