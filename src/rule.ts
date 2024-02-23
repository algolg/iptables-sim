import { Network, AddressPort, Protocol, State } from "./segment.js";

export var rulesets: Ruleset[] = [];

export enum Chain { INPUT = 0, OUTPUT = 1 };
export enum Interface { lo = 0, eth0 = 1 };
export enum Action { DROP = 0, ACCEPT = 1 };

export class Rule {
    in_inf: Interface;
    out_inf: Interface;
    protocol: Protocol = 3;
    source: AddressPort = new AddressPort();
    dest: AddressPort = new AddressPort();
    // conntrack: boolean = false;
    // cstate: State[] = [0];
    action: Action;
}

export class Ruleset {
    chain: Chain;
    rules: Rule[] = [];

    constructor(chain: Chain, rules: Rule = null) {
        this.chain = chain;
        if (rules != null) {
            this.rules.push(rules);
        }
    }
}

export function addToRulesets(rulesetChain: Chain, newRule: Rule) {
    rulesets.forEach((ruleset) => {
        if (ruleset.chain === rulesetChain) {
            ruleset.rules.push(newRule);
            return;
        }
    });
    rulesets.push(new Ruleset(rulesetChain, newRule));
}

function tryReadIntInRange(str: string, lowerBound: number, upperBound: number) : boolean {
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

function getNetworkAddress(ipAddress: number[], mask: number) : number[] {
    let netAddress: number[] = [];
    let AND: number;
    for (let i = 0; i < 4; i++, mask -= 8) {
        AND = mask >= 8 ? 255 : 256 - Math.pow(2, 8 - mask);
        netAddress.push(ipAddress[i] & AND);
    }
    return netAddress;
}

export function tryReadIP(ipString: string) : Network {
    // try to read mask (if provided)
    let ipStringArr: string[] = ipString.split("/");
    let numberMask = 32;
    if (ipStringArr.length == 2 && tryReadIntInRange(ipStringArr[1], 0, 32)) {
        numberMask = parseInt(ipStringArr[1]);
    }
    else if (ipStringArr.length == 1) {/* acceptable */}
    else {
        throw new Error("invalid network");
    }
    // try to read ip address
    ipStringArr = ipStringArr[0].split(".");
    if (ipStringArr.length != 4) {
        throw new Error("invalid ip address");
    }
    let numberIP: number[] = [];
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

export function tryReadPort(portString: string) : number[] {
    let ports: number[] = [];
    const port: string[] = portString.split(":");
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

export function tryReadPorts(portString: string) : number[] {
    let ports: number[] = [];
    const ranges = portString.split(",");
    ranges.forEach((range) => {
        tryReadPort(range).forEach((port) => {
            ports.push(port);
        });
    });
    return ports;
}
