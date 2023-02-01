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