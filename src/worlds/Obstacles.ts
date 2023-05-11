import { World } from "../objects/world/World";

export const obstacles = new World({
    name: "Obstacles",
    dimensions: {
        x: 200,
        y: 200,
        z: 50
    },
    obstacles: {
        cylinders: [
            { basePoint: {x: 70, y: -5, z: 30}, radius: 10, height: 55},
            { basePoint: {x: 0, y: -5, z: 0}, radius: 20, height: 55},
            { basePoint: {x: -70, y: -5, z: -50}, radius: 20, height: 55}
        ]
    }
});
