var RequestAnimFrame = window.requestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.msRequestAnimationFrame;
var socket;
var canvas;
var canvasContext;
var startTime;
var lastPoint = null;
var players = [];
var thisID;
//var thisPlayer;
var gameOver = false;
var controls = [];
var btnDown;
var btnLeft;
var btnRight;
var btnUp;
var background;
var bullets = [];
const shootDistance = 150;
var images = {};
const playerSpeed = 100;
var coins = {};

function Initialisation()
{
    canvas = document.getElementById("cvsGame");
    canvasContext = canvas.getContext("2d");
    if (canvas.getContext)
    {
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
        
        startTime = Date.now();
        
        AddImage("btnDown","/down.png");
        AddImage("btnLeft","/left.png");
        AddImage("btnRight","/right.png");
        AddImage("btnUp","/up.png");
        //AddImage("player","/70sRowlette.png");
        AddImage("player","/starly.png");
        AddImage("bullet","/bullet.png");
        AddImage("background","/70ssiluette.png");
        AddImage("coin","/coin.png");
        
        btnDown = new Sprite("btnDown");
        btnDown.clickEvent = function()
        {
            players[thisID].dY = playerSpeed;
        };
        btnDown.mouseUp = function()
        {
            players[thisID].dY = 0;
        };
        
        btnLeft = new Sprite("btnLeft");
        btnLeft.clickEvent = function()
        {
            players[thisID].dX = -playerSpeed;
        };
        btnLeft.mouseUp = function()
        {
            players[thisID].dX = 0;
        };
        
        btnRight = new Sprite("btnRight");
        btnRight.clickEvent = function()
        {
            players[thisID].dX = playerSpeed;
        };
        btnRight.mouseUp = function()
        {
            players[thisID].dX = 0;
        };
        
        btnUp = new Sprite("btnUp");
        btnUp.clickEvent = function()
        {
            players[thisID].dY = -playerSpeed;
        };
        btnUp.mouseUp = function()
        {
            players[thisID].dY = 0;
        };
        
        controls["down"] = btnDown;
        controls["left"] = btnLeft;
        controls["right"] = btnRight;
        controls["up"] = btnUp;
        
        background = new Sprite("background");
        //background = new Sprite("/70ssiluette.png");
        //background.x = -(background.Width()/2);
        //background.y = -(background.Height()/2);
        
        ResizeCanvas();
        GameLoop();
    }
    socket = io();
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




function CoinSpawn(serverCoin)
{
    var coin = new ClientCoin(serverCoin);
    coins[serverCoin.coinID] = coin;
}

function CoinDelete(id)
{
    delete coins[id];
}

function AddImage(name, src)
{
    var img = new Image();
    img.src = src;
    images[name] = img;
}

function GetImage(name)
{
    return images[name];
}

function BulletUpdate(id, x, y)
{
    console.log("attempting to update "+id);
    if (bullets[id] != null)
    {
        bullets[id].x = x;
        bullets[id].y = y;
    }
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

function SetPlayer(id)
{
    thisID = id;
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
    //if (id != thisID)
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
}

class Sprite
{
    constructor(imagePath)
    {
        this.clickEvent = null;
        this.mouseUp = null;
        //this.image = new Image();
        //this.image.src = imagePath;
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
        //canvasContext.drawImage(this.image, this.Left(), this.Bottom(), this.Width(), this.Height());
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
        super("player");
        //super("70sRowlette.png");
        this.x = serverPlayer.x;
        this.y = serverPlayer.y;
        this.dX = serverPlayer.dX;
        this.dY = serverPlayer.dY;
        this.playerID = serverPlayer.playerID;
        this.frameX = 0;
        this.frameY = 0;
        this.frameXMax = 0.5;
        this.frameTimer = this.frameXMax;
    }
    AnimationFrame(delta)
    {
        this.frameTimer -= delta;
        if (this.frameTimer <= 0)
        {
            this.frameTimer = this.frameXMax;
            this.frameX++;
            this.frameX = this.frameX % 3;
        }
    }
    Render()
    {
        if (this.dX < 0)
        {
            this.frameY = 2;
        }
        else if (this.dX > 0)
        {
            this.frameY = 3;
        }
        else if (this.dY < 0)
        {
            this.frameY = 1;
        }
        else
        {
            this.frameY = 0;
        }
        const spriteWidth = 20;
        const spriteHeight = 35;
        var tempX = spriteWidth * this.frameX;
        var tempY = spriteHeight * this.frameY;
        canvasContext.drawImage(this.GetImage(), tempX, tempY, spriteWidth, spriteHeight, this.Left(), this.Bottom(), 200, 350);
    }
    Update(delta)
    {
        super.Update(delta);
        this.AnimationFrame(delta);
    }
}

class ClientBullet extends Sprite   
{
    constructor(serverBullet)
    {
        super("bullet");
        //super("/bullet.png");
        this.x = serverBullet.x;
        this.y = serverBullet.y;
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
    for (let p in players)
    {
        players[p].Update(delta);
    }
    for (let b in bullets)
    {
        bullets[b].Update(delta);
    }
}

function Render()
{
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.save();
    var thisPlayer = players[thisID];
    if (thisPlayer != null)
    {
        var cX = (canvas.width - canvas.offsetLeft) / 2;
        var cY = (canvas.height - canvas.offsetTop) / 2;
        canvasContext.translate(cX-thisPlayer.x, cY-thisPlayer.y);
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
}

function ResizeCanvas()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const verticalX = canvas.width/2;
    
    controls["down"].y = canvas.height - btnDown.Height();
    controls["down"].x = verticalX;
    
    controls["left"].x = verticalX - btnLeft.Width();
    controls["left"].y = btnDown.y - (btnDown.Height()/2);
    
    controls["right"].x = verticalX + btnRight.Width();
    controls["right"].y = btnLeft.y;
    
    controls["up"].y = btnDown.y - btnUp.Height();
    controls["up"].x = verticalX;
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

var blep = true;


function DownInteraction(pos)
{
    mouseDown = true;
    if (gameOver)
    {
        return;
    }
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
        var x2 = (pos.x - x) * (pos.x - x);
        var y2 = (pos.y - y) * (pos.y - y);
        var d2 = x2 + y2;
        if (true)//(d2 <= (shootDistance*shootDistance))
        {
            console.log("shot attempt");
            //var v1 = new Vector(pos.x - x, pos.y - y);
            //v1 = v1.normalize();
            var v1 = {x:1, y:0};
            socket.emit("shotfired",{x,y}, {x:v1.x, y:v1.y});
        }
        else
        {
            console.log("d2: "+d2+" sd: "+(shootDistance*shootDistance));
        }
    }
    MoveInteraction(pos);
}

var Vector = function(x,y)
{
    this.x = x;
    this.y = y;
} 

Vector.prototype.normalize = function()
{
    var length = Math.sqrt(this.x*this.x+this.y*this.y); //calculating length
    this.x = this.x/length; //assigning new value to x (dividing x by length of the vector)
    this.y= this.y/length; //assigning new value to y
    return this;
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

function MouseDown(evt)
{
    evt.preventDefault();
    var mousePos = GetMousePosition(evt);
    DownInteraction(mousePos);
}

function TouchDown(evt)
{
    evt.preventDefault();
    var touchPos = GetTouchPosition(evt);
    DownInteraction(touchPos);
}

function MouseMove(evt)
{
    evt.preventDefault();
    var mousePos = GetMousePosition(evt);
    MoveInteraction(mousePos);
}

function TouchMove(evt)
{
    evt.preventDefault();
    var touchPos = GetTouchPosition();
    MoveInteraction(touchPos);
}

function MouseUp(evt)
{
    evt.preventDefault();
    var mousePos = GetMousePosition(evt);
    UpInteraction(mousePos);
}

function TouchUp(evt)
{
    evt.preventDefault();
    var touchPos = GetTouchPosition();
    UpInteraction(touchPos);
}