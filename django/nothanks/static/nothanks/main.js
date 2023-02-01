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
                        wait_time = 500
                    } else if (log.action == "take_card") {
                        if (public_coin > 0) {
                            moveCoinToPlayer(`#coin_pic1_${current_player_id}`)
                            wait_time = 1000
                        } else {
                            moveCardToPlayer(`#coin_pic1_${current_player_id}`)
                            wait_time = 500
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

// utils

function updateGame(data) {
    // update public area
    updatePublicArea(data.game_data)

    // update player area
    updatePlayerAreas(data.game_data)

    if (data.game_data.current_player != -1) {
        current_player_id = data.game_data.players[data.game_data.current_player].id
    }
    // if status is 'ongoing'
    if (data.status == 'ongoing') {
        $('#passTurn').show()
        $('#takeCard').show()
        // show if current user
        if (isCurrentUser(data.game_data, user_id)) {
            $('#action_buttons').css("visibility", "visible")
        } else {
            $('#action_buttons').css("visibility", "hidden")
        }
        $('#action_buttons').show()
        $('#result_buttons').hide()
    // if status is 'complete'
    } else if (data.status == 'complete') {
        // update score table
        table = `<table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Username</th>
                    <th scope="col">Score</th>
                </tr>
            </thead>
            <tbody id="score_content"></tbody>
        </table>`
        $("#resultModalBody").empty()
        $("#resultModalBody").append(table)

        players = JSON.parse(JSON.stringify(data.game_data.players))
        players.sort((a,b) => (b.score - a.score))
        for (let i = 0; i < players.length; i++) {
            player = players[i]
            rank = "<th>" + (i + 1) + "</th>"
            username = "<td>" + player.username + "</td>"
            score = "<td>" + player.score + "</td>"
            tr = "<tr>" + rank + username + score + "</tr>";
            $("#score_content").append(tr)
        }
        $('#action_buttons').hide()
        $('#result_buttons').show()
        $('#current_card').hide()
        // show modal
        const myModal = new bootstrap.Modal(document.getElementById('resultModal'))
        myModal.show()
    }
    
    $('#user_list_component').hide()
    $('#play_area_component').show()
}

function moveCoinToPublic(id) {
    if ($(id).length == 0) {
        return
    }
    $(id).show()
    pos1 = $(id).offset()
    pos2 = $("#num_of_coin").offset()
    left_offset = pos2.left - pos1.left
    top_offset = pos2.top - pos1.top

    $(id).animate({
        "left": `${left_offset}px`,
        "top": `${top_offset}px`
    }, function () {
        // hide the chips
        $(id).hide()
        // move back 
        $(id).css({
            "left": `0px`,
            "top": `0px`
        })
    })
}

function moveCoinToPlayer(id) {
    if ($(id).length == 0) {
        return
    }
    $("#public_coin").show()
    pos1 = $("#public_coin").offset()
    pos2 = $(id).offset()
    left_offset = pos2.left - pos1.left
    top_offset = pos2.top - pos1.top
    
    $("#public_coin").animate({
        "left": `${left_offset}px`,
        "top": `${top_offset}px`
    }, function () {
        // hide the chips
        $("#public_coin").hide()
        // move back 
        $("#public_coin").css({
            "left": `0px`,
            "top": `0px`
        })

        moveCardToPlayer(id)
    })
}

function moveCardToPlayer(id) {
    if ($(id).length == 0) {
        return
    }
    console.log("Move Card")
    $("#moving_card").show()
    pos1 = $("#moving_card").offset()
    pos2 = $(id).offset()
    left_offset = pos2.left - pos1.left
    top_offset = pos2.top - pos1.top

    // hide the static card
    $("#current_card").removeClass("border")
    $("#current_card").removeClass("bg-success")
    $("#static_card").hide()
    
    $("#moving_card").animate({
        "left": `${left_offset}px`,
        "top": `${top_offset}px`
    }, function () {
        // hide the chips
        $("#moving_card").hide()
        // move back 
        $("#moving_card").css({
            "left": `0px`,
            "top": `0px`
        })
    })
}

function isCurrentUser(game_data, user_id){
    if (game_data.current_player == -1) {
        return false
    }
    return game_data.players[game_data.current_player].user_id == user_id
}

function updatePublicArea(game_data) {
    // update deck
    $("#deck_num_of_card_1").text(game_data.decks.length)
    $("#deck_num_of_card_2").text(game_data.decks.length > 0 ? "cards" : "card")
    // update card
    for (let i = 1; i <= 10; i++) {
        $(`#card_value_${i}`).text(game_data.public.card)    
    }
    // show card
    $("#current_card").addClass("border")
    $("#current_card").addClass("bg-success")    
    $("#static_card").show()
    // update chips
    $("#num_of_coin").text(game_data.public.coins)
}

function initPlayerArea(player) {
    player_id = player.id
    username = player.username
    coins = player.coins
    let player_area = `
    <div class="container card cards-area mt-2 border border-5" id="area_player_${player_id}" style="z-index:0">
        <div class="row mt-2" id="username_coin_P1">
            <div class="col-auto">
                <h3 class="my-auto" id="username_${player_id}">${username} <i id="arrow_player_${player_id}" class="fa fa-small fa-arrow-left" style="color:red" aria-hidden="true"></i></h3>
            </div>
            <div class="col">
                <div class="row">
                    <div class="col-auto my-auto">
                        <h4 class="my-auto" id="coins_${player_id}">${coins} x</h4>
                    </div>
                    <div class="col-auto my-auto position-relative small-token" id="coin_pic1_${player_id}">
                        <div class="position-absolute border border-dark border-3 rounded-circle top-50 start-50 translate-middle bg-warning small-token-inner"></div>
                    </div>
                    <div class="col-auto my-auto position-relative small-token" id="coin_pic2_${player_id}" style="display:none">
                        <div class="position-absolute border border-dark border-3 rounded-circle top-50 start-50 translate-middle bg-warning small-token-inner"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row my-2" id="cards_${player_id}">
        </div>
    </div>
    `
    $("#player_area").append(player_area)
}

function generateCardList(cards) {
    card_list = []
    temp = []
    for (let i = 0; i < cards.length; i++) {
        if (temp.length == 0 || cards[i] == temp[temp.length - 1] + 1) {
            temp.push(cards[i])
        } else {
            card_list.push(temp)
            temp = [cards[i]]
        }
    }
    if (temp.length > 0) {
        card_list.push(temp)
    }
    return card_list
}

function getCardDiv(num) {
    return `
    <div class="col-auto half-card">
        <div class="border border-1 my-2 mx-2 rounded-4 position-relative bg-success play-card">
            <div class="position-absolute rounded-4 top-50 start-50 translate-middle bg-light play-card-inner"></div>
            <div class="position-absolute top-50 start-50 translate-middle"></div>
            <div class="position-absolute upper-half large-text">${num}</div>
            <div class="position-absolute top-left">${num}</div>
            <div class="position-absolute top-right">${num}</div>
            <div class="position-absolute bottom-left">${num}</div>
            <div class="position-absolute bottom-right">${num}</div>
        </div>
    </div>`
}

function getStackedCardDiv(num, left) {
    return `
    <div class="position-absolute" style="left:${left}px">
        <div class="border border-1 my-2 mx-2 rounded-4 position-relative bg-success play-card">
            <div class="position-absolute rounded-4 top-50 start-50 translate-middle bg-light play-card-inner"></div>
            <div class="position-absolute top-50 start-50 translate-middle"></div>
            <div class="position-absolute upper-half large-text">${num}</div>
            <div class="position-absolute top-left">${num}</div>
            <div class="position-absolute top-right">${num}</div>
            <div class="position-absolute bottom-left">${num}</div>
            <div class="position-absolute bottom-right">${num}</div>
        </div>
    </div>`
}

function addCardsToArea(player_id, cards) {
    area_id = `#cards_${player_id}`
    // add single card
    if (cards.length == 1) {
        card_div = getCardDiv(cards[0])
        $(area_id).append(card_div)
    } else {
        // wide screen width > 600px
        if ($(window).width() > 600) {
            width = 128 + (cards.length - 1) * 32 + 16
        } else {
            width = 64 + (cards.length - 1) * 32 + 16
        }
        // small screen width <= 600px
        
        $(area_id).append(`<div class="col-auto half-card"><div class="position-relative" id="card_list_${cards[0]}" style="width:${width}px"></div></div>`)
        for (let i = 0; i < cards.length; i++) {
            card_div = getStackedCardDiv(cards[cards.length - i - 1], 32 * (cards.length - i - 1))
            $(`#card_list_${cards[0]}`).append(card_div)
            /* $(area_id).append(card_div) */
        }
    }
}

function updatePlayerArea(game_data, player) {
    player_id = player.id
    // update border color: red for current color, dark for other
    if (isCurrentUser(game_data, player.user_id)) {
        $(`#area_player_${player_id}`).removeClass("border-danger border-dark").addClass("border-danger")
        $(`#arrow_player_${player_id}`).show()
    } else {
        $(`#area_player_${player_id}`).removeClass("border-danger border-dark").addClass("border-dark")
        $(`#arrow_player_${player_id}`).hide()
    }
    

    // update coins
    coins = player.coins
    $(`#coins_${player_id}`).text(coins + " x")

    // update cards
    $(`#cards_${player_id}`).empty()

    card_list = generateCardList(player.cards)
    for (let i = 0; i < card_list.length; i++) {
        addCardsToArea(player_id, card_list[i])
    }
}

function updatePlayerAreas(game_data) {
    for (let i = 0; i < game_data.num_of_players; i++) {
        target_area = "#area_player_" + game_data.players[i].id
        if ($(target_area).length == 0) {
            initPlayerArea(game_data.players[i])
        }
        updatePlayerArea(game_data, game_data.players[i])
    }
}