import * as THREE from "three";
import { Rule, RuleArguments } from "../rules/Rule";
import { Material } from "three";
import { RenderingModes } from "../BoidSimulation";

export interface BoidOptions {
    // Initial boid position
    position: THREE.Vector3;
    // Initial boid velocity
    velocity: THREE.Vector3;
    // Boid acceleration (change in velocity per timestep)
    acceleration: number;
    rendering: RenderingModes;
}

export type BoidId = number;

export class Boid {

    readonly id: BoidId;
    private readonly rendering: RenderingModes;
    mesh: THREE.Mesh;

    actualVelocity: THREE.Vector3;
    targetVelocity: THREE.Vector3;

    acceleration: number;

    /**
     * Each boid has a random bias that gets added to the calculated velocity
     * at each timestep.
     * The random bias is changed by a tiny random amount each timestep.
     *
     * This provides "slower" randomness than directly adding randomness to the
     * velocity at each timestep. (Because the randomness is effectively
     * remembered between timesteps.)
     *
     * Once the random bias gets above a certain threshold, it's scaled to a tiny
     * amount again, so that it doesn't just keep accumulating over time forever.
     */
    randomBias = new THREE.Vector3();

    /**
     * Base colour of the boid, before randomly adjusting lightness of each boid.
     * H, S, and L are in the range [0, 1].
     */
    private baseColour = { h: 0.602, s: 0.32, l: 0.3 };

    constructor(id: BoidId, options: BoidOptions) {
        this.id = id;
        this.rendering = options.rendering;
        // model boids as a cone so we can see their direction
        const geometry = new THREE.ConeGeometry(1, 4);

        let material: Material;
        if (this.rendering === RenderingModes.Photorealistic) {
            material = new THREE.MeshStandardMaterial({
                color: this.generateIndividualColour(),
                metalness: 1,
            });
        } else {
            material = new THREE.MeshBasicMaterial({
                color: this.generateIndividualColour(),
            });
        }

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(options.position.x, options.position.y, options.position.z);

        this.actualVelocity = options.velocity;
        this.targetVelocity = options.velocity.clone();

        this.acceleration = options.acceleration;
    }

    /**
     * Randomly generate a version of `this.baseColour`, with lightness adjusted.
     */
    private generateIndividualColour() {
        let lightnessAdjust: number;
        if (this.rendering === RenderingModes.Photorealistic) {
            lightnessAdjust = Math.random() * 0.8;
        } else {
            lightnessAdjust = Math.random() * 0.4 - 0.2;
        }

        let l = this.baseColour.l + lightnessAdjust;
        // constrain lightness to range [0, 1]
        l = Math.max(l, 0);
        l = Math.min(l, 1);

        return new THREE.Color().setHSL(this.baseColour.h, this.baseColour.s, l);
    }

    /**
     * Set the colour of this boid. Useful, for example, for showing the
     * state of different boids.
     */
    setColour(colour: THREE.Color) {
        if (this.rendering === RenderingModes.Photorealistic) {
            (this.mesh.material as THREE.MeshStandardMaterial).color = colour;
        } else {
            (this.mesh.material as THREE.MeshBasicMaterial).color = colour;
        }
    }

    get position() {
        return this.mesh.position;
    }

    get velocityNormalised() {
        return new THREE.Vector3().copy(this.actualVelocity).normalize();
    }

    update(rules: Rule[], ruleArguments: RuleArguments) {
        this.updateVelocity(rules, ruleArguments);
        this.move();
    }

    updateVelocity(rules: Rule[], ruleArguments: RuleArguments) {
        for (const rule of rules) {
            const ruleVector = rule.calculateVector(this, ruleArguments);
            this.targetVelocity.add(ruleVector);
        }

        this.capSpeed(ruleArguments.simParams.maxSpeed);

        this.addRandomnessToVelocity(
            ruleArguments.simParams.randomnessPerTimestep,
            ruleArguments.simParams.randomnessLimit,
        );
    }

    capSpeed(maxSpeed: number) {
        if (this.targetVelocity.length() > maxSpeed) {
            this.targetVelocity.setLength(maxSpeed);
        }
    }

    addRandomnessToVelocity(randomnessPerTimestep: number, randomnessLimit: number) {
        this.updateRandomBias(randomnessPerTimestep, randomnessLimit);
        this.targetVelocity.add(this.randomBias);
    }

    move() {
        // accelerate towards the target velocity
        if (this.actualVelocity !== this.targetVelocity) {
            const updateVelocity = new THREE.Vector3()
                .subVectors(this.targetVelocity, this.actualVelocity)
                .setLength(this.acceleration);
            this.actualVelocity.add(updateVelocity);
        }

        // point the void to face in the direction it's moving
        this.pointInDirection(this.actualVelocity);
        // move the boid by its velocity vector
        this.position.add(this.actualVelocity);
    }

    /**
     * Point the boid to face in the direction of the given vector
     */
    private pointInDirection(vector: THREE.Vector3) {
        const phi = Math.atan2(-vector.z, vector.x);
        const a = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.z, 2));
        const theta = Math.atan2(a, vector.y);

        // reset the rotation, so we can apply our rotations independent of where
        // we're currently pointed
        this.mesh.rotation.set(0, 0, 0);
        // rotate around the world's z-axis by theta clockwise
        this.mesh.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -theta);
        // rotate around the world's y-axis by phi anticlockwise
        this.mesh.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), phi);
    }

    isOtherBoidVisible(other: Boid, visibilityThreshold: number): boolean {
        return this.position.distanceTo(other.position) < visibilityThreshold;
    }

    updateRandomBias(randomnessPerTimestep: number, randomnessLimit: number) {
        this.randomBias.add(
            new THREE.Vector3(
                Math.random() * randomnessPerTimestep - randomnessPerTimestep / 2,
                Math.random() * randomnessPerTimestep - randomnessPerTimestep / 2,
                Math.random() * randomnessPerTimestep - randomnessPerTimestep / 2,
            ),
        );

        // once randomness gets above a certain threshold, scale it back
        // -- so randomness doesn't just keep getting bigger all the time
        if (this.randomBias.length() > randomnessLimit) {
            this.randomBias.divideScalar(100);
        }
    }
}
