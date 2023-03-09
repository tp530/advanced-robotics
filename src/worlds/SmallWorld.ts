import { World } from "../objects/world/World";

export const smallWorld = new World({
    name: "Small World",
    dimensions: {
        x: 100,
        y: 100,
        z: 50
    },
    obstacles: {
        cylinders: []
    }
});
