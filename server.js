var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
const bodyParser = require('body-parser');

var playerCount = 0;
var openIDs = [];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



var introScreen = function(req, res)
{
    res.sendFile(__dirname+"/intro.html");
};

app.get("/",introScreen);

var mainGame = function(req, res)
{
    var nickname = req.query.nickname;
    if (nickname != null)
    {
        console.log("Nickname: "+nickname);
        openIDs.push({playerNickname:nickname, playerID:playerCount++});
    }
    res.sendFile(__dirname+"/maingame.html");
};

app.get("/maingame", mainGame);

var gameover = function(req, res)
{
    res.sendFile(__dirname+"/gameover.html");
};

app.get("/gameover",gameover);

var miscURL = function(req,res)
{
    console.log(req.url);
    res.sendFile(__dirname+req.url);
};

app.get("/*",miscURL);

var ioConnection = function(socket)
{
    console.log("Client connected.");
    if (openIDs.length > 0)
    {
        var id = openIDs.shift();
        console.log("client's nickname is now "+id.playerNickname+"; id is "+id.playerID);
    }
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