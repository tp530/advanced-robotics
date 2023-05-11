import * as THREE from "three";
import { Material } from "three";
import { RenderingModes } from "../BoidSimulation";
import { ICylinderDescription } from "./world/ICylinderDescription";

export interface CylinderOptions {
    description: ICylinderDescription;
    rendering: RenderingModes;
}

export class Cylinder {

    readonly mesh: Array<THREE.Object3D<THREE.Event>>;
    private readonly radialSegments: number = 16;
    private innerMargin: number = 0.05;

    constructor(options: CylinderOptions) {

        const bodyGeometry = new THREE.CylinderGeometry(
            options.description.radius - this.innerMargin,
            options.description.radius - this.innerMargin,
            options.description.height - (this.innerMargin * 2),
            this.radialSegments,
            1
        );

        let material: Material;
        if (options.rendering === RenderingModes.Photorealistic) {
            material = new THREE.MeshStandardMaterial({
                color: 0x90d74b,
                metalness: 1
            });
        } else {
            material = new THREE.MeshStandardMaterial({
                color: 0x90d74b
            });
        }

        material.transparent = true;
        material.opacity = 0.75;

        const bodyMesh = new THREE.Mesh(bodyGeometry, material);

        bodyMesh.position.set(
            options.description.basePoint.x,
            options.description.basePoint.y + (options.description.height / 2) + this.innerMargin,
            options.description.basePoint.z
        );

        const wireframeGeometry = new THREE.CylinderGeometry(
            options.description.radius,
            options.description.radius,
            options.description.height,
            this.radialSegments,
            1
        );

        const wireframeTemplate = new THREE.Mesh(wireframeGeometry, material);

        const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
        const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(wireframeTemplate.geometry), lineMaterial);

        wireframe.position.set(
            options.description.basePoint.x,
            options.description.basePoint.y + (options.description.height / 2),
            options.description.basePoint.z
        );

        this.mesh = [bodyMesh, wireframe];

    }

}
