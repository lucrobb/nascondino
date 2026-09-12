from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as http_status
from .serializers import LobbySerializer
from .models import Lobby
import random
import string

def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase, k=8))

@api_view(["POST"])
def create_lobby(request):

    """
    For when the Lobby builder allows customization:

    serializer = LobbySerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": "Richiesta fallita"}, status=http_status.HTTP_400_BAD_REQUEST)
    
    lobby = serializer.save()
    """
    #Hardcoded map response

    DEFAULT_SPAWN = {"x": 0, "y": 1, "z": 0}

    DEFAULT_OBSTACLES = [
        # Central wall cluster
        {"position": {"x": 5, "y": 1, "z": 0}, "width": 1, "height": 2, "depth": 6,
        "blocksVision": True, "blocksMovement": True},
        {"position": {"x": -5, "y": 1, "z": 0}, "width": 1, "height": 2, "depth": 6,
        "blocksVision": True, "blocksMovement": True},

        # Scattered cover
        {"position": {"x": 8, "y": 0.75, "z": 8}, "width": 2, "height": 1.5, "depth": 2,
        "blocksVision": True, "blocksMovement": True},
        {"position": {"x": -8, "y": 0.75, "z": -8}, "width": 2, "height": 1.5, "depth": 2,
        "blocksVision": True, "blocksMovement": True},
        {"position": {"x": -8, "y": 0.75, "z": 8}, "width": 2, "height": 1.5, "depth": 2,
        "blocksVision": True, "blocksMovement": True},
        {"position": {"x": 8, "y": 0.75, "z": -8}, "width": 2, "height": 1.5, "depth": 2,
        "blocksVision": True, "blocksMovement": True},

        # Low barriers — block movement, not vision (can see over/through, can't walk through)
        {"position": {"x": 0, "y": 0.3, "z": 12}, "width": 6, "height": 0.6, "depth": 0.5,
        "blocksVision": False, "blocksMovement": True},
        {"position": {"x": 0, "y": 0.3, "z": -12}, "width": 6, "height": 0.6, "depth": 0.5,
        "blocksVision": False, "blocksMovement": True},

        # Tall thin pillars — good hiding spots
        {"position": {"x": 15, "y": 1.5, "z": 0}, "width": 1, "height": 3, "depth": 1,
        "blocksVision": True, "blocksMovement": True},
        {"position": {"x": -15, "y": 1.5, "z": 0}, "width": 1, "height": 3, "depth": 1,
        "blocksVision": True, "blocksMovement": True},
        {"position": {"x": 0, "y": 1.5, "z": 15}, "width": 1, "height": 3, "depth": 1,
        "blocksVision": True, "blocksMovement": True},
        {"position": {"x": 0, "y": 1.5, "z": -15}, "width": 1, "height": 3, "depth": 1,
        "blocksVision": True, "blocksMovement": True},

        # A maze-like corner
        {"position": {"x": 12, "y": 1, "z": 12}, "width": 4, "height": 2, "depth": 0.5,
        "blocksVision": True, "blocksMovement": True},
        {"position": {"x": 14, "y": 1, "z": 10}, "width": 0.5, "height": 2, "depth": 4,
        "blocksVision": True, "blocksMovement": True},
    ]

    lobby = Lobby.objects.create(
        obstacles=DEFAULT_OBSTACLES,
        spawn_position=DEFAULT_SPAWN
    )

    return Response(LobbySerializer(lobby).data, status=http_status.HTTP_201_CREATED)

@api_view(["GET"])
def get_lobby(request, room_code):
    try:
        lobby = Lobby.objects.get(room_code=room_code)
    except Lobby.DoesNotExist:
        return Response({"error": "Lobby non trovato"}, status=http_status.HTTP_404_NOT_FOUND)

    return Response(LobbySerializer(lobby).data, status=http_status.HTTP_200_OK)


        

        
