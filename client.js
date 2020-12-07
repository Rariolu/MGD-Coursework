const GAMESTATE =
{
    INTRO: "INTRO",
    MAINGAME: "MAINGAME",
    GAMEOVER: "GAMEOVER"
};

const IMAGE = 
{
    BTNDOWN: "btnDown",
    BTNLEFT: "btnLeft",
    BTNRIGHT: "btnRight",
    BTNUP: "btnUp",
    BULLET: "bullet",
    BACKGROUND: "background",
    COIN: "coin",
    PAUSE: "pause"
};

const CONTROL =
{
    DOWN: "down",
    LEFT: "left",
    RIGHT: "right",
    UP: "up"
};

var RequestAnimFrame = window.requestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.msRequestAnimationFrame;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

var socket;
var canvas;
var canvasContext;
var startTime;
var lastPoint = null;
var players = {};
var thisID;
var gameOver = false;
var controls = {};
var background;
var bullets = {};
const shootDistance = 500;
var images = {};
var coins = {};
var connections = 0;
var playerScore = 0;
var localLives = playerLives;
var sounds = {};
var resourcesLoaded = false;
var cameraTranslation;
var gameState = GAMESTATE.MAINGAME;
var isPaused = false;

//Images
const imgDown = "/assets/down.png";
const imgLeft = "/assets/left.png";
const imgRight = "/assets/right.png";
const imgUp = "/assets/up.png";
const imgBullet = "/assets/bullet.png";
const imgBackground = "/assets/70ssiluette_smal.png";
const imgCoin = "/assets/coin.png";
const imgStarlyDown = "/assets/starly_down_";
const imgStarlyLeft = "/assets/starly_left_";
const imgStarlyRight = "/assets/starly_right_";
const imgStarlyUp = "/assets/starly_up_";
const imgPause = "/assets/pause.png";

//Audio
const audCoin = "/assets/coin.wav";

function AddImage(name, src)
{
    var img = new Image();
    img.src = src;
    images[name] = img;
}

function GetImage(name)
{
    if (images[name] != null)
    {
        return images[name];
    }
    else
    {
        console.log("Image \""+name+"\" doesn't exist.");
    }
}

function AddAudio(name, src)
{
    var audio = new Audio(src);
    sounds[name] = audio;
}

function PlaySound(name)
{
    if (sounds[name] != null)
    {
        sounds[name].play();
    }
    else
    {
        console.log("Sound \""+name+"\" doesn't exist.");
    }
}

function GetMousePosition(mouseEvent)
{
    var mouseX = mouseEvent.clientX - canvas.offsetLeft;
    var mouseY = mouseEvent.clientY - canvas.offsetTop;
    return {x: mouseX, y:mouseY};
}

function GetTouchPosition(touchEvent)
{
    var touchX = touchEvent.touches[0].pageX - canvas.offsetLeft;
    var touchY = touchEvent.touches[0].pageY - canvas.offsetTop;
    return {x:touchX, y:touchY};
}

function Initialisation()
{
    //Getting local canvas element and its canvas rendering context
    canvas = document.getElementById("cvsGame");
    canvasContext = canvas.getContext("2d");
    
    //Setting window input event handlers
    window.addEventListener("resize",ResizeCanvas,false);
    window.addEventListener("orientationchange",ResizeCanvas,false);

    canvas.addEventListener("touchstart",TouchDown,false);
    canvas.addEventListener("mousedown",MouseDown,false);

    canvas.addEventListener("touchmove",TouchMove,true);
    canvas.addEventListener("mousemove",MouseMove,true);

    canvas.addEventListener("touchend",TouchUp,false);
    canvas.addEventListener("mouseup",MouseUp,false);

    document.body.addEventListener("touchcancel",TouchUp,false);

    document.body.addEventListener("keydown", KeyDown);
    document.body.addEventListener("keyup",KeyUp);
    
    //Setting websockets event handlers
    socket = io();
    socket.on("serverconnect", ServerConnect);
    socket.on("spawn", PlayerSpawn);
    socket.on("despawn", PlayerDespawn);
    socket.on("posupdate", PosUpdate);
    socket.on("velupdate", VelUpdate);
    socket.on("setplayer", SetPlayer);
    socket.on("bulletcreated", BulletCreated);
    socket.on("bulletdestroyed", BulletDestroyed);
    socket.on("bulletupdate", BulletUpdate);
    socket.on("coinspawn", CoinSpawn);
    socket.on("coindespawn", CoinDelete);
    socket.on("scorechanged", ScoreChanged);
    socket.on("playershot", PlayerShot);
    socket.on("playerdied", PlayerDied);
}

