const webSocketUrl = 'ws://' + window.location.host + '/ws/game/' + room_uid + '/' + user_id + "/";
const invitation_url = "http://" + window.location.host + "/join/" + room_uid

// exponent backoff 
var maximum_backoff_time = 60, backoff_time = 1;
var chatSocket
var game_status
var current_player_id
var game_log_length = 0
var wait_time = 0
var public_coin = 0
var animation_time = 1000

// web socket initialization
function connect() {
    /* console.log('call connect()') */
    chatSocket = new WebSocket(webSocketUrl);

    chatSocket.onopen = function(e) {
        /* console.log('onopen') */
        // reset backoff_time
        backoff_time = 1
        console.log('Connected!')
    }

    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data)["data"];

        // show the json data
        console.log("Received Message!")
        /* str_data = "<div id='data_area'><pre>" + JSON.stringify(data, null, "\t"); + "</pre></div>"
        $("#data_area").replaceWith(str_data) */
    
        if (game_status == "complete" && data.status == "complete") {
            return
        } else {
            game_status = data.status
        }

        // if status is 'start'
        if (data.status == 'start') {
            $("#player_list").empty()
            for (let i = 0 ; i < data.user_list.length; i++) {
                let edit_icon = `<i class="fa fa-pencil clickable" aria-hidden="true" data-bs-toggle="modal" data-bs-target="#updateNameModal"></i>`
                if (data.user_list[i].user_token == user_id) {
                    player = "<li class='list-group-item'>" + 
                        data.user_list[i].username + " " + edit_icon + "</li>"
                } else {
                    player = "<li class='list-group-item'>" + data.user_list[i].username + "</li>"
                }
                
                $("#player_list").append(player)
            }

            $('#user_list_component').show()
            $('#play_area_component').hide()
        } else {
            // show some animations
            // pass animation
            console.log(data.game_data)
            if (game_log_length != data.game_data.game_logs.length) {
                for (let i = 0; i < data.game_data.last_logs.length; i++) {
                    log = data.game_data.last_logs[i]
                    if (log.action == "pass_turn") {
                        moveCoinToPublic(`#coin_pic2_${current_player_id}`)
                        wait_time = animation_time + 100
                    } else if (log.action == "take_card") {
                        if (public_coin > 0) {
                            moveCoinToPlayer(`#coin_pic1_${current_player_id}`)
                            wait_time = animation_time * 2 + 100
                        } else {
                            moveCardToPlayer(`#coin_pic1_${current_player_id}`)
                            wait_time = animation_time
                        }
                        // moveCardToPlayer(`#coin_pic1_${current_player_id}`)
                    }
                }
                game_log_length = data.game_data.game_logs.length
            } else {
                wait_time = 0
            }
            public_coin = data.game_data.public.coins

            setTimeout(()=> {
                updateGame(data)
            }, wait_time)
        }
    };
    
    chatSocket.onclose = function(e) {
        console.error('Chat socket closed unexpectedly');
        // connection
        t = (backoff_time + Math.random() / 10) * 1000
        console.log('Reconnect in ', (t / 1000).toFixed(0), 'seconds ...')
        setTimeout(() => {
            connect()
        }, t)
        backoff_time = backoff_time * 2
        backoff_time = Math.min(backoff_time, maximum_backoff_time)
    };

}

connect()
