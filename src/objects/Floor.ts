import * as THREE from "three";
import { BoidSimulationParams } from "../BoidSimulation";

export class Floor {

    mesh: THREE.Object3D<THREE.Event>;

    private readonly padding = 50;

    constructor(params: BoidSimulationParams, showGrid: boolean = true) {

        const xSize = params.worldDimens.xSize + (2 * this.padding);
        const zSize = params.worldDimens.zSize + (2 * this.padding);

        const geometry = new THREE.PlaneGeometry(xSize, zSize);
        const material = new THREE.MeshBasicMaterial({ color: 0xd4d4d8 });
        const floorMesh = new THREE.Mesh(geometry, material);

        // make the plane horizontal
        floorMesh.rotateX(-Math.PI / 2);
        // so that the floor doesn't "disappear" when camera is rotated to exactly horizontal
        floorMesh.position.setY(-0.1);

        if (showGrid) {
            const subgridSize = Math.round(xSize / 10);
            const gridHelper = new THREE.GridHelper(xSize, subgridSize);
            gridHelper.add(floorMesh);
            this.mesh = gridHelper;
        } else {
            this.mesh = floorMesh;
        }

    }

}
