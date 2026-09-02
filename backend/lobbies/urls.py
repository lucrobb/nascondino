from django.urls import path
from . import views

urlpatterns = [
    path("lobbies/", views.create_lobby, name="create-lobby"),
    path("lobbies/<str:room_code>/", views.get_lobby, name="get-lobby"),
]