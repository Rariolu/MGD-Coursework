var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

var introScreen = function(req, res)
{
    res.sendFile(__dirname+"/intro.html");
}

app.get("/",introScreen);

var main = function()
{
    console.log("Listening on 3000.");
}

http.listen(3000,main);