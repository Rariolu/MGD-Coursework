var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var fs = require("fs");

const bodyParser = require('body-parser');

var playerCount = 0;
var players = [];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

class ServerPlayer
{
    constructor(id,nickname)
    {
        this.playerID = id;
        this.playerNickname = nickname;
        this.x = 0;
        this.y = 0;
    }
}

var introScreen = function(req, res)
{
    res.sendFile(__dirname+"/index.html");
};

app.get("/",introScreen);

var miscURL = function(req,res)
{
    res.sendFile(__dirname+req.url);
};

app.get("/*",miscURL);

function SendPage(path, socket)
{
    var fileRead = function(err, data)
    {
        if (err)
        {
            console.log(err);
            socket.emit("pageContents",err);
        }
        else
        {
            //console.log(data);
            socket.emit("pageContents", data);
        }
    };
    fs.readFile(path,"utf8",fileRead);
}

function SpawnExistingPlayers(socket)
{
    for (let p in players)
    {
        socket.emit("spawn",players[p]);
    }
}

function PlayerSpawn(id, nickname)
{
    var player = new ServerPlayer(id,nickname);
    players[id] = player;
    io.emit("spawn", player);
}

function PlayerDespawn(id)
{
    delete players[id];
    io.emit("despawn",id);
}

var ioConnection = function(socket)
{
    console.log("Client connected.");
    var playerCreated = false;
    var playerID;
    var playerNickname;
    SendPage("./intro.html", socket);
    
    var startGame = function(nickname)
    {
        SendPage("./maingame.html",socket);
        playerNickname = nickname;
        playerID = playerCount++;
        SpawnExistingPlayers(socket);
        PlayerSpawn(playerID, nickname);
        playerCreated = true;
        //socket.emit("waitforelement","cvsGame");
    };
    
    socket.on("startgame", startGame);
    
    var elementLoaded = function(id)
    {
        console.log(id+" loaded");
        switch(id)
        {
            case "cvsGame":
            {
                socket.emit("begingameloop");
                /*if (!playerCreated)
                {
                    playerID = playerCount++;
                    SpawnExistingPlayers(socket);
                    PlayerSpawn(playerID, playerNickname);
                    playerCreated = true;
                }*/
                break;
            }
        }
    };
    
    socket.on("elementloaded", elementLoaded);
    
    
    /*var gamePageLoaded = function()
    {
        playerID = playerCount++;
        SpawnExistingPlayers(socket);
        PlayerSpawn(playerID, nickname);
        playerCreated = true;
    }
    
    socket.on("gamepageloaded", gamePageLoaded);*/
    
    var ioDisconnection = function()
    {
        console.log("Client disconnected.");
        if (playerCreated)
        {
            PlayerDespawn(playerID);
            playerCreated = false;
        }
    };
    socket.on("disconnect",ioDisconnection);
};

io.on("connection",ioConnection);

var main = function()
{
    console.log("Listening on 3000.");
}

http.listen(3000,main);