function ResizeCanvas()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    var cellWidth = canvas.width / 5;
    var cellHeight = canvas.height / 8;
    
    const verticalX = canvas.width/2;
    
    controls["down"].SetDimensions(cellWidth,cellHeight*2);
    controls["left"].SetDimensions(cellWidth*2,cellHeight);
    controls["right"].SetDimensions(cellWidth*2,cellHeight);
    controls["up"].SetDimensions(cellWidth,cellHeight*2);
    
    controls["down"].y = canvas.height - cellHeight;
    controls["down"].x = verticalX;
    
    controls["left"].x = verticalX - (cellWidth * 2);
    controls["left"].y = canvas.height - cellHeight;
    
    controls["right"].x = verticalX + (cellWidth*2);
    controls["right"].y = controls["left"].y;
    
    controls["up"].y = controls["down"].y - (cellHeight*2);
    controls["up"].x = verticalX;
}

function TouchDown(evt)
{
    evt.preventDefault();
    var touchPos = GetTouchPosition(evt);
    DownInteraction(touchPos);
}

function MouseDown(evt)
{
    evt.preventDefault();
    var mousePos = GetMousePosition(evt);
    DownInteraction(mousePos);
}

function TouchMove(evt)
{
    evt.preventDefault();
    var touchPos = GetTouchPosition();
    MoveInteraction(touchPos);
}

function MouseMove(evt)
{
    evt.preventDefault();
    var mousePos = GetMousePosition(evt);
    MoveInteraction(mousePos);
}

function TouchUp(evt)
{
    evt.preventDefault();
    var touchPos = GetTouchPosition();
    UpInteraction(touchPos);
}

function MouseUp(evt)
{
    evt.preventDefault();
    var mousePos = GetMousePosition(evt);
    UpInteraction(mousePos);
}

function KeyDown(e)
{
    switch(e.keyCode)
    {
        case 83: //S
        case 40: //Down
        {
            socket.emit("dirclick","down");
            break;
        }
        case 65: //A
        case 37: //Left
        {
            socket.emit("dirclick","left");
            break;
        }
        case 68: //D
        case 39: //Right
        {
            socket.emit("dirclick","right");
            break;
        }
        case 87: //W
        case 38: //Up
        {
            socket.emit("dirclick","up");
            break;
        }
        case 32: //Space
        {
            //socket=io();
            /*
            var x = players[thisID].x;
            var y = players[thisID].y;
            var dir = new Vector(players[thisID].dX, players[thisID].dY).Normalise();
            socket.emit("shotfired", {x, y}, dir);*/
            break;
        }
    }
}

function KeyUp(e)
{
    switch(e.keyCode)
    {
        case 83: //S
        case 40: //Down
        {
            socket.emit("dirunclick","down");
            break;
        }
        case 65: //A
        case 37: //Left
        {
            socket.emit("dirunclick","left");
            break;
        }
        case 68: //D
        case 39: //Right
        {
            socket.emit("dirunclick","right");
            break;
        }
        case 87: //W
        case 38: //Up
        {
            socket.emit("dirunclick","up");
            break;
        }
    }
    
}

