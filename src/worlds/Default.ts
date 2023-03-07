import { World } from "../objects/World";

export const defaultWorld = new World({
    name: "Default",
    dimensions: {
        x: 200,
        y: 200,
        z: 100
    },
    obstacles: {
        cylinders: [
            { basePoint: {x: 10, y: 20, z: 30}, diameter: 20, height: 50}
        ]
    }
});