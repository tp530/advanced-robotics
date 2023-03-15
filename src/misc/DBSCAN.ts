import { Boid } from "../objects/Boid";

export class DBSCAN{

    public static cluster(boids : Boid[], minPts: number, ){
        let output: Boid[][] = [];
        let visited: Boid[] = [];
        let C: number = 0;

        boids.forEach(boid => {
            if(!visited.includes(boid)){
                visited.push(boid);
                let neighbours: Boid[] = this.getBoidNeighbours(boid, boids, boid.visibilityRange);
                if(neighbours.length >= minPts){
                    C++;
                    let cluster: Boid[] = [];
                    cluster.push(boid);
                    neighbours.forEach(n =>{
                        if(!visited.includes(n)){
                            visited.push(n);
                            cluster.push(n);
                            let neighboursN: Boid[] =  this.getBoidNeighbours(n, boids, n.visibilityRange);
                            if(neighboursN.length >= minPts){
                                neighboursN.forEach(nn => neighbours.push(nn))
                            }
                        } else if(!cluster.includes(n)){
                            let seen = false;
                            output.forEach(c => {
                                if(c.includes(n)){
                                    seen = true;
                                }
                            })
                            if(!seen){
                                cluster.push(n);
                            }
                        }
                    }
                    )
                    output.push(cluster);
                }
            }
        });
        return output;
    }

    static getBoidNeighbours(boid: Boid, boids: Boid[], range: number): Boid[] {
        const neighbours = [];
        for (const otherBoid of boids.filter(b=> b.isBoidAlive)) {
            if (otherBoid === boid) {
                continue;
            }
            if (boid.isOtherBoidVisible(otherBoid, range)) {
                neighbours.push(otherBoid);
            }
        }
        return neighbours;
    }
}