function ServerConnect()
{
    connections++;
    players = {};
    controls = {};
    bullets = {};
    coins = {};
    playerScore = 0;
    localLives = playerLives;
    cameraTranslation = {x:0, y:0};
    if (canvas.getContext)
    {
        startTime = Date.now();
        
        if (!resourcesLoaded)
        {
            AddImage(IMAGE.BTNDOWN,imgDown);
            AddImage(IMAGE.BTNLEFT,imgLeft);
            AddImage(IMAGE.BTNRIGHT,imgRight);
            AddImage(IMAGE.BTNUP,imgUp);
            AddImage(IMAGE.BULLET,imgBullet);
            AddImage(IMAGE.BACKGROUND, imgBackground);
            AddImage(IMAGE.COIN, imgCoin);
            AddImage(IMAGE.PAUSE, imgPause);

            for (var i = 0; i < 3; i++)
            {
                AddImage("starly_down_"+i, imgStarlyDown + i + ".png");
                AddImage("starly_left_"+i,imgStarlyLeft + i + ".png");
                AddImage("starly_right_"+i, imgStarlyRight + i + ".png");
                AddImage("starly_up_"+i, imgStarlyUp + i + ".png");
            }

            AddAudio("coin", audCoin);
        }
                
        var btnDown = new Sprite(IMAGE.BTNDOWN);
        btnDown.clickEvent = function()
        {
            players[thisID].dY = playerSpeed;
        };
        btnDown.mouseUp = function()
        {
            players[thisID].dY = 0;
        };
        
        var btnLeft = new Sprite(IMAGE.BTNLEFT);
        btnLeft.clickEvent = function()
        {
            players[thisID].dX = -playerSpeed;
        };
        btnLeft.mouseUp = function()
        {
            players[thisID].dX = 0;
        };
        
        var btnRight = new Sprite(IMAGE.BTNRIGHT);
        btnRight.clickEvent = function()
        {
            players[thisID].dX = playerSpeed;
        };
        btnRight.mouseUp = function()
        {
            players[thisID].dX = 0;
        };
        
        var btnUp = new Sprite(IMAGE.BTNUP);
        btnUp.clickEvent = function()
        {
            players[thisID].dY = -playerSpeed;
        };
        btnUp.mouseUp = function()
        {
            players[thisID].dY = 0;
        };
        
        controls[CONTROL.DOWN] = btnDown;
        controls[CONTROL.LEFT] = btnLeft;
        controls[CONTROL.RIGHT] = btnRight;
        controls[CONTROL.UP] = btnUp;
        
        background = new Sprite(IMAGE.BACKGROUND);
        background.SetDimensions(1500,898);
        
        GameLoop();
        ResizeCanvas();
        resourcesLoaded = true;
    }
}

function PlayerSpawn(serverPlayer)
{
    var player = new ClientPlayer(serverPlayer);
    players[serverPlayer.playerID] = player;
    console.log(player.playerID+" spawned");
}

function PlayerDespawn(id)
{
    delete players[id];
    console.log(id+" despawned");
}

function PosUpdate(id, x, y)
{
    if (players[id] != null)
    {
        players[id].x = x;
        players[id].y = y;
    }
    else
    {
        console.log("Apparently a player doesn't exist: "+id);
    }
}

function VelUpdate(id, dX, dY)
{
    if (players[id] != null)
    {
        players[id].dX = dX;
        players[id].dY = dY;
    }
    else
    {
        console.log("Apparently a player doesn't exist: "+id);
    }
}

function SetPlayer(id)
{
    thisID = id;
}

function BulletCreated(serverBullet)
{
    console.log("bullet created "+serverBullet.bulletID);
    var bullet = new ClientBullet(serverBullet);
    bullets[bullet.bulletID] = bullet;
}

function BulletDestroyed(id)
{
    delete bullets[id];
}

function BulletUpdate(id, x, y)
{
    if (bullets[id] != null)
    {
        bullets[id].x = x;
        bullets[id].y = y;
    }
}

function CoinSpawn(serverCoin)
{
    var coin = new ClientCoin(serverCoin);
    coins[serverCoin.coinID] = coin;
}

function CoinDelete(id)
{
    delete coins[id];
}

function ScoreChanged(score)
{
    playerScore = score;
    PlaySound("coin");
}

function PlayerShot(playerID, lives)
{
    if (playerID == thisID)
    {
        localLives = lives;
    }
}

function PlayerDied(playerID)
{
    PlayerDespawn(playerID);
}

function GameLoop()
{
    var currentTime = Date.now();
    var delta = (currentTime - startTime)/1000;
    startTime = currentTime;
    Update(delta);
    Render();
    
    RequestAnimFrame(GameLoop);
}

