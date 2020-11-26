var socket;
var gamePage;

function Initialisation()
{
    gamePage = document.getElementById("gamepage");
    
    socket = io();
    socket.on("pageContents",LoadPageContents);
    
    socket.on("nickname", Nickname);
}

function Nickname(nickname)
{
    document.getElementById("beep").innerHTML = nickname;
}

function LoadPageContents(page)
{
    gamePage.innerHTML = page;
}

function btnSubmit_Click()
{
    var nickname = document.getElementById("tbNickname").value;

    socket.emit("startgame",nickname);
}