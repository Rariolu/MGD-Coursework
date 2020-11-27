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

var ioConnection = function(socket)
{
    console.log("Client connected.");
    
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