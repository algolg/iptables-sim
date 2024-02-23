import { Network, AddressPort } from "./segment.js";
export var rulesets = [];
export var Chain;
(function (Chain) {
    Chain[Chain["INPUT"] = 0] = "INPUT";
    Chain[Chain["OUTPUT"] = 1] = "OUTPUT";
})(Chain || (Chain = {}));
;
export var Interface;
(function (Interface) {
    Interface[Interface["lo"] = 0] = "lo";
    Interface[Interface["eth0"] = 1] = "eth0";
})(Interface || (Interface = {}));
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
    constructor(chain, rules = null) {
        this.rules = [];
        this.chain = chain;
        if (rules != null) {
            this.rules.push(rules);
        }
    }
}
export function addToRulesets(rulesetChain, newRule) {
    rulesets.forEach((ruleset) => {
        if (ruleset.chain === rulesetChain) {
            ruleset.rules.push(newRule);
            return;
        }
    });
    rulesets.push(new Ruleset(rulesetChain, newRule));
    console.log(rulesets);
}
function tryReadIntInRange(str, lowerBound, upperBound) {
    let hasChars = str.split("").some(character => isNaN(parseInt(character)));
    if (hasChars) {
        return false;
    }
    let attempt = parseInt(str);
    if (isNaN(attempt) || attempt < lowerBound || attempt > upperBound) {
        return false;
    }
    return true;
}
function getNetworkAddress(ipAddress, mask) {
    let netAddress = [];
    let AND;
    for (let i = 0; i < 4; i++, mask -= 8) {
        AND = mask >= 8 ? 255 : 256 - Math.pow(2, 8 - mask);
        netAddress.push(ipAddress[i] & AND);
    }
    return netAddress;
}
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
    return new Network(getNetworkAddress(numberIP, numberMask), numberMask);
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