function Update(delta)
{
    switch (gameState)
    {
        case GAMESTATE.MAINGAME:
        {
            for (let p in players)
            {
                players[p].Update(delta);
            }
            for (let b in bullets)
            {
                bullets[b].Update(delta);
            }
            break;
        }
        case GAMESTATE.GAMEOVER:
        {
            break;
        }
    }
}

function Render()
{
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    switch (gameState)
    {
        case GAMESTATE.MAINGAME:
        {
            canvasContext.save();
            var thisPlayer = players[thisID];
            if (thisPlayer != null)
            {
                var cX = (canvas.width - canvas.offsetLeft) / 2;
                var cY = (canvas.height - canvas.offsetTop) / 2;
                cameraTranslation.x = cX - thisPlayer.x;
                cameraTranslation.y = cY - thisPlayer.y;
                canvasContext.translate(cameraTranslation.x, cameraTranslation.y);
                background.Render();
                thisPlayer.Render();
            }
            else
            {
                background.Render();
            }
            for (let p in players)
            {
                if (p != thisID)
                {
                    players[p].Render();
                }
            }
            for (let b in bullets)
            {
                bullets[b].Render();
            }
            for (let c in coins)
            {
                coins[c].Render();
            }
            canvasContext.restore();
            for (let c in controls)
            {
                controls[c].Render();
            }
            StyleText("black","10vw arial","centre","top");
            canvasContext.fillText("Score: " + playerScore, 10, 100);
            canvasContext.fillText("Lives: "+localLives, 10, canvas.height- canvas.offsetTop - 100);
            if (isPaused)
            {
                canvasContext.drawImage(GetImage("pause"),0,0,canvas.width,canvas.height);
            }
            break;
        }
    }
}

function RemoveCameraTranslation(pos)
{
    return {x:pos.x-cameraTranslation.x, y:pos.y-cameraTranslation.y};
}

function DownInteraction(pos)
{
    mouseDown = true;
    adjustedPos = RemoveCameraTranslation(pos);
    var controlClicked = false;
    for (let c in controls)
    {
        if (controls[c].Click(pos))
        {
            console.log(c+" clicked");
            socket.emit("dirclick",c);
            controlClicked = true;
            break;
        }
    }
    if (!controlClicked)
    {
        var x = players[thisID].x;
        var y = players[thisID].y;
        var mX = adjustedPos.x;
        var mY = adjustedPos.y;
        var x2 = (mX - x) * (mX - x);
        var y2 = (mY - y) * (mY - y);
        var d2 = x2 + y2;
        if (d2 <= (shootDistance*shootDistance))
        {
            var v1 = new Vector(mX - x, mY - y);
            v1 = v1.Normalise();
            socket.emit("shotfired",{x,y},{x:v1.x, y:v1.y});
        }
    }
    MoveInteraction(pos);
}


function MoveInteraction(pos)
{
    lastPoint = pos;
}

function UpInteraction(pos)
{
    mouseDown = false;
    for (let c in controls)
    {
        socket.emit("dirunclick",c);
        if (controls[c].mouseUp != null)
        {
            controls[c].mouseUp();
        }
    }
}

function StyleText(colour, font, alignment, baseLine)
{
    canvasContext.fillStyle = colour;
    canvasContext.font = font;
    canvasContext.textAlign = alignment;
    canvasContext.textBaseline = baseLine;
}

class AnimationManager
{
    constructor(name, iters, duration)
    {
        this.frameDuration = duration;
        this.frameTimer = this.frameDuration;
        this.frames = {};
        this.frames["down"] = [];
        this.frames["left"] = [];
        this.frames["right"] = [];
        this.frames["up"] = [];
        for (var i = 0; i < iters; i++)
        {
            this.frames["down"][i] = name+"_down_"+i;
            this.frames["left"][i] = name+"_left_"+i;
            this.frames["right"][i] = name+"_right_"+i;
            this.frames["up"][i] = name+"_up_"+i;
        }
        this.frame = 0;
        this.frameCount = iters;
    }
    GetImage(dir)
    {
        var name = this.frames[dir][this.frame];
        return GetImage(name);
    }
    Update(delta)
    {
        this.frameTimer -= delta;
        if (this.frameTimer <= 0)
        {
            this.frame++;
            this.frame = this.frame % this.frameCount;
            this.frameTimer = this.frameDuration;
        }
    }
}

