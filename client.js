var socket;
var gamePage;
var RequestAnimFrame = window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame;

//game
var startTime;
var gameInstance;

class Sprite
{
    constructor(imagePath)
    {
        this.image = new Image();
        this.image.src = imagePath;
        this.x = 0;
        this.y = 0;
    }
    Render(canvasContext)
    {
        canvasContext.drawImage(this.image, this.x, this.y);
    }
    Update(delta)
    {
        
    }
}

class ClientPlayer extends Sprite
{
    constructor(serverPlayer)
    {
        super("/70sRowlette.png");
        this.x = serverPlayer.x;
        this.y = serverPlayer.y;
    }
}

class Game
{
    constructor()
    {
       
        this.players = [];
        startTime = Date.now();
        this.initialised = false;
        console.log(this.initialised);
        //WaitForElement("cvsGame");
        this.GameLoop();
         //var resizeCanvas = this.ResizeCanvas;
         //var gameloop = this.GameLoop;
         /*console.log("fjriofjriofjroifjriojfrio");
         var initialiseCanvasAndStartLoop = setInterval(function() 
         {
             console.log("lbep");
             var localCanvas = document.getElementById("cvsGame");
            //GetGameInstance().canvas = document.getElementById("cvsGame");
            if (localCanvas != null)
            {
                GetGameInstance().canvas = localCanvas;
                console.log("cvsGame not null");
                clearInterval(initialiseCanvasAndStartLoop);
                GetGameInstance().canvasContext = GetGameInstance().canvas.getContext("2d");
                //this.ResizeCanvas();
                //this.GameLoop();
                //resizeCanvas();
                GetGameInstance().canvas.width = window.innerWidth;
                GetGameInstance().canvas.height = window.innerHeight;
                gameloop();
                console.log("all successful");
               
            }
         }, 100);*/

    }
    GameLoop()
    {
        console.log("i");
        if (this.initialised == true)
        {
            var currentTime = Date.now();
            var delta = (currentTime - startTime)/1000;
            startTime = currentTime;
            this.Update(delta);
            this.Render();
        }
        else
        {
            var cvs = document.getElementById("cvsGame");
            if (cvs != null)
            {
                this.Initialise(cvs);
            }
            else
            {
                console.log("cvsGame doesn't exist yet.");    
            }
        }
        RequestAnimFrame(this.GameLoop);
    }
    PlayerSpawn(serverPlayer)
    {
        var player = new ClientPlayer(serverPlayer);
        this.players[serverPlayer.playerID] = player;
    }
    PlayerDespawn(id)
    {
        delete this.players[id];
    }
    Render()
    {
        console.log("Render");
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let p in this.players)
        {
            this.players[p].Render(this.canvasContext);
        }
    }
    ResizeCanvas()
    {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    Update(delta)
    {
        for (let p in this.players)
        {
            this.players[p].Update(delta);
        }
    }
    Initialise(cvs)
    {
        console.log("initialiser");
        this.initialised = true;
        this.canvas = cvs;
        this.canvasContext = this.canvas.getContext("2d");
        this.ResizeCanvas();
        //this.GameLoop();
    }
}



function Initialisation()
{
    console.log("Initialisation");
    gamePage = document.getElementById("gamepage");
    
    socket = io();
    socket.on("pageContents",LoadPageContents);
    socket.on("spawn", PlayerSpawn);
    socket.on("despawn", PlayerDespawn);
    socket.on("waitforelement", WaitForElement);
    socket.on("begingameloop", BeginGameLoop);
}

function BeginGameLoop()
{
    //GetGameInstance().GameLoop();
}

function WaitForElement(elementID)
{
    var waitForElement;
    var wfe = function()
    {
        var element = document.getElementById(elementID);
        if (element != null)
        {
            clearInterval(waitForElement);
            socket.emit("elementloaded",elementID);
            
            /*switch(elementID)
            {
                case "cvsGame":
                {
                    GetGameInstance().Initialise(element);
                    break;
                }
            }*/
        }
    }
    waitForElement = setInterval(wfe,100);
}

function LoadPageContents(page)
{
    gamePage.innerHTML = page;
}

function GamePageLoaded()
{
    console.log("game page loaded");
    socket.emit("gamepageloaded");
}

function btnSubmit_Click()
{
    var nickname = document.getElementById("tbNickname").value;

    socket.emit("startgame",nickname);
}

function GetGameInstance()
{
    if (gameInstance == null)
    {
        return gameInstance = new Game();
    }
    return gameInstance;
}

function PlayerSpawn(serverPlayer)
{
    GetGameInstance().PlayerSpawn(serverPlayer);
}

function PlayerDespawn(id)
{
    GetGameInstance().PlayerDespawn(id);
}