from django.db import models

def generate_room_code():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase, k=6))
        if not Lobby.objects.filter(room_code=code).exists():
            return code

class Lobby(models.Model):
    STATUS_CHOICES = [
        ("waiting", "Waiting"),
        ("in_progress", "In progress"),
        ("ended", "Ended"),
    ]

    room_code = models.CharField(max_length=8, unique=True, default=generate_room_code)
    map_data = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="waiting")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.room_code


