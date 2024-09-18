import { openModal } from "./modal.js";
import { Action, addToRulesets, Chain, flush, Interface, listRules, Module, Rule, rulesets, tryDeleteRule, tryReadIP, tryReadPort, tryReadPorts } from "./rule.js";
import { AddressPort, Network, Protocol, Segment, State, testConnection } from "./segment.js";
import { getSite, isIP, resolveDomain } from "./servers.js";
export class Flag {
    constructor(flag, value) {
        this.flag = flag;
        this.value = value;
    }
}
export class Command {
    constructor(commandName, flags, arg = null) {
        this.flags = [];
        this.arg = null;
        this.commandName = commandName;
        this.flags = flags;
        this.arg = arg;
    }
}
export function getCommandName(command) {
    return command.split(/\s+/)[0];
}
export function splitByFlags(command, expectArg = true) {
    const words = command.split(/\s+/);
    const commandName = words[0];
    let flags = [];
    let arg = null;
    for (let i = 1; i < words.length; i++) {
        // flags start with a hyphen
        if (/^-.+$/.test(words[i])) {
            const flag = words[i].match(/^.+?((?==)|$)/)[0];
            const wordsString = words.slice(i).join(" ").slice(flag.length + 1).trim();
            const value = wordsString.startsWith("\"") ?
                // selects from start quote to end quote, ignoring any escaped quotes (\")
                wordsString.match(/^".*?([^\\]")/)[0].slice(1, -1) :
                // selects any string that isn't a flag; if none exists, return null
                (wordsString.match(/^[^-]\S*/) ?? [null])[0];
            flags.push(new Flag(flag, value));
            if (value != null) {
                i += value.trim().split(/\s+/).length;
            }
        }
        else {
            if (arg == null) {
                arg = words[i];
            }
            else {
                throw "unexpected argument: " + words[i];
            }
        }
    }
    return new Command(commandName, flags, arg);
}
export function processCat(command) {
    const file = command.split('').slice("cat ".length).join('');
    if (file == "README") {
        let output = [];
        output.push("iptables-sim is a simple web-based simulator for basic iptables firewall commands, which can be accessed at https://akhilguntur.com/iptables-sim.");
        openModal('infoModal');
        return output;
    }
    else {
        throw "cat: " + file + ": no such file or directory";
    }
}
export function processNslookup(command) {
    const arg = splitByFlags(command).arg;
    const pcDNS = new AddressPort(new Network([192, 168, 0, 10]), [53]);
    const serverDNS = new AddressPort(new Network([1, 1, 1, 1]), [53]);
    const dnsResolveOut = new Segment(Protocol["udp"], pcDNS, serverDNS);
    if (testConnection(dnsResolveOut)) {
        const address = resolveDomain(arg).ipToString();
        let output = [];
        output.push("Server:\t1.1.1.1");
        output.push("Address:\t1.1.1.1#53");
        output.push("\n");
        output.push("Name:\t" + arg);
        output.push("Address:\t" + address);
        return output;
    }
    else {
        throw "could not resolve host: " + arg;
    }
}
export function processCurl(command) {
    let arg = command.split('').slice("curl ".length).join('');
    const uriParse = arg.match(/([A-Za-z]+\.)+[A-Za-z]+/);
    const protocolParse = arg.match(/[A-Za-z]+(?=:\/\/)/);
    const uri = (uriParse == null ? arg : uriParse[0]);
    const protocol = (protocolParse == null ? null : protocolParse[0]);
    if (protocol != null && protocol != "http" && protocol != "https") {
        throw "protocol \"" + protocol + "\" not supported";
    }
    const pc = new Network([192, 168, 0, 10]);
    const dnsServer = new Network([1, 1, 1, 1]);
    const webServer = new Network([1, 1, 1, 10]);
    let ip = null;
    const pcDNS = new AddressPort(pc, [53]);
    const serverDNS = new AddressPort(dnsServer, [53]);
    const dnsResolveOut = new Segment(Protocol["udp"], pcDNS, serverDNS);
    if (isIP(uri)) {
        ip = tryReadIP(uri);
    }
    if (ip != null || testConnection(dnsResolveOut)) {
        if (ip == null) {
            ip = resolveDomain(uri);
        }
        // dns resolved
        const pcHTTP = new AddressPort(pc, [80]);
        const serverHTTP = new AddressPort(webServer, [80]);
        const webOut = new Segment(Protocol["tcp"], pcHTTP, serverHTTP);
        if (testConnection(webOut)) {
            // web request worked
            return getSite(ip);
        }
        else {
            throw "connection timed out";
        }
    }
    else {
        throw "could not resolve host: " + uri;
    }
}
export function processIPTables(command) {
    const cmdSplit = splitByFlags(command);
    let hasExclusiveAction = false;
    let action = null;
    let hasTarget = false;
    let chainToAppendTo;
    let chainToDeleteFrom;
    let chainToFlushFrom;
    let expectPorts = false;
    let expectArg = false;
    let output = [];
    let rule = new Rule();
    cmdSplit.flags.forEach((arg) => {
        switch (arg.flag) {
            case '-A':
            case '--append':
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                hasExclusiveAction = true;
                action = "append";
                chainToAppendTo = Chain[arg.value];
                rule.chain = chainToAppendTo;
                break;
            case '-P':
            case '--policy':
                if (cmdSplit.arg == null || !Object.keys(Action).includes(cmdSplit.arg)) {
                    throw "invalid default policy.";
                }
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                expectArg = true;
                hasExclusiveAction = true;
                action = "policy";
                rulesets[Chain[arg.value]].defPolicy = Action[cmdSplit.arg];
                break;
            case '-S':
            case '--list-rules':
                if (arg.value != null && !Object.keys(Chain).includes(arg.value)) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                hasExclusiveAction = true;
                action = "listrules";
                output = listRules(Chain[arg.value]);
                break;
            case '-D':
            case '--delete':
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
            case '-F':
            case '--flush':
                if (arg.value != null && !Object.keys(Chain).includes(arg.value)) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                hasExclusiveAction = true;
                action = "flush";
                chainToFlushFrom = Chain[arg.value];
                break;
            case '-i':
            case '--in-interface':
                if (!Object.keys(Interface).includes(arg.value)) {
                    throw "invalid interface";
                }
                rule.in_inf = Interface[arg.value];
                break;
            case '-o':
            case '--out-interface':
                if (!Object.keys(Interface).includes(arg.value)) {
                    throw "invalid interface";
                }
                rule.out_inf = Interface[arg.value];
                break;
            case '-p':
            case '--protocol':
                if (!Object.keys(Protocol).includes(arg.value.toLowerCase())) {
                    throw "invalid protocol";
                }
                rule.protocol = Protocol[arg.value.toLowerCase()];
                if (arg.value.toLowerCase() == "icmp") {
                    rule.source.ports = [];
                    rule.dest.ports = [];
                }
                else {
                    expectPorts = true;
                }
                break;
            case '-s':
            case '--source':
                rule.source.network = tryReadIP(arg.value);
                break;
            case '-d':
            case '--destination':
                rule.dest.network = tryReadIP(arg.value);
                break;
            case '--sport':
            case '--source-port':
                if (!expectPorts) {
                    throw "port(s) unexpected. tcp or udp must be selected.";
                }
                rule.source.ports = tryReadPort(arg.value);
                rule.source.portsStr = arg.value;
                break;
            case '--dport':
            case '--destination-port':
                if (!expectPorts) {
                    throw "port(s) unexpected. tcp or udp must be selected.";
                }
                rule.dest.ports = tryReadPort(arg.value);
                rule.dest.portsStr = arg.value;
                break;
            case '--sports':
            case '--source-ports':
                if (rule.module != Module.multiport) {
                    throw `invalid flag ${arg.flag}. multiport module must be selected first.`;
                }
                if (!expectPorts) {
                    throw "port(s) unexpected. tcp or udp must be selected.";
                }
                rule.source.ports = tryReadPorts(arg.value);
                rule.source.portsStr = arg.value;
                break;
            case '--dports':
            case '--destination-ports':
                if (rule.module != Module.multiport) {
                    throw `invalid flag ${arg.flag}. multiport module must be selected first.`;
                }
                if (!expectPorts) {
                    throw "port(s) unexpected. tcp or udp must be selected.";
                }
                rule.dest.ports = tryReadPorts(arg.value);
                rule.dest.portsStr = arg.value;
                break;
            case '-m':
            case '--match':
                if (!Object.keys(Module).includes(arg.value.toLowerCase())) {
                    throw "invalid match extension. only conntrack and multiport are supported.";
                }
                rule.module = Module[arg.value.toLowerCase()];
                break;
            case '--ctstate':
                if (rule.module != Module.conntrack) {
                    throw `invalid flag ${arg.flag}. conntrack module must be selected first.`;
                }
                const states = arg.value.split(',');
                for (var state of states) {
                    if (!Object.keys(State).includes(state)) {
                        throw "invalid state.";
                    }
                }
                for (var state of states) {
                    rule.ctstate.push(State[state]);
                }
                break;
            case '-j':
            case '--jump':
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
    if (!expectArg && cmdSplit.arg != null) {
        throw "unexpected argument: " + cmdSplit.arg;
    }
    if (rule.module == Module.conntrack && rule.ctstate.length == 0) {
        throw "multiport module expects an option";
    }
    switch (action) {
        case "append":
            if (!hasTarget) {
                throw "no target action specified";
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
            flush(chainToFlushFrom);
            return output;
        case null:
            throw "no cmdSplit specified";
    }
    return output;
}
//# sourceMappingURL=command.js.map