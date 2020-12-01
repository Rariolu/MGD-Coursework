var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var fs = require("fs");

const bodyParser = require('body-parser');

var playerCount = 0;
var bulletCount = 0;
var players = [];
var bullets = [];
var prevTime;
var runGame = true;
const bulletRange = 500;
const bulletSpeed = 30;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

class GameEntity
{
    constructor()
    {
        this.x = 0;
        this.y = 0;
        this.dX = 0;
        this.dY = 0;
    }
    Update(delta)
    {
        this.x += this.dX * delta;
        this.y += this.dY * delta;
    }
}

class ServerPlayer extends GameEntity
{
    constructor(id)
    {
        super();
        this.playerID = id;
        this.controls = [];
    }
    ControlChange(name, state)
    {
        this.controls[name] = state;
    }
    Update(delta)
    {
        var prevX = this.x;
        var prevY = this.y;
        super.Update(delta);
        if (this.x != prevX || this.y != prevY)
        {
            io.emit("posupdate",this.playerID,this.x,this.y);
        }
    }
}

class ServerBullet extends GameEntity
{
    constructor(id, pos, dir)
    {
        super();
        this.bulletID = id;
        this.originalPosition = pos;
        this.x = pos.x;
        this.y = pos.y;
        this.dX = dir.x * bulletSpeed;
        this.dY = dir.y * bulletSpeed;
    }
    Update(delta)
    {
        var prevX = this.x;
        var prevY = this.y;
        super.Update(delta);
        if (this.x != prevX || this.y != prevY)
        {
            io.emit("bulletupdate",this.bulletID,this.x,this.y);
        }
    }
    OutsideRange()
    {
        var x2 = (this.x - this.originalPosition.x) * (this.x - this.originalPosition.x);
        var y2 = (this.y - this.originalPosition.y) * (this.y - this.originalPosition.y);
        var d2 = x2 + y2;
        return d2 >= bulletRange;
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

function SpawnExistingPlayers(socket)
{
    for (let p in players)
    {
        socket.emit("spawn",players[p]);
    }
}

function PlayerSpawn(id)
{
    var player = new ServerPlayer(id);
    players[id] = player;
    io.emit("spawn", player);
}

function PlayerDespawn(id)
{
    delete players[id];
    io.emit("despawn",id);
}

const playerSpeed = 100;
var ioConnection = function(socket)
{
    
    console.log("Client connected.");
    var playerID = playerCount++;
    SpawnExistingPlayers(socket);
    PlayerSpawn(playerID);
    socket.emit("setplayer",playerID);
    
    var dirClick = function(btnID)
    {
        //console.log(playerID+" pressed "+ btnID);
        players[playerID].ControlChange(btnID, true);
        switch(btnID)
        {
            case "down":
            {
                players[playerID].dY = playerSpeed;
                break;
            }
            case "up":
            {
                players[playerID].dY = -playerSpeed;
                break;
            }
            case "left":
            {
                players[playerID].dX = -playerSpeed;
                break;
            }
            case "right":
            {
                players[playerID].dX = playerSpeed;
                break;
            }
        }
        socket.emit("velupdate",playerID, players[playerID].dX, players[playerID].dY);
    };
    
    socket.on("dirclick", dirClick);
    
    var dirUnClick = function(btnID)
    {
        players[playerID].ControlChange(btnID, false);
        switch(btnID)
        {
            case "down":
            case "up":
            {
                players[playerID].dY = 0;
                break;
            }
            case "left":
            case "right":
            {
                players[playerID].dX = 0;
                break;
            }
        }
        socket.emit("velupdate",playerID, players[playerID].dX, players[playerID].dY);
    };
    
    socket.on("dirunclick", dirUnClick);
     
    var shotFired = function(pos, dir)
    {
        var bulletID = bulletCount++;
        var bullet = new ServerBullet(bulletID, pos, dir);
        bullets[bulletID] =  bullet;
        io.emit("bulletcreated",bullet);
    };
    
    socket.on("shotfired", shotFired);
    
    var ioDisconnection = function()
    {
        console.log("Client disconnected.");
        PlayerDespawn(playerID);
    };
    socket.on("disconnect",ioDisconnection);
};

io.on("connection",ioConnection);

var gameLoop = function()
{
    if (runGame)
    {
        Update();
    }
};

function DestroyBullet(id)
{
    delete bullets[id];
    io.emit("bulletdestroyed",id);
}

function Update()
{
    var currentTime = Date.now();
    var delta = (currentTime - prevTime) / 1000;
    prevTime = currentTime;
    for (let b in bullets)
    {
        bullets[b].Update(delta);
        if (bullets[b].OutsideRange())
        {
            DestroyBullet(b);
        }
    }
    for (let p in players)
    {
        players[p].Update(delta);
    }
}

var main = function()
{
    console.log("Listening on 3000.");
    prevTime = Date.now();
    setInterval(gameLoop,5);
}

http.listen(3000,main);