import { World } from "../objects/world/World";

export const smallWorld = new World({
    name: "Small World",
    dimensions: {
        x: 100,
        y: 100,
        z: 50
    },
    obstacles: {
        cylinders: [
            { basePoint: {x: 10, y: 20, z: 30}, diameter: 20, height: 50}
        ]
    }
});
