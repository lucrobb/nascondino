from rest_framework import serializers
from .models import Lobby

class LobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Lobby
        fields = ["room_code", "status", "created_at", "obstacles"]
        read_only_fields = ["created_at"]