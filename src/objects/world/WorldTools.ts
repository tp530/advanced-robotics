import { World } from "./World";

export class WorldTools {

    static getNames(worlds: Array<World>): Array<string> {
        let names: Array<string> = [];
        for (let world of worlds) {
            names.push(world.name);
        }
        return names;
    }

    static getWorldByName(worlds: Array<World>, worldName: string): World {
        for (let world of worlds) {
            if (world.name === worldName) {
                return world;
            }
        }
        throw new Error("World not found.");
    }

}
