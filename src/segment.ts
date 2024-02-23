/**
 * The system of networking will be over-simplified here
 * 
 * I won't be implementing a way for states to be
 * negotiated, simply because it isn't needed for
 * the purpose of the program
 * 
 * Unless firewall rules prevent it, TCP sessions
 * can be assumed to be automatically established
 */


export class Network {
    ip: number[];
    mask: number;

    constructor(ip: number[] = [0,0,0,0], mask: number = 32) {
        this.ip = ip;
        this.mask = mask;
    }
}

export class AddressPort {
    network: Network = new Network();
    ports: number[] = [];
}

export enum Protocol { tcp = 0, udp = 1, icmp = 2, all = 3 };
export enum State { INVALID = 0, ESTABLISHED = 1, NEW = 2, RELATED = 3 };

export class Segment {
    protocol: Protocol;
    source: AddressPort
    dest: AddressPort;
}