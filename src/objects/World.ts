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

    dimensions: XYZ;
    obstacles: Obstacles;

    constructor(data: IWorld) {
        this.dimensions = new XYZ(data.dimensions);
        this.obstacles = new Obstacles(data.obstacles);
    }

    get3DBoundaries(): Bounds3D {
        return Bounds3D.centredXZ(this.dimensions.x, this.dimensions.y, this.dimensions.z);
    }

}

export interface IWorld {
    dimensions: IXYZ;
    obstacles: IObstacles;
}
