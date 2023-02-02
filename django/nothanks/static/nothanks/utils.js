/* ---------- start of dom initialization ---------- */
// return player area
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

// return a card
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

// return a stacked card
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
/* ---------- end of dom initialization ---------- */


/* ---------- start of dom update ---------- */
// update the game div
function updateGame(data) {
    // update public area
    updatePublicArea(data.game_data)

    // update player area
    updatePlayerAreas(data.game_data)

    // update message area
    updateMessageArea(data.game_data, user_id)

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

// update the public area (deck, current card, coins)
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
    $("#moving_card").hide()
    // update chips
    $("#num_of_coin").text(game_data.public.coins)
}

// update the dom to add card list to player area
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

// update one player board
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

// update all players player boards
function updatePlayerAreas(game_data) {
    for (let i = 0; i < game_data.num_of_players; i++) {
        target_area = "#area_player_" + game_data.players[i].id
        if ($(target_area).length == 0) {
            initPlayerArea(game_data.players[i])
        }
        updatePlayerArea(game_data, game_data.players[i])
    }
}

function updateMessageArea(game_data, user_id) {
    if (isCurrentUser(game_data, user_id)) {
        $(`#message_content`).html("It is <b style='color:red'>your</b> turn.")
        $
    } else if (game_data.current_player != -1) {
        let player_name = game_data.players[game_data.current_player].username
        $(`#message_content`).html(`It is <b style='color:blue'>${player_name}</b> turn.`)
    } else {
        $(`#message_content`).empty()
    }
}
/* ---------- end of dom update ---------- */


/* ---------- start of card and coins animation ---------- */
// play animation to move coin to public
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
    }, animation_time, function () {
        // hide the chips
        $(id).hide()
        // move back 
        $(id).css({
            "left": `0px`,
            "top": `0px`
        })
    })
}

// play animation to move coin to player
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
    }, animation_time, function () {
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

// play animation to move card to player
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
    }, animation_time, function () {
        // hide the chips
        $("#moving_card").hide()
        // move back 
        $("#moving_card").css({
            "left": `0px`,
            "top": `0px`
        })
    })
}
/* ---------- end of card and coins animation ---------- */

/* ---------- utils.js ---------- */
// check if user_id is active player
function isCurrentUser(game_data, user_id){
    if (game_data.current_player == -1) {
        return false
    }
    return game_data.players[game_data.current_player].user_id == user_id
}

// process the card list to stack the consecutive cards
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

// copy the invitation link to click board
function copyToClipboard(elem) {
    // create hidden text element, if it doesn't already exist
    var targetId = "_hiddenCopyText_";
    
    // must use a temporary form element for the selection and copy
    target = document.getElementById(targetId);
    if (!target) {
        var target = document.createElement("textarea");
        target.style.position = "absolute";
        target.style.left = "-9999px";
        target.style.top = "0";
        target.id = targetId;
        document.body.appendChild(target);
    }
    target.textContent = invitation_url;
    // select the content
    var currentFocus = document.activeElement;
    target.focus();
    target.setSelectionRange(0, target.value.length);
    
    // copy the selection
    var succeed;
    try {
            succeed = document.execCommand("copy");
    } catch(e) {
        succeed = false;
    }
    // restore original focus
    if (currentFocus && typeof currentFocus.focus === "function") {
        currentFocus.focus();
    }
    
    // clear temporary content
    target.textContent = "";
    return succeed;
}
/* ---------- end of utils.js ---------- */