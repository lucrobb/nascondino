from rest_framework import serializers
from .models import Lobby

class LobbySerializer(serializers.ModelSerializer):
    #Transform into camel case for automatic serialization for API responses
    roomCode = serializers.CharField(source="room_code", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    spawnPosition = serializers.JSONField(source="spawn_position")

    class Meta:
        model = Lobby
        fields = ["obstacles", "terrain", "spawnPosition", "roomCode", "status", "createdAt"]
        read_only_fields = ["status"]