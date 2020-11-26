var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var fs = require("fs");

const bodyParser = require('body-parser');

var playerCount = 0;
//var openIDs = [];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



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

var ioConnection = function(socket)
{
    console.log("Client connected.");
    SendPage("./intro.html", socket);
    
    var startGame = function(nickname)
    {
        SendPage("./maingame.html",socket);
        console.log(nickname);
        socket.emit("nickname",nickname);
    };
    
    socket.on("startgame", startGame);
    
    var ioDisconnection = function()
    {
        console.log("Client disconnected.");
        
    };
    socket.on("disconnect",ioDisconnection);
};

io.on("connection",ioConnection);

var main = function()
{
    console.log("Listening on 3000.");
}

http.listen(3000,main);