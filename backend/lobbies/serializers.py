from rest_framework import serializers
from .models import Lobby

class LobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Lobby
        fields = ["room_code", "map_data", "status", "created_at"]
        read_only_fields = ["created_at"]