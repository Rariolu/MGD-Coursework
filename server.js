var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var fs = require("fs");

var util = require("./util.js");

const bodyParser = require('body-parser');
const debug = true;
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
    constructor(id, nickname)
    {
        super();
        this.playerNickname = nickname;
        this.playerID = id;
        this.score = 0;
        this.scoreChanged = null;
        this.playerShot = null;
        this.lives = util.playerLives;
        this.playerAlive = true;
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
        if (!this.playerAlive)
        {
            return;
        }
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
                            KillPlayer(this.playerID);
                            this.playerAlive = false;
                            if (this.playerDied != null)
                            {
                                this.playerDied();
                            }
                        }
                        DestroyBullet(b);

                        if (players[bullet.senderID] != null)
                        {
                            players[bullet.senderID].IncrementScore();
                        }
                    }
                }
            }
        }
    }
}

function KillPlayer(id)
{
    io.emit(util.SOCKET_EVENT.PLAYER_DIED, id);
    PlayerDespawn(id);
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
            io.emit(util.SOCKET_EVENT.BULLET_UPDATE,this.bulletID,this.x,this.y);
        }
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
        socket.emit(util.SOCKET_EVENT.SPAWN,players[p]);
    }
}

function PlayerSpawn(id, nickname, socket)
{
    var player = new ServerPlayer(id,nickname);
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
        socket.emit(util.SOCKET_EVENT.COIN_SPAWN,coins[c]);
    }
}

function SpawnBullets(socket)
{
    for (let b in bullets)
    {
        socket.emit(util.SOCKET_EVENT.BULLET_CREATED,bullets[b]);
    }
}


var ioConnection = function(socket)
{
    console.log("Client connected.");
    
    var playerSpawned = false;
    var playerID;
    var playerNickname;
    var player;
    
    socket.emit(util.SOCKET_EVENT.SERVER_CONNECT);
    SpawnExistingPlayers(socket);
    SpawnBullets(socket);
    SpawnCoins(socket);
    
    var dirClick = function(btnID)
    {
        if (playerSpawned)
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
            
            socket.emit(util.SOCKET_EVENT.VEL_UPDATE, playerID, players[playerID].dX, players[playerID].dY);
        }
    };
    
    var dirUnClick = function(btnID)
    {
        if (playerSpawned)
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
            socket.emit(util.SOCKET_EVENT.VEL_UPDATE,playerID, players[playerID].dX, players[playerID].dY);
        }
    };
    
    var shotFired = function(pos, dir)
    {
        var bulletID = bulletCount++;
        var bullet = new ServerBullet(bulletID, pos, dir, playerID);
        bullets[bulletID] =  bullet;
        io.emit(util.SOCKET_EVENT.BULLET_CREATED, bullet);
    };
    
    var initialisePlayer = function()
    {
        playerID = playerCount++;
        player = PlayerSpawn(playerID, playerNickname, socket);
        playerSpawned = true;
        socket.emit(util.SOCKET_EVENT.SET_PLAYER_ID, playerID);
        
        var scoreChanged = function(score)
        {
            socket.emit(util.SOCKET_EVENT.SCORE_CHANGED, score);
        }
        player.scoreChanged = scoreChanged;

        var playerShot = function(lives)
        {
            socket.emit(util.SOCKET_EVENT.PLAYER_SHOT, playerID, lives);
        };
        player.playerShot = playerShot;

        var playerDied = function()
        {
            console.log(playerNickname+" died :'(");
            playerSpawned = false;
            socket.off(util.SOCKET_EVENT.DIR_CLICK, dirClick);
            socket.off(util.SOCKET_EVENT.dirUnClick, dirUnClick);
            socket.off(util.SOCKET_EVENT.shotFired, shotFired);
        };
        player.playerDied = playerDied;
        
        socket.on(util.SOCKET_EVENT.DIR_CLICK, dirClick);
        socket.on(util.SOCKET_EVENT.DIR_UNCLICK, dirUnClick);
        socket.on(util.SOCKET_EVENT.SHOT_FIRED, shotFired);
    };
    
    var receiveNickname = function(nickname)
    {
        playerNickname = nickname;
        console.log(playerNickname);
        initialisePlayer();
    };
    
    socket.on(util.SOCKET_EVENT.SEND_NICKNAME, receiveNickname);

    var requestRespawn = function()
    {
        initialisePlayer();
    };

    socket.on(util.SOCKET_EVENT.REQUEST_RESPAWN, requestRespawn);
    
    var ioDisconnection = function()
    {
        if (playerSpawned)
        {
            console.log("Client disconnected.");
            PlayerDespawn(playerID);
        }
    };
    socket.on(util.SOCKET_EVENT.DISCONNECTION, ioDisconnection);
};

io.on(util.SOCKET_EVENT.CONNECTION, ioConnection);



function DestroyBullet(id)
{
    delete bullets[id];
    io.emit(util.SOCKET_EVENT.BULLET_DESTROYED, id);
}

function CreateCoin()
{
    var coinID = coinCount++;
    var posX = Math.floor(Math.random() * util.maxX) + util.minX;
    var posY = Math.floor(Math.random() * util.maxY) + util.minY;
    var pos = new util.Vector(posX, posY);//{x:posX, y:posY};
    var coin = new ServerCoin(coinID,pos);
    coins[coinID] = coin;
    io.emit(util.SOCKET_EVENT.COIN_SPAWN, coin);
}

function DestroyCoin(id)
{
    delete coins[id];
    io.emit(util.SOCKET_EVENT.COIN_DESPAWN, id);
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

function Log(splitter, ...excerpts)
{
    var text = "";
    for (var i = 0; i < excerpts.length; i++)
    {
        if (i > 0)
        {
            text += splitter;
        }
        text += excerpts[i];
    }
    console.log(text);
    if (debug)
    {
        io.emit(util.SOCKET_EVENT.SERVER_DEBUG, text);
    }
}

function LogText(text)
{
    Log("",text);
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