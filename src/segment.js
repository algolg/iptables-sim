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
let stateTable = [];
function tryAddToStateTable(segment, chain, action) {
    if (action == Action["ACCEPT"] && chain == Chain["OUTPUT"]) {
        stateTable.push(segment);
    }
}
function compareNetwork(a, b) {
    return (a.mask === b.mask) && (a.ip.every((ele, i) => ele === b.ip[i]));
}
function compareAddressPort(a, b) {
    return compareNetwork(a.network, b.network) && (a.ports.every((ele, i) => ele === b.ports[i]));
}
function doesIpMatch(ip, subnet) {
    return getNetworkAddress(ip, subnet.mask).every((ele, i) => ele === subnet.ip[i]);
}
export function trySendSegment(segment, chain, in_inf = null, out_inf = null) {
    for (var rule of rulesets[chain].rules) {
        if (rule.conntrack && rule.cstate.includes(State["ESTABLISHED"])) {
            for (var [index, state] of stateTable.entries()) {
                if (segment.protocol == state.protocol && compareAddressPort(segment.source, state.dest) && compareAddressPort(segment.dest, state.source)) {
                    stateTable.splice(index, 1);
                    return rule.action == Action["ACCEPT"];
                }
            }
            continue;
        }
        if ((rule.in_inf == null || rule.in_inf == in_inf) && (rule.out_inf == null || rule.out_inf == out_inf)) {
            if (doesIpMatch(segment.source.network.ip, rule.source.network) && doesIpMatch(segment.dest.network.ip, rule.dest.network)) {
                if (rule.protocol == Protocol["all"] || segment.protocol == rule.protocol) {
                    if (segment.protocol == Protocol["icmp"]) {
                        return rule.action == Action["ACCEPT"];
                    }
                    if ((rule.source.ports.length == 0 || rule.source.ports.includes(segment.source.ports[0])) && (rule.dest.ports.length == 0 || rule.dest.ports.includes(segment.dest.ports[0]))) {
                        tryAddToStateTable(segment, chain, rule.action);
                        return rule.action == Action["ACCEPT"];
                    }
                }
            }
        }
    }
    tryAddToStateTable(segment, chain, rulesets[Chain["INPUT"]].defPolicy);
    return rulesets[Chain["INPUT"]].defPolicy == Action["ACCEPT"];
}
//# sourceMappingURL=segment.js.map