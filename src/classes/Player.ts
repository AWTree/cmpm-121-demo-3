import leaflet from "leaflet";

export class Player {
    position: leaflet.LatLng;
    inventory: string[];
    movementHistory: leaflet.LatLng[];
    marker: leaflet.Marker;
    polyline: leaflet.Polyline;

    constructor(initialPosition: leaflet.LatLng, map: leaflet.Map) {
        this.position = initialPosition;
        this.inventory = [];
        this.movementHistory = [initialPosition];
        this.marker = leaflet.marker(initialPosition).addTo(map);
        this.polyline = leaflet.polyline(this.movementHistory, { color: "#4C9BE4" }).addTo(map);
    }

    move(latOffset: number, lngOffset: number, tileSize: number, map: leaflet.Map) {
        this.position = leaflet.latLng(this.position.lat + latOffset * tileSize, this.position.lng + lngOffset * tileSize);
        this.movementHistory.push(this.position);
        this.updateMap(map);
    }

    updateMap(map: leaflet.Map) {
        this.marker.setLatLng(this.position);
        map.setView(this.position);
        this.polyline.setLatLngs(this.movementHistory);
    }

    addCoin(coinId: string) {
        this.inventory.push(coinId);
        this.updateInventory();
    }

    removeCoin(): string | null {
        const coin = this.inventory.pop();
        this.updateInventory();
        return coin || null;
    }

    updateInventory() {
        const inventoryList = document.getElementById("inventoryList")!;
        inventoryList.innerHTML = "";
        this.inventory.forEach((coinId) => {
            const li = document.createElement("li");
            li.innerHTML = `🪙 ${coinId}`;
            inventoryList.appendChild(li);
        });
    }

    saveState() {
        const state = {
            position: this.position,
            inventory: this.inventory,
            movementHistory: this.movementHistory,
        };
        localStorage.setItem("playerState", JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem("playerState");
        if (savedState) {
            const { position, inventory, movementHistory } = JSON.parse(savedState);
            this.position = leaflet.latLng(position.lat, position.lng);
            this.inventory = inventory;
            this.movementHistory = movementHistory.map((pos: any) => leaflet.latLng(pos.lat, pos.lng));
        }
    }
}
