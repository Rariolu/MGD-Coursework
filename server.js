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
const coinSpawnProb = 0.0005;
var coinCount = 0;
var coins = {};
const minX = -2000;
const maxX = 2000;
const minY = -2000;
const maxY = 2000;
const coinTime = 50;
const coinRadius = 300;

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
        this.score = 0;
        this.scoreChanged = null;
    }
    IncrementScore()
    {
        this.score++;
        if (this.scoreChanged != null)
        {
            this.scoreChanged(this.score);
        }
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
        for (let c in coins)
        {
            var coin = coins[c];
            
            var x2 = coin.x - this.x;
            if (Math.abs(x2) <= coinRadius)
            {
                x2 *= x2;

                var y2 = coin.y - this.y;
                y2 *= y2;

                var d2 = x2 + y2;
                if (d2 <= coinRadius * coinRadius)
                {
                    this.IncrementScore();
                    DestroyCoin(c);
                    console.log(this.playerID+"'s score is "+this.score);
                }
                else if (d2 < 6000)
                {
                    console.log("d2: "+d2);
                }
            }
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
        return d2 >= bulletRange*bulletRange;
    }
}

class ServerCoin extends GameEntity
{
    constructor(id, pos)
    {
        super();
        this.coinID = id;
        this.x = pos.x;
        this.y = pos.y;
        this.timeRemaining = coinTime;
    }
    Update(delta)
    {
        this.timeRemaining -= delta;
        if (this.timeRemaining <= 0)
        {
            DestroyCoin(this.coinID);
        }
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

function PlayerSpawn(id, socket)
{
    var player = new ServerPlayer(id);
    players[id] = player;
    io.emit("spawn", player);
    return player;
}

function PlayerDespawn(id)
{
    delete players[id];
    io.emit("despawn",id);
}

function SpawnCoins(socket)
{
    for (let c in coins)
    {
        socket.emit("coinspawn",coins[c]);
    }
}

function SpawnBullets(socket)
{
    for (let b in bullets)
    {
        socket.emit("bulletcreated",bullets[b]);
    }
}

const playerSpeed = 100;
var ioConnection = function(socket)
{
    
    console.log("Client connected.");
    socket.emit("serverconnect");
    var playerID = playerCount++;
    SpawnExistingPlayers(socket);
    
    var player = PlayerSpawn(playerID, socket);
    var scoreChanged = function(score)
    {
        socket.emit("scorechanged", score);
    }
    player.scoreChanged = scoreChanged;
    
    SpawnCoins(socket);
    socket.emit("setplayer",playerID);
    
    var dirClick = function(btnID)
    {
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



function DestroyBullet(id)
{
    delete bullets[id];
    io.emit("bulletdestroyed",id);
}

function CreateCoin()
{
    var coinID = coinCount++;
    var posX = Math.floor(Math.random() * maxX) + minX;
    var posY = Math.floor(Math.random() * maxY) + minY;
    var pos = {x:posX, y:posY};
    var coin = new ServerCoin(coinID,pos);
    coins[coinID] = coin;
    io.emit("coinspawn", coin);
}

function DestroyCoin(id)
{
    delete coins[id];
    io.emit("coindespawn",id);
}

function Update()
{
    var currentTime = Date.now();
    var delta = (currentTime - prevTime) / 1000;
    prevTime = currentTime;
    if (Math.random() < coinSpawnProb)
    {
        CreateCoin();
    }
    for (let b in bullets)
    {
        bullets[b].Update(delta);
        if (bullets[b].OutsideRange())
        {
            DestroyBullet(b);
        }
    }
    for (let c in coins)
    {
        coins[c].Update(delta);
    }
    for (let p in players)
    {
        players[p].Update(delta);
    }
}

var gameLoop = function()
{
    if (runGame)
    {
        Update();
    }
};

var main = function()
{
    console.log("Listening on 3000.");
    prevTime = Date.now();
    setInterval(gameLoop, 5);
}

http.listen(3000,main);