class Sprite
{
    constructor(imagePath)
    {
        this.clickEvent = null;
        this.mouseUp = null;
        this.imageName = imagePath;
        this.x = 0;
        this.y = 0;
        this.dX = 0;
        this.dY = 0;
        this.useImageWidth = true;
        this.useImageHeight = true;
    }
    GetImage()
    {
        return GetImage(this.imageName);
    }
    Width()
    {
        if (this.useImageWidth)
        {
            return this.GetImage().width;
        }
        return this.width;
    }
    Height()
    {
        if (this.useImageHeight)
        {
            return this.GetImage().height;
        }
        return this.height;
    }
    SetDimensions(w, h)
    {
        this.SetWidth(w);
        this.SetHeight(h);
    }
    SetWidth(w)
    {
        this.width = w;
        this.useImageWidth = false;
    }
    SetHeight(h)
    {
        this.height = h;
        this.useImageHeight = false;
    }
    Click(pos)
    {
        var clickX = pos.x >= this.Left() && pos.x <= this.Right();
        var clickY = pos.y >= this.Bottom() && pos.y <= this.Top();
        var clicked = clickX && clickY;
        if (clicked && this.clickEvent != null)
        {
            this.clickEvent();
        }
        return clicked;
    }
    Left()
    {
        return this.x - (this.Width()/2);
    }
    Right()
    {
        return this.x + (this.Width()/2);
    }
    Bottom()
    {
        return this.y - (this.Height()/2);
    }
    Top()
    {
        return this.y + (this.Height()/2);
    }
    Render()
    {
        canvasContext.drawImage(this.GetImage(), this.Left(), this.Bottom(), this.Width(), this.Height());
    }
    RenderCustom(rX, rY)
    {
        canvasContext.drawImage(this.GetImage(), rX, rY, this.Width(), this.Height());
    }
    Update(delta)
    {
        this.x += this.dX * delta;
        this.y += this.dY * delta;
    }
}

class ClientPlayer extends Sprite
{
    constructor(serverPlayer)
    {
        super("starly_down_0");
        this.animManager = new AnimationManager("starly", 3, 0.5);
        this.x = serverPlayer.x;
        this.y = serverPlayer.y;
        this.dX = serverPlayer.dX;
        this.dY = serverPlayer.dY;
        this.playerID = serverPlayer.playerID;
        this.frameX = 0;
        this.frameY = 0;
        this.frameXMax = 0.5;
        this.frameTimer = this.frameXMax;
        this.SetDimensions(playerWidth, playerHeight);
    }
    Render()
    {
        var dir = "down";
        if (this.dX < 0)
        {
            dir = "left";
        }
        else if (this.dX > 0)
        {
            dir = "right";
        }
        else if (this.dY < 0)
        {
            dir = "up";
        }
        var img = this.animManager.GetImage(dir);
        canvasContext.drawImage(img, this.Left(), this.Bottom(), this.Width(), this.Height());
    }
    Update(delta)
    {
        super.Update(delta);
        this.animManager.Update(delta);
    }
}

class ClientBullet extends Sprite   
{
    constructor(serverBullet)
    {
        super("bullet");
        this.x = serverBullet.x;
        this.y = serverBullet.y;
        console.log("X: "+this.x+"; Y: "+this.y);
        this.dX = serverBullet.dX;
        this.dY = serverBullet.dY;
        console.log("dX: "+this.dX+"; dY: "+this.dY);
        this.bulletID = serverBullet.bulletID;
    }
}

class ClientCoin extends Sprite
{
    constructor(serverCoin)
    {
        super("coin");
        this.x = serverCoin.x;
        this.y = serverCoin.y;
        this.coinID = serverCoin.coinID;
    }
}

class Vector
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
    Normalise()
    {
        var x2 = this.x * this.x;
        var y2 = this.y * this.y;
        var magnitude = Math.sqrt(x2+y2);
        this.x /= magnitude;
        this.y /= magnitude;
        return this;
    }
}