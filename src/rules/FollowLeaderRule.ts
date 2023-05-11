import { Rule, RuleArguments, RuleOptions } from "./Rule";
import * as THREE from "three";
import { Boid } from "../objects/Boid";
import { ChangeOfLeaderBoid, LeaderBoidStatus } from "../objects/ChangeOfLeaderBoid";

export interface FollowLeaderRuleOptions extends RuleOptions {
    followLeaderProbability?: number;
}

export class FollowLeaderRule extends Rule {
    readonly name = "Follow Leader";

    followLeaderProbability: number;

    constructor(weight: number, options?: FollowLeaderRuleOptions) {
        super(weight, options);
        this.followLeaderProbability = options?.followLeaderProbability ?? 0.005;
    }

    calculateVector(thisBoid: Boid, args: RuleArguments): THREE.Vector3 {
        if (!(thisBoid instanceof ChangeOfLeaderBoid)) {
            return new THREE.Vector3();
        }
        // don't follow leaders if we're a leader ourselves
        if (thisBoid.status === LeaderBoidStatus.Leader) {
            thisBoid.followingBoid = null;
            return new THREE.Vector3();
        }
        if (args.neighbours.length === 0) {
            thisBoid.followingBoid = null;
            return new THREE.Vector3();
        }

        const visibleLeaders = args.neighbours.filter(
            (boid) => boid instanceof ChangeOfLeaderBoid && boid.status === LeaderBoidStatus.Leader,
        );

        if (visibleLeaders.length === 0) {
            thisBoid.followingBoid = null;
            return new THREE.Vector3();
        }

        if (thisBoid.followingBoid !== null) {
            const currentlyFollowingLeader = visibleLeaders.find(
                (boid) => boid.id === thisBoid.followingBoid,
            );
            if (currentlyFollowingLeader) {
                return this.followBoidVector(thisBoid, currentlyFollowingLeader);
            }
            // if the leader we're following isn't visible, stop following them
            thisBoid.followingBoid = null;
        }

        // check is necessary, because we might set it to null in the body of
        // previous if statement
        if (thisBoid.followingBoid === null) {
            // probability of following a leader
            if (Math.random() > 1 - this.followLeaderProbability) {
                const index = Math.floor(Math.random() * visibleLeaders.length);
                const newFollowingLeader = visibleLeaders[index];
                thisBoid.followingBoid = newFollowingLeader.id;
                return this.followBoidVector(thisBoid, newFollowingLeader);
            }
        }

        return new THREE.Vector3();
    }

    followBoidVector(thisBoid: Boid, otherBoid: Boid): THREE.Vector3 {
        const vec = new THREE.Vector3().subVectors(otherBoid.position, thisBoid.position);
        vec.normalize();
        vec.multiplyScalar(this.weight);
        return vec;
    }
}
