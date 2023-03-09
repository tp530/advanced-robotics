import { World } from "../objects/world/World";

export const obstacles1 = new World({
    name: "Obstacles 1",
    dimensions: {
        x: 200,
        y: 200,
        z: 50
    },
    obstacles: {
        cylinders: [
            { basePoint: {x: 70, y: 0, z: 30}, radius: 10, height: 50},
            { basePoint: {x: 0, y: 0, z: 0}, radius: 20, height: 50},
            { basePoint: {x: -70, y: 0, z: -50}, radius: 20, height: 50}
        ]
    }
});
