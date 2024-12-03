import { GameManager } from "./classes/GameManager.ts";
import "leaflet/dist/leaflet.css";
import "./style.css";

const game = new GameManager("map");

document.getElementById("north")!.addEventListener("click", () => game.handleMove("north"));
document.getElementById("south")!.addEventListener("click", () => game.handleMove("south"));
document.getElementById("east")!.addEventListener("click", () => game.handleMove("east"));
document.getElementById("west")!.addEventListener("click", () => game.handleMove("west"));

game.spawnCaches();
game.player.loadState();
