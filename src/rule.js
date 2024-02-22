export var rulesets = [];
class Network {
    constructor(ip = [0, 0, 0, 0], mask = 32) {
        this.ip = ip;
        this.mask = mask;
    }
}
class AddressPort {
    constructor() {
        this.network = new Network();
        this.ports = [];
    }
}
export var Interface;
(function (Interface) {
    Interface[Interface["lo"] = 0] = "lo";
    Interface[Interface["eth0"] = 1] = "eth0";
})(Interface || (Interface = {}));
;
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
export var Action;
(function (Action) {
    Action[Action["DROP"] = 0] = "DROP";
    Action[Action["ACCEPT"] = 1] = "ACCEPT";
})(Action || (Action = {}));
;
export class Rule {
    constructor() {
        this.protocol = 3;
        this.source = new AddressPort();
        this.dest = new AddressPort();
    }
}
export class Ruleset {
    constructor(name, rules = null) {
        this.rules = [];
        this.name = name;
        if (rules != null) {
            this.rules.push(rules);
        }
    }
}
export function addToRulesets(rulesetName, newRule) {
    rulesets.forEach((ruleset) => {
        if (ruleset.name === rulesetName) {
            ruleset.rules.push(newRule);
            return;
        }
    });
    rulesets.push(new Ruleset(rulesetName, newRule));
}
function tryReadIntInRange(str, lowerBound, upperBound) {
    let hasChars = str.split("").some(character => isNaN(parseInt(character)));
    if (hasChars) {
        return false;
    }
    let attempt = parseInt(str);
    if (attempt < lowerBound || attempt > upperBound) {
        return false;
    }
    return true;
}
// TODO: REVERT IP ADDRESS TO NETWORK ADDRESS IF IP AND MASK ARE VALID
export function tryReadIP(ipString) {
    // try to read mask (if provided)
    let ipStringArr = ipString.split("/");
    let numberMask = 32;
    if (ipStringArr.length == 2 && tryReadIntInRange(ipStringArr[1], 0, 32)) {
        numberMask = parseInt(ipStringArr[1]);
    }
    else if (ipStringArr.length == 1) { /* acceptable */ }
    else {
        throw new Error("invalid network");
    }
    // try to read ip address
    ipStringArr = ipStringArr[0].split(".");
    if (ipStringArr.length != 4) {
        throw new Error("invalid ip address");
    }
    let numberIP = [];
    ipStringArr.forEach((octet) => {
        if (!tryReadIntInRange(octet, 0, 255)) {
            throw new Error("invalid ip address");
        }
        else {
            numberIP.push(parseInt(octet));
        }
    });
    if (numberIP.length != 4) {
        throw new Error("invalid ip address");
    }
    return new Network(numberIP, numberMask);
}
export function tryReadPort(portString) {
    let ports = [];
    const port = portString.split(":");
    if (port.length == 1 && tryReadIntInRange(port[0], 0, 65535)) {
        ports.push(parseInt(port[0]));
    }
    else if (port.length == 2 && tryReadIntInRange(port[0], 0, 65535) && tryReadIntInRange(port[1], 0, 65535)) {
        if (parseInt(port[0]) > parseInt(port[1])) {
            throw new Error("invalid port(s)");
        }
        for (let i = parseInt(port[0]); i <= parseInt(port[1]); i++) {
            ports.push(i);
        }
    }
    else {
        throw new Error("invalid port(s)");
    }
    return ports;
}
export function tryReadPorts(portString) {
    let ports = [];
    const ranges = portString.split(",");
    ranges.forEach((range) => {
        tryReadPort(range).forEach((port) => {
            ports.push(port);
        });
    });
    return ports;
}
//# sourceMappingURL=rule.js.map