const startGame = (event) => {
    chatSocket.send(JSON.stringify({
        'action': 'start_game',
        'user_id': user_id
    }));
    $('#startGame').hide()
};

const passTurn = (event) => {
    /* console.log("Pass") */
    chatSocket.send(JSON.stringify({
        'action': 'pass_turn',
        'user_id': user_id
    }));
    $('#passTurn').hide()
    $('#takeCard').hide()
};

const takeCard = (event) => {
    /* console.log("Take card") */
    chatSocket.send(JSON.stringify({
        'action': 'take_card',
        'user_id': user_id
    }));
    $('#passTurn').hide()
    $('#takeCard').hide()
};

const copyLink = (event) => {
    /* console.log("Take card") */
    succeed = copyToClipboard();
    if (succeed) {
        $("#copyMsg").show()
    } else {
        $("#copyMsg").hide()
    }
};

document.getElementById("startGame")?.addEventListener("click", startGame);
document.getElementById("passTurn")?.addEventListener("click", passTurn);
document.getElementById("takeCard")?.addEventListener("click", takeCard);
document.getElementById("copyLinkButton")?.addEventListener("click", copyLink);