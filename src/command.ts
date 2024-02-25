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
            throw new Error("options require arguments")
        }
        args.push(new Arg(tempArgs[0], tempArgs.slice(1).join(',')));
    }
    return new Command(commandName, args);
}

export function processIPTables(command: Command, commandStr: string) : string[] {
    let hasAppend = false;
    let hasTarget = false;

    let tryDelete = false;
    let chainToDeleteFrom: Chain;
    let bypass = false;

    let output = [];
    let rule: Rule = new Rule(commandStr);

    command.args.forEach((arg) => {
        switch (arg.flag) {
            case 'A':
            case 'append':
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw new Error("invalid chain. only INPUT and OUTPUT are supported.");
                }
                if (tryDelete) {
                    throw new Error("invalid combination of flags.");
                }
                addToRulesets(Chain[arg.value], rule);
                hasAppend = true;
                break;
            case 'i':
            case 'in-interface':
                if (!Object.keys(Interface).includes(arg.value)) {
                    throw new Error("invalid interface");
                }
                rule.in_inf = Interface[arg.value];
                break;
            case 'o':
            case 'out-interface':
                if (!Object.keys(Interface).includes(arg.value)) {
                    throw new Error("invalid interface");
                }
                rule.out_inf = Interface[arg.value];
                break;
            case 'p':
            case 'protocol':
                if (!Object.keys(Protocol).includes(arg.value)) {
                    throw new Error("invalid protocol");
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
                    throw new Error("invalid target")
                }
                rule.action = Action[arg.value];
                hasTarget = true;
                break;
            case 'P':
            case 'policy':
                const parseArr = arg.value.split(',');
                if (parseArr.length != 2 || !Object.keys(Action).includes(parseArr[1])) {
                    throw new Error("invalid default policy.");
                }
                if (!Object.keys(Chain).includes(parseArr[0])) {
                    throw new Error("invalid chain. only INPUT and OUTPUT are supported.");
                }
                rulesets[Chain[parseArr[0]]].defPolicy = Action[parseArr[1]];
                bypass = true;
                break;
            case 'S':
            case 'list-rules':
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw new Error("invalid chain. only INPUT and OUTPUT are supported.");
                }
                output = listRules(Chain[arg.value]);
                bypass = true;
                break;
            case 'D':
            case 'delete':
                if (!Object.keys(Chain).includes(arg.value)) {
                    throw new Error("invalid chain. only INPUT and OUTPUT are supported.");
                }
                if (hasAppend) {
                    throw new Error("invalid combination of flags.")
                }
                chainToDeleteFrom = Chain[arg.value];
                tryDelete = true;
                bypass = true;
                break;
            default:
                throw new Error("unknown flag: " + arg.flag);
        }
    });
    if (!(hasAppend || bypass)) {
        throw new Error("no command specified");
    }
    if (!(hasTarget || bypass)) {
        throw new Error("no target action specified");
    }
    if (tryDelete) {
        tryDeleteRule(chainToDeleteFrom, rule);
    }
    return output;
}