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

import { Action, Chain, Interface, getNetworkAddress, rulesets } from "./rule.js";

export class Network {
    ip: number[];
    mask: number;

    constructor(ip: number[] = [0,0,0,0], mask: number = 0) {
        this.ip = ip;
        this.mask = mask;
    }
    public ipToString() : string {
        return this.ip[0] + '.' + this.ip[1] + '.' + this.ip[2] + '.' + this.ip[3];
    }
    public toString() : string {
        return this.ipToString() + '/' + this.mask
    }
}

export class AddressPort {
    network: Network = new Network();
    ports: number[] = [];

    constructor(network: Network = new Network(), ports: number[] = []) {
        this.network = network;
        this.ports = ports;
    }
}

export enum Protocol { tcp = 0, udp = 1, icmp = 2, all = 3 };
export enum State { INVALID = 0, ESTABLISHED = 1, NEW = 2, RELATED = 3 };

export class Segment {
    protocol: Protocol;
    source: AddressPort
    dest: AddressPort;

    constructor(protocol: Protocol, source: AddressPort, dest: AddressPort) {
        this.protocol = protocol;
        this.source = source;
        this.dest = dest;
    }
}

function doesIpMatch(ip: number[], subnet: Network) : boolean {
    return getNetworkAddress(ip, subnet.mask).every((ele, i) => ele === subnet.ip[i]);
}

export function trySendSegment(segment: Segment, chain: Chain, in_inf: Interface = null, out_inf: Interface = null) : boolean {
    for (var rule of rulesets[chain].rules) {
        if ((rule.in_inf == null || rule.in_inf == in_inf) && (rule.out_inf == null || rule.out_inf == out_inf)) {
            if (doesIpMatch(segment.source.network.ip, rule.source.network) && doesIpMatch(segment.dest.network.ip, rule.dest.network)) {
                if (rule.protocol == Protocol["all"] || segment.protocol == rule.protocol) {
                    if (segment.protocol == Protocol["icmp"]) {
                        return rule.action == Action["ACCEPT"];
                    }
                    if ((rule.source.ports.length == 0 || rule.source.ports.includes(segment.source.ports[0])) && (rule.dest.ports.length == 0 || rule.dest.ports.includes(segment.dest.ports[0]))) {
                        return rule.action == Action["ACCEPT"];
                    }
                }
            }
        }
    }
    return rulesets[Chain["INPUT"]].defPolicy == Action["ACCEPT"];
}