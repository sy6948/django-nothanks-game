# django
from django.shortcuts import render, redirect
from django.contrib import messages

# models
from .models import Game

# form
from .forms import PlayerUpdateForm

# util
from .utils import getUserInfo, createGameRoom, joinGameRoom, updateUserName

# home page
def home(request):
    # get/create user
    player = getUserInfo(request)

    # handle POST request
    if request.method == "POST":
        # update username
        if 'update' in request.POST:
            player_form = updateUserName(request, player)
            return redirect("nothanks-home")

        if 'game' in request.POST:
            # create game room action
            if request.POST['game'] == "create":
                # create the game room
                game = createGameRoom()

                # unable to create game room
                if game == None:
                    messages.warning(request, f'Error: Unable to create game room.')
                    return redirect("nothanks-home")

                # join game room
                success = joinGameRoom(game, player)
                
                # game room is full
                if success == False: 
                    messages.warning(request, f'Error: Game room is full.')
                    return redirect("nothanks-home")

                messages.success(request, f'Game room created.')
                # redirect to game room
                return redirect('nothanks-game-room', room_uid = game.room_uid)

            # join game room action
            elif request.POST['game'] == "join":
                # find game room
                room_uid = request.POST['room_uid']
                game = Game.objects.filter(room_uid = room_uid).first()
                if not game:
                    messages.warning(request, f'Game room not found.')
                    return redirect("nothanks-home")
                elif game.status != 'start':
                    messages.warning(request, f'Game is ongoing or already complete.')
                    return redirect("nothanks-home")
                else:
                    # join game room
                    success = joinGameRoom(game, player)
                    if success == False: 
                        messages.warning(request, f'Error: Game room is full.')
                        return redirect("nothanks-home")

                    # redirect to game room
                    messages.success(request, f'Joined Game room.')
                    return redirect('nothanks-game-room', room_uid = game.room_uid)
    
    player_form = PlayerUpdateForm(instance = player)
    context = {
        "title": "Home Page",
        "player_form": player_form
    }

    return render(request, "nothanks/home.html", context)

# game page
def gameRoom(request, room_uid):
    # get/create user
    player = getUserInfo(request)

    # check game room exist
    game = Game.objects.filter(room_uid = room_uid).first()
    # if game room not found
    if not game:
        messages.warning(request, f'Game room not found.')
        return redirect("nothanks-home")
    
    # handle POST request
    if request.method == "POST":
        # update username
        if 'update' in request.POST:
            player_form = updateUserName(request, player)
            return redirect('nothanks-game-room', room_uid = game.room_uid)
    
    player_form = PlayerUpdateForm(instance = player)
    
    context = {
        "websocket": True,
        "room_uid": room_uid,
        "user_id": player.token,
        "title": "Room " + room_uid,
        "player_form": player_form
    }
    
    return render(request, "nothanks/game.html", context)

# handle join game action
def joinRoom(request, room_uid):
    # get/create user
    player = getUserInfo(request)

    game = Game.objects.filter(room_uid = room_uid).first()
    # if game room does not exist
    if not game:
        messages.warning(request, f'Game room not found.')
        return redirect("nothanks-home")

    # check if game is not yet start
    if game.status == 'start':
        # join the room
        success = joinGameRoom(game, player)
        if success == False: 
            messages.warning(request, f'Error: Game room is full.')
            return redirect("nothanks-home")
    elif game.status == 'ongoing':
        messages.warning(request, f'Unable to join a ongoing game.')
    elif game.status == 'complete':
        messages.warning(request, f'Unable to join a complete game.')

    return redirect("nothanks-game-room", room_uid = game.room_uid)

