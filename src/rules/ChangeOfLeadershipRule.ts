import { Rule, RuleArguments } from "./Rule";
import * as THREE from "three";
import { Boid, BoidId } from "../objects/Boid";

enum BoidStatus {
    Leader,
    NotLeader,
}

export class ChangeOfLeadershipRule extends Rule {
    readonly name = "Change of Leadership";

    readonly applyAfterVelocityCap = true;

    private leaderStatuses: Map<BoidId, BoidStatus> = new Map();
    private leaderEscapeTimestep: Map<BoidId, number> = new Map();

    calculateVector(thisBoid: Boid, args: RuleArguments): THREE.Vector3 {
        if (!this.leaderStatuses.has(thisBoid.id)) {
            this.leaderStatuses.set(thisBoid.id, BoidStatus.NotLeader);
        }
        if (this.leaderStatuses.get(thisBoid.id) === BoidStatus.Leader) {
            // if this boid is already a leader
            // currentEscapeTimestep is always set when boid is a leader
            const currentEscapeTimestep = this.leaderEscapeTimestep.get(thisBoid.id) ?? 0;
            if (currentEscapeTimestep > 200) {
                this.leaderStatuses.set(thisBoid.id, BoidStatus.NotLeader);
            }

            const speed = this.getSpeedForEscapeTimestep(currentEscapeTimestep);

            const direction = this.calculateCohesionNormalised(thisBoid, args.neighbours).negate();

            this.leaderEscapeTimestep.set(thisBoid.id, currentEscapeTimestep + 1);
            return direction.setLength(speed);
        }

        const eccentricity = this.calculateEccentricity(
            thisBoid,
            args.neighbours,
            args.simParams.visibilityThreshold,
        );

        if (eccentricity < 0.7) {
            return new THREE.Vector3();
        }

        this.leaderStatuses.set(thisBoid.id, BoidStatus.Leader);
        this.leaderEscapeTimestep.set(thisBoid.id, 0);

        // setTimeout to stop being a leader??

        const relativePosition = this.calculateRelativePositionToFlock(thisBoid, args.neighbours);

        // colour boids based on their relative position
        (thisBoid.mesh.material as THREE.MeshBasicMaterial).color = new THREE.Color().setHSL(
            0.7,
            1,
            relativePosition * 0.5 + 0.5,
        );

        return new THREE.Vector3(0, 1, 0);
    }

    private calculateCentreOfVisibleBoids(neighbours: Boid[]): THREE.Vector3 {
        if (neighbours.length === 0) {
            return new THREE.Vector3();
        }
        const centre = new THREE.Vector3();
        for (const neighbour of neighbours) {
            centre.add(neighbour.position);
        }
        centre.divideScalar(neighbours.length);
        return centre;
    }

    private calculateEccentricity(
        thisBoid: Boid,
        neighbours: Boid[],
        visibilityRadius: number,
    ): number {
        if (neighbours.length === 0) {
            return 0;
        }
        // calculate centre of visible boids (like in cohesion rule)
        const centre = this.calculateCentreOfVisibleBoids(neighbours);

        // divide by visibility radius to normalise the eccentricity in [0, 1]
        return thisBoid.position.distanceTo(centre) / visibilityRadius;
    }

    private calculateCohesionNormalised(thisBoid: Boid, neighbours: Boid[]): THREE.Vector3 {
        if (neighbours.length === 0) {
            return new THREE.Vector3();
        }

        const centre = this.calculateCentreOfVisibleBoids(neighbours);
        // cohesion vector is from this boid's position towards the centre of visible boids
        centre.sub(thisBoid.position);

        centre.normalize();
        return centre;
    }

    private calculateRelativePositionToFlock(thisBoid: Boid, neighbours: Boid[]) {
        const cohesion = this.calculateCohesionNormalised(thisBoid, neighbours);
        const velocity = thisBoid.velocityNormalised;

        // if > 0, boid is in front of flock; if < 0, boid is behind flock
        return -cohesion.dot(velocity);
    }

    private getSpeedForEscapeTimestep(timestep: number): number {
        return 1 - Math.pow(timestep - 100, 2) / 10000;
    }
}
