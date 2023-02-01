from django.db import IntegrityError, transaction
from django.contrib import messages
from django.shortcuts import render

from nothanks.models import Player, Game, PlayerGame
from .forms import PlayerUpdateForm

from datetime import datetime, timedelta

from uuid import uuid4
import random, json

# generate a unique player object with unique access token
def generateToken():
    token = str(uuid4())
    player = Player(username = "Guest", token = token)
    player.save()
    return player

# return a player object by access token
# if access token does not exist, return a new player object
def getUserInfo(request):
    if request.session.get('token', False):
        token = request.session["token"]
        player = Player.objects.filter(token = token).first()
        if player != None: return player
    
    player = generateToken()
    request.session["token"] = player.token
    return player

# generate random room id with n length, using A-Z only
def randomRoomID(n):
    if n == 0: return ""
    value = random.randint(0, 26 ** n - 1)
    temp = []
    for _ in range(n):
        temp.append(chr(65 + (value % 26)))
        value = value // 26
    return "".join(temp)

# update player display name
def updateUserName(request, player):
    player_form = PlayerUpdateForm(request.POST, instance = player)
    if player_form.is_valid():
        player_form.save()
        messages.success(request, f'Username updated.')
    else:
        messages.warning(request, f'Length of username must be smaller than 100.')
    
    return player_form

# create a game room with unique room_uid
def createGameRoom():
    data = json.dumps({})
    status = 'start'
    retry, max_retry = 0, 5

    room_uid = randomRoomID(4)
    while retry < max_retry:
        try:
            # check if room_uid exist
            game = Game(room_uid = room_uid, status = status, game_data = data)
            game.save()
            return game
        except IntegrityError as e:
            # delete all room with complete status
            Game.objects.filter(status = "complete").delete()

            # filter old game
            time_threshold = datetime.now() - timedelta(hours=24)
            Game.objects.filter(date_created = time_threshold).delete()

            retry += 1
            room_uid = randomRoomID(4)
            continue
    
    return None

# add a player to the game room
def joinGameRoom(game, player):
    max_num_of_players = 5

    with transaction.atomic():
        # lock the row for game data
        Game.objects.select_for_update().filter(room_uid = game.room_uid).first()

        # if already join, nothing to do
        result = PlayerGame.objects.filter(player = player, game = game)
        if len(result) > 0: return True

        # check if room is full
        if game.number_of_players >= max_num_of_players: return False

        # user join game room
        pg = PlayerGame(game = game, player = player)

        # update the game data to increase the number of players
        game.number_of_players += 1

        # commit
        pg.save()
        game.save()

    return True

# return the game data of the game room
def getGameRoomInfo(room_uid):
    game = Game.objects.filter(room_uid = room_uid).first()
    if game:
        player_game_set = PlayerGame.objects.filter(game = game)
        user_list = [{"user_token": pg.player.token, "username": pg.player.username} for pg in player_game_set]
        data = {
            "room_uid": game.room_uid,
            "status": game.status,
            "game_data": json.loads(game.game_data),
            "user_list": user_list,
        }
    else:
        data = {"error": f"Room ({room_uid}) does not exists."}

    return data

# query the game table by room_uid, lock the row
def getGameRoom(room_uid):
    return Game.objects.select_for_update().filter(room_uid = room_uid).first()

# update the game data json
def updateGameLogs(game_data, logs):
    game_data["last_logs"] = []
    for log in logs:
        game_data["game_logs"].append(log)
        game_data["last_logs"].append(log)

def initGameRoom(room_uid):
    with transaction.atomic():
        game = Game.objects.select_for_update().filter(room_uid = room_uid).first()
        if not game or game.status == 'ongoing' or game.status == 'complete': return False
        # update game status
        game.status = 'ongoing'

        # update the game_data
        # generate deck
        decks = generateDeck()
        first_card = decks.pop()

        pg_list = PlayerGame.objects.filter(game = game)
        players = generatePlayers(pg_list)
        random.shuffle(players)

        # remove
        game_data = {
            "decks": decks,
            "public": {
                "coins": 0,
                "card": first_card,
            },
            "players": players,
            "num_of_players": len(players),
            "current_player": 0,
            "game_logs": [],
            "last_logs": []
        }
        logs = [
            {"action": "start_game", "message": "Game Start!"},
            {"action": "flip_card", "message": "First Card is " + str(first_card)}
        ]
        updateGameLogs(game_data, logs)

        game.game_data = json.dumps(game_data)
        game.save()

    return True

