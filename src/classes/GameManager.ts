import leaflet from "leaflet";
import { Player } from "./Player.ts";
import { Cache } from "./Cache.ts";
import luck from "../luck.ts";
import { INITIAL_POSITION, TILE_SIZE, NEIGHBORHOOD_RADIUS, CACHE_PROBABILITY } from "../constants.ts";

export class GameManager {
    map: leaflet.Map;
    player: Player;
    caches: Cache[];

    constructor(mapId: string) {
        this.map = leaflet.map(mapId, {
            center: INITIAL_POSITION,
            zoom: 19,
            zoomControl: false,
        });
        leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(this.map);

        this.player = new Player(INITIAL_POSITION, this.map);
        this.caches = [];
    }

    spawnCaches() {
        for (let i = -NEIGHBORHOOD_RADIUS; i <= NEIGHBORHOOD_RADIUS; i++) {
            for (let j = -NEIGHBORHOOD_RADIUS; j <= NEIGHBORHOOD_RADIUS; j++) {
                const lat = this.player.position.lat + i * TILE_SIZE;
                const lng = this.player.position.lng + j * TILE_SIZE;
                if (luck(`${Math.floor(lat * 1e4)}:${Math.floor(lng * 1e4)}`) < CACHE_PROBABILITY) {
                    const coinCount = Math.floor(luck("coins") * 5) + 1;
                    this.caches.push(new Cache(lat, lng, coinCount, this.map, this.player));
                }
            }
        }
    }

    handleMove(direction: "north" | "south" | "east" | "west") {
        switch (direction) {
            case "north":
                this.player.move(1, 0, TILE_SIZE, this.map);
                break;
            case "south":
                this.player.move(-1, 0, TILE_SIZE, this.map);
                break;
            case "east":
                this.player.move(0, 1, TILE_SIZE, this.map);
                break;
            case "west":
                this.player.move(0, -1, TILE_SIZE, this.map);
                break;
        }
    }
}
