from django.db import models
from django.utils import timezone

class Game(models.Model):
    room_uid = models.CharField(max_length = 4, unique = True)
    # status = "start", "ongoing", "complete"
    status = models.CharField(max_length = 10)
    date_created = models.DateTimeField(default = timezone.now)
    game_data = models.TextField()
    # number of players in the game room
    number_of_players = models.IntegerField(default = 0)

    def __str__(self):
        return "Room " + self.room_uid + " is " + self.status
    
class Player(models.Model):
    token = models.CharField(max_length = 36)
    username = models.CharField(max_length = 100)
    date_created = models.DateTimeField(default = timezone.now)

    def __str__(self):
        return self.username

class PlayerGame(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)

    def __str__(self):
        return self.player.username + " in Room (" + self.game.room_uid + ")"