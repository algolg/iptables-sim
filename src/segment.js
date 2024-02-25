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
import { Action, Chain, getNetworkAddress, rulesets } from "./rule.js";
export class Network {
    constructor(ip = [0, 0, 0, 0], mask = 0) {
        this.ip = ip;
        this.mask = mask;
    }
    ipToString() {
        return this.ip[0] + '.' + this.ip[1] + '.' + this.ip[2] + '.' + this.ip[3];
    }
    toString() {
        return this.ipToString() + '/' + this.mask;
    }
}
export class AddressPort {
    constructor(network = new Network(), ports = []) {
        this.network = new Network();
        this.ports = [];
        this.network = network;
        this.ports = ports;
    }
}
export var Protocol;
(function (Protocol) {
    Protocol[Protocol["tcp"] = 0] = "tcp";
    Protocol[Protocol["udp"] = 1] = "udp";
    Protocol[Protocol["icmp"] = 2] = "icmp";
    Protocol[Protocol["all"] = 3] = "all";
})(Protocol || (Protocol = {}));
;
export var State;
(function (State) {
    State[State["INVALID"] = 0] = "INVALID";
    State[State["ESTABLISHED"] = 1] = "ESTABLISHED";
    State[State["NEW"] = 2] = "NEW";
    State[State["RELATED"] = 3] = "RELATED";
})(State || (State = {}));
;
export class Segment {
    constructor(protocol, source, dest) {
        this.protocol = protocol;
        this.source = source;
        this.dest = dest;
    }
}
function doesIpMatch(ip, subnet) {
    return getNetworkAddress(ip, subnet.mask).every((ele, i) => ele === subnet.ip[i]);
}
export function trySendSegment(segment) {
    for (var rule of rulesets[Chain["INPUT"]].rules) {
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
    return rulesets[Chain["INPUT"]].defPolicy == Action["ACCEPT"];
}
//# sourceMappingURL=segment.js.map