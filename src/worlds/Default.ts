import { World } from "../objects/world/World";

export const defaultWorld = new World({
    name: "Default",
    dimensions: {
        x: 200,
        y: 200,
        z: 100
    },
    obstacles: {
        cylinders: []
    }
});
