// Import necessary modules and styles
import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import luck from "./luck.ts"; // Deterministic random generator

// Define constants
const INITIAL_POSITION = leaflet.latLng(36.98949379578401, -122.06277128548504);
const TILE_SIZE = 1e-4;
const NEIGHBORHOOD_RADIUS = 8;
const CACHE_PROBABILITY = 0.1;
let playerInventory: string[] = [];
let playerPosition = INITIAL_POSITION;

// Initialize Map
const map = leaflet.map("map", {
    center: INITIAL_POSITION,
    zoom: 19,
    zoomControl: false
});
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Player Marker
const playerMarker = leaflet.marker(playerPosition).addTo(map);

// Status Panel and Inventory Elements
const statusPanel = document.getElementById("statusPanel")!;
const inventoryList = document.getElementById("inventoryList")!;

// Update status display function
function updateStatus() {
    const positionText = `Position: ${playerPosition.lat.toFixed(5)}, ${playerPosition.lng.toFixed(5)}`;
    statusPanel.innerHTML = `${positionText} <button id="copyBtn">Copy Position</button>`;

    // Add event listener for the Copy Position button
    document.getElementById("copyBtn")!.addEventListener("click", () => {
        navigator.clipboard.writeText(positionText)
            .then(() => alert("Position copied to clipboard!"))
            .catch(err => console.error("Failed to copy position: ", err));
    });
}

// Update inventory display
function updateInventory() {
    inventoryList.innerHTML = "";
    playerInventory.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `🪙 ${item}`;
        inventoryList.appendChild(li);
    });
}

// Move the player and update the map
function movePlayer(latOffset: number, lngOffset: number) {
    playerPosition = leaflet.latLng(
        playerPosition.lat + latOffset * TILE_SIZE,
        playerPosition.lng + lngOffset * TILE_SIZE
    );
    playerMarker.setLatLng(playerPosition);
    map.setView(playerPosition); // Center the map on the new player position
    updateStatus();
    spawnNearbyCaches(); // Check for and spawn new caches near the player’s updated position
}

// Generate caches deterministically around the player’s location
function spawnNearbyCaches() {
    for (let i = -NEIGHBORHOOD_RADIUS; i <= NEIGHBORHOOD_RADIUS; i++) {
        for (let j = -NEIGHBORHOOD_RADIUS; j <= NEIGHBORHOOD_RADIUS; j++) {
            const lat = playerPosition.lat + i * TILE_SIZE;
            const lng = playerPosition.lng + j * TILE_SIZE;
            const cacheId = `${lat.toFixed(5)}:${lng.toFixed(5)}`;

            if (luck(cacheId) < CACHE_PROBABILITY) {
                const coinCount = Math.floor(luck(cacheId + "-coins") * 5) + 1; // 1-5 coins
                createCache(lat, lng, cacheId, coinCount);
            }
        }
    }
}

// Function to create cache with collect and deposit actions
function createCache(lat: number, lng: number, id: string, initialCoins: number) {
    let cacheCoins = initialCoins;
    const cacheMarker = leaflet.marker([lat, lng]).addTo(map);

    cacheMarker.bindPopup(() => {
        const popupContent = document.createElement("div");
        popupContent.classList.add("cache-popup");
        popupContent.innerHTML = `<b>Cache ${id}</b><br>Coins: <span id="cache-coins-${id}">${cacheCoins}</span>`;

        // Create collect button
        const collectButton = document.createElement("button");
        collectButton.innerText = "Collect";
        collectButton.onclick = () => {
            if (cacheCoins > 0) {
                playerInventory.push(`Coin from ${id}`);
                cacheCoins--;
                updateInventory();
                document.getElementById(`cache-coins-${id}`)!.innerText = cacheCoins.toString();
            }
        };
        popupContent.appendChild(collectButton);

        // Create deposit button
        const depositButton = document.createElement("button");
        depositButton.innerText = "Deposit";
        depositButton.onclick = () => {
            if (playerInventory.length > 0) {
                playerInventory.pop();
                cacheCoins++;
                updateInventory();
                document.getElementById(`cache-coins-${id}`)!.innerText = cacheCoins.toString();
            }
        };
        popupContent.appendChild(depositButton);

        return popupContent;
    });
}

// Event listeners for movement buttons
document.getElementById("north")!.addEventListener("click", () => movePlayer(1, 0));
document.getElementById("south")!.addEventListener("click", () => movePlayer(-1, 0));
document.getElementById("west")!.addEventListener("click", () => movePlayer(0, -1));
document.getElementById("east")!.addEventListener("click", () => movePlayer(0, 1));

// Reset game button to clear points and coins
document.getElementById("reset")!.addEventListener("click", () => {
    playerInventory = [];
    updateInventory();
});

// Initialize the map with caches and player marker
spawnNearbyCaches();
updateStatus();
updateInventory();