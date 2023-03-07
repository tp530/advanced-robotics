import { Bounds3D } from "../Bounds3D";

export class XYZ implements IXYZ {
    x: number;
    y: number;
    z: number;
    constructor(data: IXYZ) {
        this.x = data.x;
        this.y = data.y;
        this.z = data.z;
    }
}

export interface IXYZ {
    x: number;
    y: number;
    z: number;
}

export class Cylinder implements ICylinder {
    basePoint: XYZ;
    diameter: number;
    height: number;
    constructor(data: ICylinder) {
        this.basePoint = new XYZ(data.basePoint);
        this.diameter = data.diameter;
        this.height = data.height;
    }
}

export interface ICylinder {
    basePoint: IXYZ;
    diameter: number;
    height: number;
}

export class Obstacles implements IObstacles {
    cylinders: Array<Cylinder> = [];
    constructor(data: IObstacles) {
        if (Array.isArray(data.cylinders) && data.cylinders.length > 0) {
            for (const cylinder of data.cylinders) {
                this.cylinders.push(new Cylinder(cylinder));
            }

        }
    }
}

export interface IObstacles {
    cylinders: Array<ICylinder>;
}

export class World implements IWorld {

    name: string;
    dimensions: XYZ;
    obstacles: Obstacles;

    constructor(data: IWorld) {
        this.name = data.name;
        this.dimensions = new XYZ(data.dimensions);
        this.obstacles = new Obstacles(data.obstacles);
    }

    get3DBoundaries(): Bounds3D {
        return Bounds3D.centredXZ(this.dimensions.x, this.dimensions.y, this.dimensions.z);
    }

}

export interface IWorld {
    name: string;
    dimensions: IXYZ;
    obstacles: IObstacles;
}

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
