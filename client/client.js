const display = document.getElementById("canvas");
const context = display.getContext("2d");
const socket = io();

const gridSize = 1000;

let displaySize = display.width = display.height = Math.min(window.innerWidth, window.innerHeight) * 2;
let blockSize = displaySize / gridSize;
let splashMessage = '';
display.style.width = (displaySize / 2) + "px";
display.style.height = (displaySize / 2) + "px";
let playing = false;


let spinnerBlue = new Image();
spinnerBlue.src = './spinner-blue.svg';
let spinnerRed = new Image();
spinnerRed.src = './spinner-red.svg';
let fire = new Image();
fire.src = './fire.png';
let eggplant = new Image();
eggplant.src = './eggplant.png';
let potato = new Image();
potato.src = './potato.png';
let wind = new Image();
wind.src = './wind.png';

let hits = {};
let rotation = 0;
let spinners = [];
let powerup;
let name = '';


socket.on("update", function (data) {
    splashMessage = '';
    spinners = data.spinners;
    powerup = data.powerup;
});

socket.on('startGame', function (data) {
    playing = true;
});

socket.on('win', function () {
    playing = false;
    context.clearRect(0, 0, displaySize, displaySize);
    splash('👍😃🌝 You won! Waiting for new game...');
    setTimeout(function () {
        socket.emit('waitForGame', name);
    }, 2000);
})

socket.on('lose', function () {
    playing = false;
    context.clearRect(0, 0, displaySize, displaySize);
    splash('👎⚰️🚒 :( Waiting for new game...');
    setTimeout(function () {
        socket.emit('waitForGame', name);
    }, 2000);
})

socket.on('hit', function (coordinates) {
    hits.timer = 50;
    hits.x = coordinates.x;
    hits.y = coordinates.y;
})

let keys = {};
const converter = {
    38: 'w', 87: 'w',
    40: 's', 83: 's',
    37: 'a', 65: 'a',
    39: 'd', 68: 'd'
}

document.onkeydown = function (event) {
    if (converter[event.keyCode]) {
        event = event || window.event;
        keys[converter[event.keyCode]] = true;
        const keysPressed = Object.keys(keys).sort().join('');
        socket.emit('keyPress', keysPressed);
    }
};

document.onkeyup = function (event) {
    if (converter[event.keyCode]) {
        event = event || window.event;
        delete keys[converter[event.keyCode]];
    }
}

window.onresize = function () {
    displaySize = display.width = display.height = Math.min(window.innerWidth, window.innerHeight) * 2;
    blockSize = displaySize / gridSize;
    display.style.width = (displaySize / 2) + "px";
    display.style.height = (displaySize / 2) + "px";
};

function drawSpinner(spinner, image) {
    context.save();
    let x = spinner.x * blockSize;
    let y = spinner.y * blockSize;
    let w = spinner.radius * 2 * blockSize;
    let h = spinner.radius * 2 * blockSize;
    context.translate(x, y);
    rotation += spinner.dtheta;
    context.rotate(rotation * Math.PI / 180);
    context.translate(-x, -y);
    context.drawImage(image, x - w / 2, y - h / 2, w, h);
    context.restore();
    if (spinner.name) {
        console.log(spinner.name);
        context.font = '30px Comic Sans MS';
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        context.textAlign = 'center';
        context.fillText(spinner.name, x, y + h * 3 / 5);
    }
}

function drawPowerup(powerup) {
    if (powerup) {
        let image;
        switch (powerup.type) {
            case 'eggplant':
                image = eggplant;
                break;
            case 'potato':
                image = potato;
                break;
            case 'wind':
                image = wind;
                break;
        }
        let x = powerup.x * blockSize;
        let y = powerup.y * blockSize;
        let w = 60 * blockSize;
        let h = 60 * blockSize;
        context.drawImage(image, x - w / 2, y - h / 2, w, h);
    }
}

function splash(message) {
    splashMessage = message;
}

function displaySplash() {
    context.font = '50px Comic Sans MS';
    context.fillStyle = 'rgb(255,0,0)';
    context.textAlign = 'center';
    context.fillText(splashMessage, 500 * blockSize, 500 * blockSize);
}

function frame() {
    context.clearRect(0, 0, displaySize, displaySize);
    if (spinners.length > 0) {
        drawSpinner(spinners[1], spinnerRed);
        drawSpinner(spinners[0], spinnerBlue);
        if(spinners.length > 2) {
            drawSpinner(spinners[2], spinnerRed);
            drawSpinner(spinners[3], spinnerRed);
        }
        if (hits.timer-- > 0) {
            context.drawImage(fire, (hits.x - 40) * blockSize, (hits.y - 40) * blockSize, 80 * blockSize, 80 * blockSize);
        }
    }
    if (powerup) {
        drawPowerup(powerup);
    }
    displaySplash();
    context.fill();
    requestAnimationFrame(frame);
}

function play() {
    let modal = document.getElementById('modal');
    let input = document.getElementById('name');
    modal.style.display = 'none';
    context.clearRect(0, 0, displaySize, displaySize);
    splash('Waiting for game... ⏳');
    name = input.value;
    socket.emit('waitForGame', name);
    frame();
};