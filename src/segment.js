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
    constructor(ip = [0, 0, 0, 0], mask = 32) {
        this.ip = ip;
        this.mask = mask;
    }
}
export class AddressPort {
    constructor() {
        this.network = new Network();
        this.ports = [];
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
}
//# sourceMappingURL=segment.js.map