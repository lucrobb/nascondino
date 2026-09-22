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
        # ─────────────────────────
        # Central structure
        # ─────────────────────────

        {
            "position": {"x": 0, "y": 1, "z": -6},
            "width": 10,
            "height": 2,
            "depth": 1,
            "material": "concrete",
            "blocksVision": True,
            "blocksMovement": True,
        },
        {
            "position": {"x": 0, "y": 1, "z": 6},
            "width": 10,
            "height": 2,
            "depth": 1,
            "material": "brick",
            "blocksVision": True,
            "blocksMovement": True,
        },

        # ─────────────────────────
        # Side structures
        # ─────────────────────────

        {
            "position": {"x": -10, "y": 1, "z": 0},
            "width": 1,
            "height": 2,
            "depth": 8,
            "material": "concrete",
            "blocksVision": True,
            "blocksMovement": True,
        },
        {
            "position": {"x": 10, "y": 1, "z": 0},
            "width": 1,
            "height": 2,
            "depth": 8,
            "material": "stone",
            "blocksVision": True,
            "blocksMovement": True,
        },

        # ─────────────────────────
        # Interior cover
        # ─────────────────────────

        {
            "position": {"x": -5, "y": 1, "z": -1},
            "width": 2,
            "height": 2,
            "depth": 4,
            "material": "brick",
            "blocksVision": True,
            "blocksMovement": True,
        },
        {
            "position": {"x": 5, "y": 1, "z": 1},
            "width": 2,
            "height": 2,
            "depth": 4,
            "material": "concrete",
            "blocksVision": True,
            "blocksMovement": True,
        },

        # ─────────────────────────
        # Low cover
        # ─────────────────────────

        {
            "position": {"x": -4, "y": 0.5, "z": 7},
            "width": 3,
            "height": 1,
            "depth": 1,
            "material": "wood",
            "blocksVision": True,
            "blocksMovement": True,
        },
        {
            "position": {"x": 4, "y": 0.5, "z": -7},
            "width": 3,
            "height": 1,
            "depth": 1,
            "material": "metal",
            "blocksVision": True,
            "blocksMovement": True,
        },

        # ─────────────────────────
        # Corner structures
        # ─────────────────────────

        {
            "position": {"x": -13, "y": 1, "z": -10},
            "width": 5,
            "height": 2,
            "depth": 1,
            "material": "rustedMetal",
            "blocksVision": True,
            "blocksMovement": True,
        },
        {
            "position": {"x": 13, "y": 1, "z": -10},
            "width": 5,
            "height": 2,
            "depth": 1,
            "material": "brick",
            "blocksVision": True,
            "blocksMovement": True,
        },
        {
            "position": {"x": -13, "y": 1, "z": 10},
            "width": 5,
            "height": 2,
            "depth": 1,
            "material": "stone",
            "blocksVision": True,
            "blocksMovement": True,
        },
        {
            "position": {"x": 13, "y": 1, "z": 10},
            "width": 5,
            "height": 2,
            "depth": 1,
            "material": "concrete",
            "blocksVision": True,
            "blocksMovement": True,
        },
    ]

    DEFAULT_TERRAIN = [
        # Ramp up to a raised platform on the east side
        {"position": {"x": 20, "y": 1.5, "z": 0}, "rotation": {"x": 0, "y": 0, "z": -0.35},
        "width": 6, "height": 0.4, "depth": 4},
        # The platform itself, flat, at the top of the ramp
        {"position": {"x": 16, "y": 3, "z": 0}, "rotation": {"x": 0, "y": 0, "z": 0},
        "width": 6, "height": 0.4, "depth": 6},

        # A second ramp, different orientation, west side
        {"position": {"x": -20, "y": 1.5, "z": 5}, "rotation": {"x": 0.35, "y": 0, "z": 0},
        "width": 4, "height": 0.4, "depth": 6},
        {"position": {"x": -20, "y": 3, "z": 2}, "rotation": {"x": 0, "y": 0, "z": 0},
        "width": 4, "height": 0.4, "depth": 4},
    ]

    lobby = Lobby.objects.create(
        obstacles=DEFAULT_OBSTACLES,
        terrain=DEFAULT_TERRAIN,
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


        

        
