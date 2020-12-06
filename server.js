var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var fs = require("fs");

var util = require("./util.js");

const bodyParser = require('body-parser');

var playerCount = 0;
var bulletCount = 0;
var players = {};
var bullets = {};
var prevTime;
var runGame = true;

var coinCount = 0;
var coins = {};


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
        this.playerShot = null;
        this.lives = util.playerLives;
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
            if (Math.abs(x2) <= util.coinRadius)
            {
                x2 *= x2;

                var y2 = coin.y - this.y;
                y2 *= y2;

                var d2 = x2 + y2;
                if (d2 <= util.coinRadius * util.coinRadius)
                {
                    this.IncrementScore();
                    DestroyCoin(c);
                    console.log(this.playerID+"'s score is "+this.score);
                }
            }
        }
        for (let b in bullets)
        {
            var bullet = bullets[b];
            if (bullet.senderID != this.playerID)
            {
                var x2 = bullet.x - this.x;
                
                if (Math.abs(x2) <= util.bulletRadius)
                {
                    x2 *= x2;

                    var y2 = bullet.y - this.y;
                    y2 *= y2;

                    var d2 = x2 + y2;
                    if (d2 <= util.bulletRadius*util.bulletRadius)
                    {
                        console.log("bullet hit player");
                        this.lives--;
                        if (this.playerShot != null)
                        {
                            this.playerShot(this.lives);
                        }
                        if (this.lives < 1)
                        {
                            io.emit("playerdied", this.playerID);
                        }
                        DestroyBullet(b);
                    }
                }
            }
        }
    }
}

class ServerBullet extends GameEntity
{
    constructor(id, pos, dir, playerID)
    {
        super();
        this.bulletID = id;
        this.senderID = playerID;
        this.originalPosition = pos;
        this.x = pos.x;
        this.y = pos.y;
        this.dX = dir.x * util.bulletSpeed;
        this.dY = dir.y * util.bulletSpeed;
        this.timeRemaining = util.bulletTime;
    }
    Update(delta)
    {
        this.timeRemaining -= delta;
        if (this.timeRemaining <= 0)
        {
            DestroyBullet(this.bulletID);
            return;
        }
        var prevX = this.x;
        var prevY = this.y;
        super.Update(delta);
        if (this.x != prevX || this.y != prevY)
        {
            io.emit("bulletupdate",this.bulletID,this.x,this.y);
        }
        
    }
    /*OutsideRange()
    {
        var x2 = (this.x - this.originalPosition.x) * (this.x - this.originalPosition.x);
        var y2 = (this.y - this.originalPosition.y) * (this.y - this.originalPosition.y);
        var d2 = x2 + y2;
        return d2 >= util.bulletRange*util.bulletRange;
    }*/
}

class ServerCoin extends GameEntity
{
    constructor(id, pos)
    {
        super();
        this.coinID = id;
        this.x = pos.x;
        this.y = pos.y;
        this.timeRemaining = util.coinTime;
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


var ioConnection = function(socket)
{
    console.log("Client connected.");   
    var playerID = playerCount++;
    socket.emit("serverconnect");
    SpawnExistingPlayers(socket);
    SpawnBullets(socket);
    SpawnCoins(socket);
    var player = PlayerSpawn(playerID, socket);
    
    var scoreChanged = function(score)
    {
        socket.emit("scorechanged", score);
    }
    player.scoreChanged = scoreChanged;
    
    var playerShot = function(lives)
    {
        socket.emit("playershot", playerID, lives);
    };
    player.playerShot = playerShot;
    
    socket.emit("setplayer",playerID);
    
    var dirClick = function(btnID)
    {
        switch(btnID)
        {
            case "down":
            {
                players[playerID].dY = util.playerSpeed;
                break;
            }
            case "up":
            {
                players[playerID].dY = -util.playerSpeed;
                break;
            }
            case "left":
            {
                players[playerID].dX = -util.playerSpeed;
                break;
            }
            case "right":
            {
                players[playerID].dX = util.playerSpeed;
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
        var bullet = new ServerBullet(bulletID, pos, dir, playerID);
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
    var posX = Math.floor(Math.random() * util.maxX) + util.minX;
    var posY = Math.floor(Math.random() * util.maxY) + util.minY;
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
    if (Math.random() < util.coinSpawnProb)
    {
        CreateCoin();
    }
    for (let b in bullets)
    {
        bullets[b].Update(delta);
        /*if (bullets[b].OutsideRange())
        {
            DestroyBullet(b);
        }*/
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