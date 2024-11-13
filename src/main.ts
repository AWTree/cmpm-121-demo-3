import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import luck from "./luck.ts";

// Constants
const INITIAL_POSITION = leaflet.latLng(36.98949379578401, -122.06277128548504);
const TILE_SIZE = 1e-4;
const NEIGHBORHOOD_RADIUS = 8;
const CACHE_PROBABILITY = 0.1;
let playerInventory: string[] = [];
let playerPosition = INITIAL_POSITION;
let movementHistory: leaflet.LatLng[] = [playerPosition];
let geolocationWatchId: number | null = null;

// Initialize Map
const map = leaflet.map("map", {
    center: INITIAL_POSITION,
    zoom: 19,
    zoomControl: false
});
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

// Player Marker and Movement Polyline
const playerMarker = leaflet.marker(playerPosition).addTo(map);
const movementPolyline = leaflet.polyline(movementHistory, { color: '#4C9BE4' }).addTo(map);

// Status Panel and Inventory Elements
const statusPanel = document.getElementById("statusPanel")!;
const inventoryList = document.getElementById("inventoryList")!;

// Helper function to convert coordinates to grid
function getGridCoordinates(lat: number, lng: number): { i: number; j: number } {
    return { i: Math.floor(lat * 1e4), j: Math.floor(lng * 1e4) };
}

// Update status display
function updateStatus() {
    const positionText = `Position: ${playerPosition.lat.toFixed(5)}, ${playerPosition.lng.toFixed(5)}`;
    statusPanel.innerHTML = `${positionText} <button id="copyBtn">Copy Position</button>`;

    // Copy Position Button
    document.getElementById("copyBtn")!.addEventListener("click", () => {
        navigator.clipboard.writeText(positionText).then(() => alert("Position copied!")).catch(err => console.error("Copy failed: ", err));
    });
}

// Update inventory display
function updateInventory() {
    inventoryList.innerHTML = "";
    playerInventory.forEach(coinId => {
        const li = document.createElement("li");
        li.innerHTML = `🪙 ${coinId}`;
        li.addEventListener("click", () => centerOnCoinHome(coinId)); // Center on coin's home cache
        inventoryList.appendChild(li);
    });
}

// Move player
function movePlayer(latOffset: number, lngOffset: number) {
    playerPosition = leaflet.latLng(playerPosition.lat + latOffset * TILE_SIZE, playerPosition.lng + lngOffset * TILE_SIZE);
    updatePosition();
}

// Update player position and render on map
function updatePosition() {
    playerMarker.setLatLng(playerPosition);
    map.setView(playerPosition);
    movementHistory.push(playerPosition);
    movementPolyline.setLatLngs(movementHistory); // Update movement polyline
    updateStatus();
    saveGameState();
}

// Enable automatic position updates via geolocation
function startGeolocationTracking() {
    if (navigator.geolocation) {
        geolocationWatchId = navigator.geolocation.watchPosition(
            (position) => {
                playerPosition = leaflet.latLng(position.coords.latitude, position.coords.longitude);
                updatePosition();
            },
            (error) => alert("Geolocation error: " + error.message),
            { enableHighAccuracy: true }
        );
    } else {
        alert("Geolocation not supported on this device.");
    }
}

// Stop geolocation tracking
function stopGeolocationTracking() {
    if (geolocationWatchId !== null) {
        navigator.geolocation.clearWatch(geolocationWatchId);
        geolocationWatchId = null;
    }
}

// Center map on the home cache of a specific coin
function centerOnCoinHome(coinId: string) {
    const [i, j] = coinId.split("#")[0].split(":").map(Number);
    const lat = i / 1e4;
    const lng = j / 1e4;
    map.setView([lat, lng], 19);
}

// Generate caches
function spawnNearbyCaches() {
    for (let i = -NEIGHBORHOOD_RADIUS; i <= NEIGHBORHOOD_RADIUS; i++) {
        for (let j = -NEIGHBORHOOD_RADIUS; j <= NEIGHBORHOOD_RADIUS; j++) {
            const lat = playerPosition.lat + i * TILE_SIZE;
            const lng = playerPosition.lng + j * TILE_SIZE;
            const { i: gridI, j: gridJ } = getGridCoordinates(lat, lng);
            const cacheId = `${gridI}:${gridJ}`;

            if (luck(cacheId) < CACHE_PROBABILITY) {
                const coinCount = Math.floor(luck(cacheId + "-coins") * 5) + 1;
                createCache(lat, lng, gridI, gridJ, coinCount);
            }
        }
    }
}

// Create cache and coins
function createCache(lat: number, lng: number, gridI: number, gridJ: number, initialCoins: number) {
    let cacheCoins = Array.from({ length: initialCoins }, (_, serial) => ({ id: `${gridI}:${gridJ}#${serial}`, serial }));

    const cacheMarker = leaflet.marker([lat, lng]).addTo(map);
    cacheMarker.bindPopup(() => {
        const popupContent = document.createElement("div");
        popupContent.innerHTML = `<b>Cache ${gridI}:${gridJ}</b><br>Coins: <span id="cache-coins-${gridI}:${gridJ}">${cacheCoins.length}</span>`;

        const collectButton = document.createElement("button");
        collectButton.innerText = "Collect";
        collectButton.onclick = () => {
            if (cacheCoins.length > 0) {
                const coin = cacheCoins.pop();
                playerInventory.push(coin!.id);
                updateInventory();
                document.getElementById(`cache-coins-${gridI}:${gridJ}`)!.innerText = cacheCoins.length.toString();
            }
        };
        popupContent.appendChild(collectButton);

        const depositButton = document.createElement("button");
        depositButton.innerText = "Deposit";
        depositButton.onclick = () => {
            if (playerInventory.length > 0) {
                const coin = playerInventory.pop();
                cacheCoins.push({ id: coin!, serial: cacheCoins.length });
                updateInventory();
                document.getElementById(`cache-coins-${gridI}:${gridJ}`)!.innerText = cacheCoins.length.toString();
            }
        };
        popupContent.appendChild(depositButton);

        return popupContent;
    });
}

// Save game state
function saveGameState() {
    const state = { playerPosition, playerInventory, movementHistory };
    localStorage.setItem("gameState", JSON.stringify(state));
}

// Load game state
function loadGameState() {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
        const { playerPosition: savedPosition, playerInventory: savedInventory, movementHistory: savedHistory } = JSON.parse(savedState);
        playerPosition = leaflet.latLng(savedPosition.lat, savedPosition.lng);
        playerInventory = savedInventory;
        movementHistory = savedHistory.map((pos: any) => leaflet.latLng(pos.lat, pos.lng));
        movementPolyline.setLatLngs(movementHistory);
        updatePosition();
        updateInventory();
    }
}

// Reset game state
function resetGameState() {
    if (confirm("Are you sure you want to erase all progress?")) {
        playerInventory = [];
        movementHistory = [playerPosition];
        movementPolyline.setLatLngs(movementHistory);
        localStorage.removeItem("gameState");
        updateInventory();
    }
}

// Event listeners for control buttons
document.getElementById("north")!.addEventListener("click", () => movePlayer(1, 0));
document.getElementById("south")!.addEventListener("click", () => movePlayer(-1, 0));
document.getElementById("west")!.addEventListener("click", () => movePlayer(0, -1));
document.getElementById("east")!.addEventListener("click", () => movePlayer(0, 1));
document.getElementById("sensor")!.addEventListener("click", startGeolocationTracking);
document.getElementById("reset")!.addEventListener("click", resetGameState);

// Initialize game
spawnNearbyCaches();
loadGameState();
updateStatus();
updateInventory();
