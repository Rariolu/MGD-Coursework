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
        
        
        startTime = Date.now();
        

        btnDown = new Sprite("/down.png");

        
        btnLeft = new Sprite("/left.png");

        
        btnRight = new Sprite("/right.png");

        
        btnUp = new Sprite("/up.png");

        
        controls["down"] = btnDown;
        controls["left"] = btnLeft;
        controls["right"] = btnRight;
        controls["up"] = btnUp;
        
        background = new Sprite("/70ssiluette.png");
        background.x = -(background.Width()/2);
        background.y = -(background.Height()/2);
        
        ResizeCanvas();
        GameLoop();
    }
    socket = io();
    socket.on("spawn", PlayerSpawn);
    socket.on("despawn", PlayerDespawn);
    socket.on("posupdate", PosUpdate);
    socket.on("velupdate", VelUpdate);
    socket.on("setplayer", SetPlayer);
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

class Sprite
{
    constructor(imagePath)
    {
        this.image = new Image();
        this.image.src = imagePath;
        this.x = 0;
        this.y = 0;
        this.dX = 0;
        this.dY = 0;
        this.useImageWidth = true;
        this.useImageHeight = true;
    }
    Width()
    {
        if (this.useImageWidth)
        {
            return this.image.width;
        }
        return this.width;
    }
    Height()
    {
        if (this.useImageHeight)
        {
            return this.image.height;
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
        return clickX && clickY;
    }
    Left()
    {
        return this.x;
    }
    Right()
    {
        return this.x + this.Width();
    }
    Bottom()
    {
        return this.y;
    }
    Top()
    {
        return this.y + this.Height();
    }
    Render()
    {
        canvasContext.drawImage(this.image, this.x, this.y, this.Width(), this.Height());
    }
    RenderCustom(rX, rY)
    {
        canvasContext.drawImage(this.image, rX, rY, this.Width(), this.Height());
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
        super("70sRowlette.png");
        this.x = serverPlayer.x;
        this.y = serverPlayer.y;
        this.dX = serverPlayer.dX;
        this.dY = serverPlayer.dY;
        this.playerID = serverPlayer.playerID;
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
    
    btnDown.y = canvas.height - btnDown.Height();
    btnDown.x = verticalX;
    
    btnLeft.x = verticalX - btnLeft.Width();
    btnLeft.y = btnDown.y - (btnDown.Height()/2);
    
    btnRight.x = verticalX + btnRight.Width();
    btnRight.y = btnLeft.y;
    
    btnUp.y = btnDown.y - btnUp.Height();
    btnUp.x = verticalX;
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

var shootDistance = 150;
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
        if (d2 <= shootDistance*shootDistance)
        {
            var v1 = new Vector(pos.x - x, pos.y - y);
            v1.normalize();
            
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