import { Rule, addToRulesets, tryReadIP, Protocol, Action, Interface, tryReadPort, tryReadPorts } from "./rule.js";
export class Arg {
    constructor(flag, value) {
        this.flag = flag;
        this.value = value;
    }
}
export class Command {
    constructor(commandName, args) {
        this.args = [];
        this.commandName = commandName;
        this.args = args;
    }
}
export function splitByFlags(command) {
    command = command.replace(/--/g, "-");
    const words = command.split(" -");
    const commandName = words[0];
    let args = [];
    for (let i = 1; i < words.length; i++) {
        const tempArgs = words[i].split(" ");
        if (tempArgs.length < 2) {
            throw new Error("options require arguments");
        }
        args.push(new Arg(tempArgs[0], tempArgs.slice(1).join('')));
    }
    return new Command(commandName, args);
}
export function processIPTables(command) {
    //let rulesetName: string;
    //let append: boolean = false;
    let added = false;
    let rule = new Rule();
    command.args.forEach((arg) => {
        switch (arg.flag) {
            case 'A':
            case 'append':
                addToRulesets(arg.value, rule);
                added = true;
                break;
            case 'i':
            case 'in-interface':
                if (!Object.keys(Interface).includes(arg.value)) {
                    console.log(arg.value);
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
                break;
            case 's':
            case 'source':
                rule.source.network = tryReadIP(arg.value);
                break;
            case 'd':
            case 'destination':
                rule.source.network = tryReadIP(arg.value);
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
                    throw new Error("invalid target");
                }
                rule.protocol = Action[arg.value];
                break;
            default:
                throw new Error("unknown flag: " + arg.flag);
        }
    });
    if (!added) {
        throw new Error("no command specified");
    }
}
//# sourceMappingURL=command.js.map