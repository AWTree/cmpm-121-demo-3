import leaflet from "leaflet";
import { Player } from "./Player.ts";

export class Cache {
    id: string;
    coins: { id: string; serial: number }[];
    marker: leaflet.Marker;

    constructor(lat: number, lng: number, coinCount: number, map: leaflet.Map, player: Player) {
        this.id = `${Math.floor(lat * 1e4)}:${Math.floor(lng * 1e4)}`;
        this.coins = Array.from({ length: coinCount }, (_, serial) => ({
            id: `${this.id}#${serial}`,
            serial,
        }));
        this.marker = leaflet.marker([lat, lng]).addTo(map);
        this.bindPopup(player);
    }

    bindPopup(player: Player) {
        const popupContent = document.createElement("div");
        popupContent.innerHTML = `<b>Cache ${this.id}</b><br>Coins: <span id="coins-${this.id}">${this.coins.length}</span>`;

        const collectButton = document.createElement("button");
        collectButton.innerText = "Collect";
        collectButton.onclick = this.collectCoin.bind(this, player);

        const depositButton = document.createElement("button");
        depositButton.innerText = "Deposit";
        depositButton.onclick = this.depositCoin.bind(this, player);

        popupContent.appendChild(collectButton);
        popupContent.appendChild(depositButton);

        this.marker.bindPopup(popupContent);
    }

    collectCoin(player: Player) {
        if (this.coins.length > 0) {
            const coin = this.coins.pop();
            player.addCoin(coin!.id);
            this.updateCoinsCount();
        }
    }

    depositCoin(player: Player) {
        const coinId = player.removeCoin();
        if (coinId) {
            this.coins.push({ id: coinId, serial: this.coins.length });
            this.updateCoinsCount();
        }
    }

    updateCoinsCount() {
        const coinsElement = document.getElementById(`coins-${this.id}`);
        if (coinsElement) coinsElement.innerText = `${this.coins.length}`;
    }
}
