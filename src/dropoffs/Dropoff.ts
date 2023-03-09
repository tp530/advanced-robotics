

export interface DropoffOptions{
    minConst?: number;
    maxConst?: number;
}


export abstract class Dropoff{
    abstract readonly name: string;
    abstract readonly func: string;

    constant: number;

    readonly minConst: number;
    readonly maxConst: number;

    constructor(constant: number, options?: DropoffOptions){
        this.constant = constant
        this.minConst = options?.minConst ?? 0.1
        this.maxConst = options?.maxConst ?? 2 * constant
    }

    abstract fn(dist: number): number
}