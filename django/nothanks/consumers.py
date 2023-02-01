from django.db import transaction

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import Game, PlayerGame
from .utils import getGameRoomInfo, initGameRoom, playerPassTurn, playerTakeCard

import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # save user token for customize response
        self.user_id = self.scope["url_route"]["kwargs"]["user_id"]
        # create group name
        self.room_uid = self.scope["url_route"]["kwargs"]["room_uid"]
        self.room_group_name = "game_%s" % self.room_uid

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # return latest game condition
        data = await database_sync_to_async(getGameRoomInfo)(self.room_uid)

        await self.channel_layer.group_send(self.room_group_name, {"type": "update_game_status", "data": data})

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        t_data = json.loads(text_data)
        action = t_data["action"]
        # start game
        if action == "start_game":
            # init game 
            success = await database_sync_to_async(initGameRoom)(self.room_uid)
            if success:
                # notify every body in the room
                data = await database_sync_to_async(getGameRoomInfo)(self.room_uid)
                await self.channel_layer.group_send(self.room_group_name, {"type": "update_game_status", "data": data})

        # player pass
        elif action == "pass_turn":
            success = await database_sync_to_async(playerPassTurn)(self.room_uid, self.user_id)
            if success:
                data = await database_sync_to_async(getGameRoomInfo)(self.room_uid)
                await self.channel_layer.group_send(self.room_group_name, {"type": "update_game_status", "data": data})
        # player take a card
        elif action == "take_card":
            success = await database_sync_to_async(playerTakeCard)(self.room_uid, self.user_id)
            if success:
                data = await database_sync_to_async(getGameRoomInfo)(self.room_uid)
                await self.channel_layer.group_send(self.room_group_name, {"type": "update_game_status", "data": data})

        # Send message to room group
        """ await self.channel_layer.group_send(self.room_group_name, {"type": "update_game_status", "data": data}) """

    # Receive message from room group
    async def update_game_status(self, event):
        data = event["data"]

        # filter data by self.user_id
        """ print(self.user_id)
        print(data) """

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"data": data, 'user_id': self.user_id}))
