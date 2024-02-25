import { Rule, addToRulesets, tryReadIP, Action, Interface, tryReadPort, tryReadPorts, Chain, rulesets, tryDeleteRule, listRules } from "./rule.js";
import { Protocol, State } from "./segment.js";

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

export function processIPTables(command: Command, commandStr: string) : string[] {
    let hasAppend = false;
    let hasTarget = false;
    let tryDelete = false;
    let hasExclusiveAction = false;

    let chainToDeleteFrom: Chain;
    let bypass = false;

    let output = [];
    let rule: Rule = new Rule(commandStr);

    command.args.forEach((arg) => {
        switch (arg.flag) {
            case 'A':
            case 'append':
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw "invalid chain. only INPUT and OUTPUT are supported.";
                }
                if (tryDelete || hasExclusiveAction) {
                    throw "invalid combination of flags.";
                }
                hasExclusiveAction = true;
                hasAppend = true;
                addToRulesets(Chain[arg.value], rule);
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
                bypass = true;
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
                output = listRules(Chain[arg.value]);
                bypass = true;
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
                chainToDeleteFrom = Chain[arg.value];
                tryDelete = true;
                bypass = true;
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
                rule.source.ports = tryReadPort(arg.value);
                break;
            case 'dport':
            case 'destination-port':
                rule.source.ports = tryReadPort(arg.value);
                break;
            case 'sports':
            case 'source-ports':
                rule.source.ports = tryReadPorts(arg.value);
                break;
            case 'dports':
            case 'destination-ports':
                rule.source.ports = tryReadPorts(arg.value);
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
    if (!(hasAppend || bypass)) {
        throw "no command specified";
    }
    if (!(hasTarget || bypass)) {
        throw "no target action specified";
    }
    if (tryDelete) {
        tryDeleteRule(chainToDeleteFrom, rule);
    }
    return output;
}