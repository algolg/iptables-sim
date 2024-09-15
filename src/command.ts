import { Action, addToRulesets, Chain, flushChain, Interface, listRules, Rule, rulesets, tryDeleteRule, tryReadIP, tryReadPort, tryReadPorts } from "./rule.js";
import { AddressPort, Network, Protocol, Segment, State, trySendSegment } from "./segment.js";
import { getSite, isIP, resolveDomain } from "./servers.js";

export class Arg {
    flag: string;
    value: string;

    constructor(flag: string, value: string) {
        this.flag = flag;
        this.value = value;
    }
}

export class Command {
    commandName: string;
    args: Arg[] = [];

    constructor(commandName: string, args: Arg[]) {
        this.commandName = commandName;
        this.args = args;
    }
}

export function splitByFlags(command: string): Command {
    command = command.replace(/--/g, "-");
    command = command.replace(/\"/g, "");
    command = command.replace(/\s+/g, " ");
    const words: string[] = command.split(" -");
    const commandName = words[0];
    let args: Arg[] = [];
    for (let i = 1; i < words.length; i++) {
        const tempArgs: string[] = words[i].split(" ")
        if (tempArgs.length < 2) {
            throw "options require arguments";
        }
        args.push(new Arg(tempArgs[0], tempArgs.slice(1).join(',')));
    }
    return new Command(commandName, args);
}

export function processCat(command: string) : string[] {
    const file = command.split('').slice("cat ".length).join('');
    if (file == "README") {
        let output: string[] = [];
        output.push("iptables-sim is a simple web-based simulator for basic iptables firewall");
        output.push("commands, which can be accessed at https://algolg.github.io/iptables-sim.");
        return output;
    }
    else {
        throw "cat: " + file + ": no such file or directory"
    }
}

export function processCurl(command: string) : string[] {
    let arg = command.split('').slice("curl ".length).join('');
    let urlParse = arg.match(/[A-Za-z]+\.[A-Za-z]+/);
    const url = (urlParse == null ? arg : urlParse[0]);

    const pc = new Network([192,168,0,10]);
    const dnsServer = new Network([1,1,1,1]);
    const webServer = new Network([1,1,1,10]);
    
    let ip: Network = null;

    let pcDNS = new AddressPort(pc, [53]);
    let serverDNS = new AddressPort(dnsServer, [53]);
    let dnsResolveOut = new Segment(Protocol["udp"], pcDNS, serverDNS);
    let dnsResolveIn = new Segment(Protocol["udp"], serverDNS, pcDNS);
    if (isIP(url)) {
        ip = tryReadIP(url);
    }
    if (ip != null || (trySendSegment(dnsResolveOut, Chain["OUTPUT"], undefined, Interface["eth0"]) && trySendSegment(dnsResolveIn, Chain["INPUT"], Interface["eth0"]))) {
        if (ip == null) {
            ip = resolveDomain(url);
        }
        // dns resolved
        let pcHTTP = new AddressPort(pc, [80]);
        let serverHTTP = new AddressPort(webServer, [80]);
        let webOut = new Segment(Protocol["tcp"], pcHTTP, serverHTTP);
        let webIn = new Segment(Protocol["tcp"], serverHTTP, pcHTTP);
        if (trySendSegment(webOut, Chain["OUTPUT"], undefined, Interface["eth0"]) && trySendSegment(webIn, Chain["INPUT"], Interface["eth0"])) {
            // web request worked
            return getSite(ip);
        }
        else {
            throw "connection timed out";
        }
    }
    else {
        throw "could not resolve host: " + url;
    }
}

export function processIPTables(command: Command, commandStr: string) : string[] {
    let hasExclusiveAction = false;
    let action: string = null;

    let hasTarget = false;
    let chainToAppendTo: Chain;
    let chainToDeleteFrom: Chain;
    let chainToFlushFrom: Chain;

    let expectPorts = false;

    let output = [];
    let rule: Rule = new Rule(commandStr.substring("iptables".length));

    command.args.forEach((arg) => {
        switch (arg.flag) {
            case 'A':
            case 'append':
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                hasExclusiveAction = true;
                action = "append";
                chainToAppendTo = Chain[arg.value];
                break;
            case 'P':
            case 'policy':
                const parseArr = arg.value.split(',');
                if (parseArr.length != 2 || !Object.keys(Action).includes(parseArr[1])) {
                    throw "invalid default policy.";
                }
                if (!Object.keys(Chain).includes(parseArr[0])) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                hasExclusiveAction = true;
                action = "policy";
                rulesets[Chain[parseArr[0]]].defPolicy = Action[parseArr[1]];
                break;
            case 'S':
            case 'list-rules':
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                hasExclusiveAction = true;
                action = "listrules"
                output = listRules(Chain[arg.value]);
                break;
            case 'D':
            case 'delete':
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                hasExclusiveAction = true;
                action = "delete";
                chainToDeleteFrom = Chain[arg.value];
                break;
            case 'F':
            case 'flush':
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                hasExclusiveAction = true;
                action = "flush";
                chainToFlushFrom = Chain[arg.value];
                break;
            case 'i':
            case 'in-interface':
                if (!Object.keys(Interface).includes(arg.value)) {
                    throw "invalid interface";
                }
                rule.in_inf = Interface[arg.value];
                break;
            case 'o':
            case 'out-interface':
                if (!Object.keys(Interface).includes(arg.value)) {
                    throw "invalid interface";
                }
                rule.out_inf = Interface[arg.value];
                break;
            case 'p':
            case 'protocol':
                if (!Object.keys(Protocol).includes(arg.value)) {
                    throw "invalid protocol";
                }
                rule.protocol = Protocol[arg.value];
                if (arg.value == "icmp") {
                    rule.source.ports = [];
                    rule.dest.ports = [];
                }
                else {
                    expectPorts = true;
                }
                break;
            case 's':
            case 'source':
                rule.source.network = tryReadIP(arg.value);
                break;
            case 'd':
            case 'destination':
                rule.dest.network = tryReadIP(arg.value);
                break;
            case 'sport':
            case 'source-port':
                if (!expectPorts) {
                    throw "port(s) unexpected. tcp or udp must be selected."
                }
                rule.source.ports = tryReadPort(arg.value);
                break;
            case 'dport':
            case 'destination-port':
                if (!expectPorts) {
                    throw "port(s) unexpected. tcp or udp must be selected."
                }
                rule.source.ports = tryReadPort(arg.value);
                break;
            case 'sports':
            case 'source-ports':
                if (!expectPorts) {
                    throw "port(s) unexpected. tcp or udp must be selected."
                }
                rule.source.ports = tryReadPorts(arg.value);
                break;
            case 'dports':
            case 'destination-ports':
                if (!expectPorts) {
                    throw "port(s) unexpected. tcp or udp must be selected."
                }
                rule.source.ports = tryReadPorts(arg.value);
                break;
            case 'm':
            case '--match':
                if (arg.value != "conntrack") {
                    throw "invalid match extension. only conntrack is supported.";
                }
                rule.conntrack = true;
                break;
            case 'ctstate':
                const states = arg.value.split(',');
                for (var state of states) {
                    if (!Object.keys(State).includes(state)) {
                        throw "invalid state.";
                    }
                }
                for (var state of states) {
                    rule.cstate.push(State[state]);
                }
                break;
            case 'j':
            case 'jump':
                if (!Object.keys(Action).includes(arg.value)) {
                    throw "invalid target";
                }
                rule.action = Action[arg.value];
                hasTarget = true;
                break;
            default:
                throw "unknown flag: " + arg.flag;
        }
    });
    switch (action) {
        case "append":
            if (!hasTarget) {
                throw "no target action specified"
            }
            addToRulesets(chainToAppendTo, rule);
            return output;
        case "policy":
        case "listrules":
            return output;
        case "delete":
            tryDeleteRule(chainToDeleteFrom, rule);
            return output;
        case "flush":
            flushChain(chainToFlushFrom);
            return output;
        case null:
            throw "no command specified"
    }
    return output;
}
