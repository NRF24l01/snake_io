const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const ctx = canvas.getContext("2d");
const gameOverText = document.getElementById("gameOver");
const socket = io();
const playerId = Math.random().toString(36).substring(7);
let players = {};
let apples = [];
const appleImage = new Image();
var ga = true;
appleImage.src = "static/apple.png"; // Replace with the URL of your apple sprite
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize nipple.js joystick in dynamic mode
const joystick = nipplejs.create({
  zone: canvas,
  mode: "dynamic",
  color: "blue",
  size: 150,
});

socket.on("connect", () => {
  socket.emit("join", { player_id: playerId });
});

socket.on("player_joined", (data) => {
  console.log(`Player joined: ${data.player_id}`);
});

socket.on("update", (data) => {
  players = data.players;
  apples = data.apples;
  renderGame();
});

socket.on("game_over", (data) => {
  if (data.player_id === playerId) {
    gameOverText.style.display = "block";
    ga = false;
  }
});

socket.on("player_left", (data) => {
  console.log(`Player left: ${data.player_id}`);
});

document.addEventListener("keydown", (event) => {
  if (ga) {
    let direction;
    switch (event.key) {
      case "ArrowUp":
        direction = "UP";
        break;
      case "ArrowDown":
        direction = "DOWN";
        break;
      case "ArrowLeft":
        direction = "LEFT";
        break;
      case "ArrowRight":
        direction = "RIGHT";
        break;
      case "w":
        direction = "UP";
        break;
      case "s":
        direction = "DOWN";
        break;
      case "a":
        direction = "LEFT";
        break;
      case "d":
        direction = "RIGHT";
        break;
    }
    if (direction) {
      socket.emit("move", { player_id: playerId, direction: direction });
    }
  } else {
    window.location.href = "";
  }
});

// Define the game field dimensions
const fieldWidth = 40;
const fieldHeight = 30;

function renderGame() {
  // Calculate the size of each cell
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const cellSize = {
    width: canvas.width / fieldWidth,
    height: canvas.height / fieldHeight,
  };
  console.log(cellSize);

  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw apples
  apples.forEach((apple) => {
    context.drawImage(
      appleImage,
      apple.x * cellSize.width,
      apple.y * cellSize.height,
      cellSize.width,
      cellSize.height
    );
  });

  // Draw players
  for (const [id, player] of Object.entries(players)) {
    context.fillStyle = player.color;
    context.fillRect(
      player.x * cellSize.width,
      player.y * cellSize.height,
      cellSize.width,
      cellSize.height
    );

    // Draw tail
    player.tail.forEach((segment) => {
      context.fillRect(
        segment.x * cellSize.width,
        segment.y * cellSize.height,
        cellSize.width,
        cellSize.height
      );
    });

    // Draw snake length
    context.fillStyle = "white";
    context.fillText(
      `Length: ${player.length}`,
      player.x * cellSize.width,
      player.y * cellSize.height - 10
    );
  }
}

// Function to draw the joystick direction on the canvas
function drawJoystick(baseX, baseY, frontX, frontY) {
  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the joystick base
  ctx.beginPath();
  ctx.arc(baseX, baseY, 50, 0, 2 * Math.PI); // Base circle
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw the line from base to front
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(frontX, frontY);
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw the joystick front
  ctx.beginPath();
  ctx.arc(frontX, frontY, 20, 0, 2 * Math.PI); // Front circle
  ctx.fillStyle = "blue";
  ctx.fill();
}

// Handle joystick movements
joystick.on("move", function (evt, data) {
  if (ga) {
    const baseX = data.instance.position.x;
    const baseY = data.instance.position.y;
    const frontX = data.position.x;
    const frontY = data.position.y;
    drawJoystick(baseX, baseY, frontX, frontY);
  } else {
    window.location.href = "";
  }
});

// Handle joystick end
joystick.on("end", function () {
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Handle joystick direction changes
joystick.on("dir:up dir:right dir:down dir:left", function (evt, data) {
  var direction = data.direction.angle;
  sendDirection(direction);
});

// Function to handle sending the direction
function sendDirection(direction) {
  console.log("Direction:", direction);
  switch (direction) {
    case "right":
      socket.emit("move", { player_id: playerId, direction: "RIGHT" });
      break;
    case "left":
      socket.emit("move", { player_id: playerId, direction: "LEFT" });
      break;
    case "up":
      socket.emit("move", { player_id: playerId, direction: "UP" });
      break;
    case "down":
      socket.emit("move", { player_id: playerId, direction: "DOWN" });
      break;
  }
}
