const minX = -2000;
const maxX = 2000;
const minY = -2000;
const maxY = 2000;
const coinTime = 50;
const coinRadius = 300;
const bulletRange = 500;
const bulletSpeed = 100;
const bulletTime = 4;
const bulletRadius = 250;
const coinSpawnProb = 0.0005;
const playerSpeed = 300;
const playerLives = 3;
const playerWidth = 200;
const playerHeight = 200;

const SOCKET_EVENT = 
{
    SERVER_CONNECT: "serverconnect",
    SPAWN: "spawn",
    DESPAWN: "despawn",
    POS_UPDATE: "posupdate",
    VEL_UPDATE: "velupdate",
    SET_PLAYER_ID: "setplayer",
    BULLET_CREATED: "bulletcreated",
    BULLET_DESTROYED: "bulletdestroyed",
    BULLET_UPDATE: "bulletupdate",
    COIN_SPAWN: "coinspawn",
    COIN_DESPAWN: "coindespawn",
    SCORE_CHANGED: "scorechanged",
    PLAYER_SHOT: "playershot",
    PLAYER_DIED: "playerdied",
    DIR_CLICK: "dirclick",
    DIR_UNCLICK: "dirunclick",
    SHOT_FIRED: "shotfired",
    CONNECTION: "connection",
    DISCONNECTION: "disconnect",
    SEND_NICKNAME: "sendnickname"
};

if (typeof process === 'object')
//Check if the script is running on the server
{
    exports.minX = minX;
    exports.maxX = maxX;
    exports.minY = minY;
    exports.maxY = maxY;
    exports.coinTime = coinTime;
    exports.coinRadius = coinRadius;
    exports.bulletRange = bulletRange;
    exports.bulletSpeed = bulletSpeed;
    exports.coinSpawnProb = coinSpawnProb;
    exports.playerSpeed = playerSpeed;
    exports.bulletTime = bulletTime;
    exports.bulletRadius = bulletRadius;
    exports.playerLives = playerLives;
    exports.playerWidth = playerWidth;
    exports.playerHeight = playerHeight;
    exports.SOCKET_EVENT = SOCKET_EVENT;
}