# setup the decks for game initialization
def generateDeck():
    min_card = 3
    max_card = 35
    num_remove = 9

    decks = list(range(min_card, max_card + 1))
    random.shuffle(decks)
    # remove top cards
    for _ in range(num_remove):
        decks.pop()
    return decks

# setup the player information for the game initialization
def generatePlayers(pg_list):
    result = []
    for i, pg in enumerate(pg_list):
        id = i + 1
        player = {
            "id": 'P' + str(id),
            "user_id": pg.player.token,
            "username": pg.player.username,
            "cards": [],
            "coins": 11,
            "score": 0
        }
        result.append(player)

    return result

# check if user_id is the current player
def isCurrentPlayer(game_data, user_id):
    player_index = game_data["current_player"]
    if player_index == -1: return False
    return user_id == game_data["players"][player_index]["user_id"]

# update the game_data object
def reduceOneCoin(game_data, user_id):
    # check if user has enough coin
    player_list = game_data["players"]
    for player in player_list:
        if player["user_id"] == user_id and player["coins"] > 0:
            player["coins"] -= 1
            return True
    return False

# player pass the turn
def playerPassTurn(room_uid, user_id):
    with transaction.atomic():
        game = getGameRoom(room_uid)
        if not game: return False
        # check if game is ongoing
        if game.status != "ongoing": return False

        game_data = json.loads(game.game_data)
        # check if user is current user
        if not isCurrentPlayer(game_data, user_id): return False
        # reduce coins
        if not reduceOneCoin(game_data, user_id): return False
        # record the player that pass the turn
        player_index = game_data["current_player"]
        prev_player = game_data["players"][player_index]["username"]

        game_data["current_player"] = (game_data["current_player"] + 1) % game_data["num_of_players"]
        game_data["public"]["coins"] += 1

        logs = [
            {"action": "pass_turn", "message": prev_player + " pass"},
        ]
        updateGameLogs(game_data, logs)

        game.game_data = json.dumps(game_data)
        game.save()

    return True

# update the game_data after user take a card
def takeCard(game_data, user_id):
    player_list = game_data["players"]
    for player in player_list:
        if player["user_id"] == user_id:
            player["cards"].append(game_data["public"]["card"])
            player["coins"] += game_data["public"]["coins"]
            game_data["public"]["card"] = None
            game_data["public"]["coins"] = 0
            player["cards"].sort()
            return True
    return False

# calculate score of a player
def getScore(player):
    score = player["coins"]
    player["cards"].sort()
    n = len(player["cards"])
    for i in range(n):
        if i == 0:
            score -= player["cards"][i]
        elif (player["cards"][i - 1] + 1) != player["cards"][i]:
            score -= player["cards"][i]
    return score

# update game_data after the game end
def gameEnd(game_data):
    player_list = game_data["players"]
    for player in player_list:
        player["score"] = getScore(player)
    game_data["current_player"] = -1

# update game_data after a player take a card (with coins)
def playerTakeCard(room_uid, user_id):
    with transaction.atomic():
        game = getGameRoom(room_uid)
        if not game: return False
        # check if game is ongoing
        if game.status != "ongoing": return False

        game_data = json.loads(game.game_data)
        # check if user is current user
        if not isCurrentPlayer(game_data, user_id): return False
        # take the card
        if not takeCard(game_data, user_id): return False
    
        player_index = game_data["current_player"]
        cur_player = game_data["players"][player_index]["username"]
        logs = [
            {"action": "take_card", "message": cur_player + " take the card and the coins."},
        ]

        # go to next round
        if len(game_data["decks"]) > 0:
            game_data["public"]["card"] = game_data["decks"].pop()
            logs.append({"action": "flip_card", "message": "First Card is " + str(game_data["public"]["card"])})
        # game end
        else:
            gameEnd(game_data)
            game.status = 'complete'
            logs.append({"action": "game_complete", "message": "Game complete!"})

        updateGameLogs(game_data, logs)

        game.game_data = json.dumps(game_data)
        game.save()

    return True