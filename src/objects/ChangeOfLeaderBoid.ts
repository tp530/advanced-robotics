import { Boid, BoidId } from "./Boid";
import { Rule, RuleArguments } from "../rules/Rule";
import * as THREE from "three";
import { Bounds3D } from "../Bounds3D";
import { CohesionRule } from "../rules/CohesionRule";

export enum LeaderBoidStatus {
    Leader,
    NotLeader,
}

export interface ChangeOfLeaderBoidOptions {
    // The max number of timesteps a boid can be a leader for
    maxLeaderTimestep: number;
    // The level of 'eccentricity' needed for a boid to be allowed to become a
    // leader. (I.e. how much on the outside of the flock it needs to be)
    eccentricityThreshold: number;
    // The number of neighbours a boid needs to be able to become a leader.
    // This is to prevent shoot-offs from tiny groups of boids.
    neighbourCountThreshold: number;
    // The probability that a boid will become a leader in a given timestep, given
    // it meets all the other constraints.
    becomeLeaderProbability: number;
    // Whether to set the boids' colour based on their state
    colourBoids: boolean;
    // The maximum speed an escaping boid is allowed to reach (as a multiplier of the normal max speed)
    peakSpeedMultiplier: number;
    // The fraction of the time through escaping that the max speed is reached.
    peakSpeedTimestepFraction: number;
}

export class ChangeOfLeaderBoid extends Boid {
    status = LeaderBoidStatus.NotLeader;
    private leaderTimestep = 0;

    followingBoid: BoidId | null = null;

    update(rules: Rule[], ruleArguments: RuleArguments) {
        const changeOfLeaderOptions = ruleArguments.simParams.changeOfLeaderBoidOptions;
        // stop being a leader after some time
        if (this.status === LeaderBoidStatus.Leader) {
            this.checkIfStopBeingLeader(changeOfLeaderOptions);
        }
        switch (this.status) {
            case LeaderBoidStatus.Leader: {
                this.leaderTimestep++;
                this.updateLeader(rules, ruleArguments);
                if (changeOfLeaderOptions.colourBoids) {
                    this.setColour(new THREE.Color().setHSL(0.2, 1, 0.5));
                }
                break;
            }
            case LeaderBoidStatus.NotLeader: {
                this.updateNotLeader(rules, ruleArguments);
                this.allowChanceToBecomeLeader(ruleArguments);
                // set colour of boid if we're following a leader
                if (this.followingBoid !== null && changeOfLeaderOptions.colourBoids) {
                    this.setColour(new THREE.Color().setHSL(0, 0.8, 0.5));
                }
                break;
            }
        }
    }

    private updateLeader(rules: Rule[], ruleArguments: RuleArguments) {
        const antiCohesionRule = new CohesionRule(-10);
        this.targetVelocity.add(antiCohesionRule.calculateVector(this, ruleArguments));

        for (const rule of rules) {
            if (rule.alwaysApplyToLeaderBoids) {
                this.targetVelocity.add(rule.calculateVector(this, ruleArguments));
            }
        }

        this.capSpeed(
            ruleArguments.simParams.maxSpeed *
                this.getLeaderMaxSpeedMultiplier(ruleArguments.simParams.changeOfLeaderBoidOptions),
        );

        // add more randomness to leader boids
        const randomnessMultiplier = 4;
        this.addRandomnessToVelocity(
            ruleArguments.simParams.randomnessPerTimestep * randomnessMultiplier,
            ruleArguments.simParams.randomnessLimit * randomnessMultiplier,
        );

        super.move();
    }

    private updateNotLeader(rules: Rule[], ruleArguments: RuleArguments) {
        super.update(rules, ruleArguments);
    }

    private checkIfStopBeingLeader(changeOfLeaderOptions: ChangeOfLeaderBoidOptions) {
        // add some randomness around maxLeaderTimestep
        if (
            this.leaderTimestep >
            changeOfLeaderOptions.maxLeaderTimestep -
                (Math.random() * changeOfLeaderOptions.maxLeaderTimestep) / 3
        ) {
            this.status = LeaderBoidStatus.NotLeader;
        }
    }

    private allowChanceToBecomeLeader(ruleArguments: RuleArguments) {
        const changeOfLeaderOptions = ruleArguments.simParams.changeOfLeaderBoidOptions;
        const x = this.calculateEccentricity(
            ruleArguments.neighbours,
            ruleArguments.simParams.visibilityThreshold,
        );
        let hasChanceOfEscaping = false;
        if (
            x > changeOfLeaderOptions.eccentricityThreshold &&
            ruleArguments.neighbours.length >= changeOfLeaderOptions.neighbourCountThreshold
        ) {
            hasChanceOfEscaping = true;
        }
        // colour boids on the edge of the flock that have a chance of escaping,
        // and all other boids default colour
        if (changeOfLeaderOptions.colourBoids) {
            this.setColour(new THREE.Color().setHSL(0.7, 1, hasChanceOfEscaping ? 0.7 : 0.1));
        }

        if (hasChanceOfEscaping) {
            const isEscaping = Math.random() > 1 - changeOfLeaderOptions.becomeLeaderProbability;
            if (isEscaping) {
                this.status = LeaderBoidStatus.Leader;
            }
        }
    }

    private calculateEccentricity(neighbours: Boid[], visibilityRadius: number): number {
        if (neighbours.length === 0) {
            return 0;
        }
        // calculate centre of visible boids (like in cohesion rule)
        const centre = this.calculateCentreOfVisibleBoids(neighbours);

        // divide by visibility radius to normalise the eccentricity in [0, 1]
        return this.position.distanceTo(centre) / visibilityRadius;
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

    private getLeaderMaxSpeedMultiplier(changeOfLeaderOptions: ChangeOfLeaderBoidOptions): number {
        // allow a short burst of speed at the start of escaping
        const peakTimestep = Math.floor(
            changeOfLeaderOptions.maxLeaderTimestep *
                changeOfLeaderOptions.peakSpeedTimestepFraction,
        );
        if (this.leaderTimestep < peakTimestep) {
            return (
                ((changeOfLeaderOptions.peakSpeedMultiplier - 1) / peakTimestep) *
                    this.leaderTimestep +
                1
            );
        } else {
            return (
                ((1 - changeOfLeaderOptions.peakSpeedMultiplier) /
                    (changeOfLeaderOptions.maxLeaderTimestep - peakTimestep)) *
                    (this.leaderTimestep - peakTimestep) +
                changeOfLeaderOptions.peakSpeedMultiplier
            );
        }
    }
}
