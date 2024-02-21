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
    args: Arg[];

    constructor(commandName: string, args: Arg[]) {
        this.commandName = commandName;
        this.args = args;
    }
}

export function splitByFlags(command: string) {
    command.replace("--", "-");
    const words: string[] = command.split("-");
    const commandName = words[0];
    let args: Arg[] = [];
    for (let i = 1; i < words.length; i++) {
        const tempArgs: string[] = words[i].split(" ")
        if (tempArgs.length != 2) {
            throw new Error("options require arguments")
        }
        args.push(new Arg(tempArgs[0], tempArgs[1]));
    }
    return new Command(commandName, args);
}

export function processIPTables(command: Command) {
    // will have to create an object called "Rule"
    // this function will output that object
    // and then add it to a greater Ruleset
}