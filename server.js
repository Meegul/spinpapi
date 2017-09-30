const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use("*", function (req, res, next) {
    if (process.env.NODE_ENV === 'production')
        if (req.headers['x-forwarded-proto'] != 'https')
            return res.redirect('https://' + req.headers.host + req.url);
        else
            return next();
    else
        return next();
});
app.use(express.static(__dirname + "/client"));
app.all("*", function (req, res) {
    res.redirect("/");
});

server.listen(port, function () {
    console.log("Server running at port %s", port);
});

const gridSize = 40;
let clients = {};
let spinners = {};
let gameInProgress = false;
let clientsWaiting = [];
let clientsPlaying = {};

io.on("connection", function (client) {
    console.log("Client " + client.id + " has connected.");
    client.isConnected = true;
    client.isPlaying = false;
	clients[client.id] = client;
	client.on('waitForGame', function() {
		console.log(`Client ${client.id} has started waiting for a game`);
		clientsWaiting.push(client.id);
	});
    client.on("joinGame", function (spinner) {
        console.log("Client " + client.id + " has joined the game.");
		client.isPlaying = true;
		spinner.x = 0;
		spinner.y = 0;
		spinner.dx = 0;
		spinner.dy = 0;
		spinners[client.id] = spinner;
    });
    client.on("keyPress", function (key) {
        if (client.isPlaying) {
			spinners[client.id].directionRequest = key;
			//console.log(`Got a keypress, ${key} from client ${client.id}`);
        }
    });
    client.on("disconnect", function () {
        console.log("Client " + client.id + " has disconnected.");
        client.isConnected = false;
        if (client.isPlaying) {
            console.log("Client " + client.id + " has left the game.");
            client.isPlaying = false;
        }
    });
});

function updateSpinner(spinner) {
	//Todo update info of given spinner
	//calculate physics
	//detect collisions
	//console.log(spinner.directionRequest);
	switch (spinner.directionRequest) {
	case 'w':
		spinner.dy += 1;
		break;
	case 's':
		spinner.dy -= 1;
		break;
	case 'a':
		spinner.dx -= 1;
		break;
	case 'd':
		spinner.dx += 1;
		break;
	default: break; 
	}
	const speed = Math.sqrt(spinner.dx * spinner.dx + spinner.dy * spinner.dy);
	const terminalVelocity = 10;
	if (speed > terminalVelocity) {
		spinner.dx *= terminalVelocity / speed;
		spinner.dy *= terminalVelocity / speed;
	}
	spinner.directionRequest = undefined;
	spinner.x += spinner.dx;
	spinner.y += spinner.dy;
}

setInterval(function () {
	if (gameInProgress) {
		for (var key in spinners) {
			if (clients[key].isPlaying)
				updateSpinner(spinners[key]);
			//console.log(`Updated spinner ${key}`);
		}
		for (var key in clients) {
			clients[key].emit('update', {spinners});
			//console.log(`Updated client ${key}`);
		}
	} else {
		if (clientsWaiting.length > 1) {
			const [clientIdA, clientIdB] = clientsWaiting.splice(0, 2);
			const playerA = clients[clientIdA];
			const playerB = clients[clientIdB];
			playerA.isPlaying = true;
			playerB.isPlaying = true;
			gameInProgress = true;
			playerA.emit('startGame');
			playerB.emit('startGame');
		}
	}
}, 40);
