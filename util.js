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
}