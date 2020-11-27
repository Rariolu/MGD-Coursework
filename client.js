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
var gameOver = false;
var controls = [];
var btnDown;
var btnLeft;
var btnRight;
var btnUp;

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
        
        ResizeCanvas();
        startTime = Date.now();
        
        const verticalX = canvas.width/2;
        btnDown = new Sprite("/down.png");
        //btnDown.SetDimensions(10,10);
        btnDown.y = canvas.height - btnDown.Height();
      
      
        //btnDown.y = (canvas.height - canvas.offsetTop);
        btnDown.x = verticalX;
        btnLeft = new Sprite("/left.png");
        btnLeft.x = 
        //btnRight = new Sprite("/right.png");
        btnUp = new Sprite("/up.png");
        btnUp.y = btnDown.y - btnUp.Height();
        //btnUp.y = btnDown.y - btnUp.Height();
        //btnUp.y = -(canvas.height-canvas.offsetTop);
        btnUp.x = verticalX;
        controls["down"] = btnDown;
        controls["left"] = btnLeft;
        //controls["right"] = btnRight;
        controls["up"] = btnUp;
        
        GameLoop();
    }
    socket = io();
    socket.on("spawn", PlayerSpawn);
    socket.on("despawn", PlayerDespawn);
    socket.on("posupdate", PosUpdate);
    socket.on("velupdate", VelUpdate);
}

function PosUpdate(id, x, y)
{
    players[id].x = x;
    players[id].y = y;
    console.log("posupdate");
}

function VelUpdate(id, dX, dY)
{
    players[id].dX = dX;
    players[id].dY = dY;
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
}

function PlayerDespawn(id)
{
    delete players[id];
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
    //btnUp.y += 3 * delta;
    //console.log("btnUp.y: "+btnUp.y+" canvas.height: "+canvas.height);
}

function Render()
{
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    for (let p in players)
    {
        players[p].Render();
    }
    for (let c in controls)
    {
        controls[c].Render();
    }
}

function ResizeCanvas()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
    for (let c in controls)
    {
        if (controls[c].Click(pos))
        {
            console.log(c+" clicked");
            socket.emit("dirclick",c);
            break;
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