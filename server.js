var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

var introScreen = function(req, res)
{
    res.sendFile(__dirname+"/intro.html");
};

app.get("/",introScreen);

var mainGame = function(req, res)
{
    res.sendFile(__dirname+"/maingame.html");
};

app.get("/maingame", mainGame);

var gameover = function(req, res)
{
    res.sendFile(__dirname+"/gameover.html");
};

app.get("/gameover",gameover);

var ioConnection = function(socket)
{
    console.log("Client connected.");
    
    var ioDisconnection = function()
    {
        console.log("Client disconnected.");
        
    };
    socket.on("disconnect",ioDisconnection);
};

io.on("connection",ioConnection);

var main = function()
{
    console.log("Listening on 3000.");
}

http.listen(3000,main);