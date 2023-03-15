import { Rule, RuleArguments } from "./Rule";
import * as THREE from "three";
import { Boid } from "../objects/Boid";
import { Predator } from "../objects/Predator";
import { DBSCAN } from "../misc/DBSCAN";

export class PreySeekRule extends Rule {
    readonly name = "Seek Prey Rule";

    private static FILL: number = 400;

    hunger:number = PreySeekRule.FILL;
    
    private flock: Boid[] = [];


    targetSwap(thisBoid:Predator, args:RuleArguments){
        let random = Math.random()
        if(random < args.simParams.predNewTargetChance){
            return thisBoid.chooseRandomTarget(this.flock);
        } else{
            return thisBoid.getTarget();
        }
    }

    private getMeanTarget(args:RuleArguments){
        if(this.flock.length == 0){
            this.flock = this.chooseFlock(args);
            console.log(this.flock);
        }
        const meanPos = new THREE.Vector3();
        this.flock.forEach(b => meanPos.add(b.position));
        return meanPos.divideScalar(this.flock.length)
    }

    private chooseFlock(args: RuleArguments){
        let flocks = DBSCAN.cluster(args.boids.concat(args.doibs).filter(b => b.isBoidAlive), 3).filter(flock => flock.length > 0);

        let probabilities: number[] = [];
        let sum = 0;

        
        flocks.forEach(flock => {
            let prob = 1/flock.length;
            sum += prob;
            probabilities.push(prob);
        });
        console.log(probabilities);

        probabilities = probabilities.map(p => {
            return p/sum;
        })
        console.log(probabilities);

        sum = 0;
        let threshold = Math.random();
        
        for(let i = 0; i < probabilities.length; i++){
            sum += probabilities[i];
            if(sum > threshold){
                console.log("returned")
                return flocks[i];
            }
        }
        console.log("returned")
        return flocks[flocks.length-1]
    }  

    calculateVector(thisBoid: Boid, args: RuleArguments): THREE.Vector3 {
        this.hunger--;
        if(!(thisBoid instanceof Predator)){
            return new THREE.Vector3();
        }
        let output = new THREE.Vector3();

        if(this.hunger > 0){
            output = this.getMeanTarget(args);
            output.add(new THREE.Vector3(0,thisBoid.maintainDistance,0));
            output.sub(thisBoid.position);
            if(output.length() < thisBoid.maintainDistance){
                return new THREE.Vector3();
            }
            return output;
        }

        // Decide if we want to swap targets
        let target = this.targetSwap(thisBoid, args);
        thisBoid.setTarget(this.targetSwap(thisBoid, args));
        
        
        if(target != null){
            if(target.position.distanceTo(thisBoid.position) < thisBoid.killRange){
                target.kill()
                this.hunger = PreySeekRule.FILL;
                target = null;
                this.flock = [];
            } else if(target.position.distanceTo(thisBoid.position) < thisBoid.huntRange){
                thisBoid.setHunting();
            } else{
                thisBoid.setSeeking();
            }
        }

        if(target != null){
            output.add(target.mesh.position);
            output.sub(thisBoid.mesh.position).normalize();
        }

        return output;
    }   
}