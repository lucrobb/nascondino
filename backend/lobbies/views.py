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
    serializer = LobbySerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": "Richiesta fallita"}, status=http_status.HTTP_400_BAD_REQUEST)
    
    lobby = serializer.save()
    return Response(LobbySerializer(lobby).data, status=http_status.HTTP_201_CREATED)

@api_view(["GET"])
def get_lobby(request, room_code):
    try:
        lobby = Lobby.objects.get(room_code=room_code)
    except Lobby.DoesNotExist:
        return Response({"error": "Lobby non trovato"}, status=http_status.HTTP_404_NOT_FOUND)

    return Response(LobbySerializer(lobby).data, status=http_status.HTTP_200_OK)


        

        
