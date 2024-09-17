import { processCat, processCurl, processIPTables, getCommandName, splitByFlags, processNslookup } from "./command.js";
import { commandStrs, flush, /*setCommandStrs*/ } from "./rule.js";
import { resolveDomain } from "./servers.js";

let hist: string[] = [];
let indexAdjust = 0;

function focusInput(ele) {
    ele.lastElementChild.firstElementChild.focus({preventScroll:true});
} (<any>window).focusInput = focusInput;

function pushLine(ele, text: string, className = "line") {
    let histEle = ele.parentElement.previousElementSibling;
    let newLine = document.createElement("p");
    newLine.classList.add(className);
    newLine.innerText = text;

    histEle.appendChild(newLine);
}

function pushLines(ele, output: string[], className = "line") {
    if (output.length > 0) {
        for (var line of output) {
            pushLine(ele, line, className);
        }
    }
}

function pushError(ele, text: string, prefix = "error") {
    pushLine(ele, prefix + ": " +  text, "lineError");
}

function pushToHistory(ele, text: string) {
    pushLine(ele, text, "lineCommand");

    if (text != "") {
        hist.push(text);
    }
}

function addCommandToHistory(ele) {
    const command = ele.innerText.replaceAll("\n", "");
    pushToHistory(ele, command);
    processCommand(ele, command)
    ele.innerText = "";
}

function clear(ele) {
    let histEle = ele.parentElement.previousElementSibling;
    histEle.replaceChildren();
}

function listHistory(ele) {
    for (var command of hist) {
        pushLine(ele, command);
    }
}

function processCommand(ele, command: string) {
    let commandName = getCommandName(command);
    switch (commandName) {
        case '':
            // empty command is ok
            return;
        case 'ls':
            pushLine(ele, "README");
            return;
        case 'cat':
            try {
                const output = processCat(command);
                pushLines(ele, output);
            } catch (error) {
                pushError(ele, error, "cat");
            }
            return;
        case 'sudo':
            processCommand(ele, command.substring("sudo".length).trim());
            return;
        case 'iptables':
            try {
                const output = processIPTables(command);
                pushLines(ele, output);
            } catch (error) {
                pushError(ele, error, "iptables");
            }
            return;
        case 'ifconfig':
            // the unicode characters below are spaces
            pushLine(ele, "eth0: inet 192.168.0.10\u00A0\u00A0netmask 255.255.255.0\u00A0\u00A0broadcast 192.168.0.255")
            return;
        case 'nslookup':
            try {
                const output = processNslookup(command);
                pushLines(ele, output);
            } catch (error) {
                pushError(ele, error, "nslookup")
            }
            return;
        case 'curl':
            try {
                const output = processCurl(command);
                pushLines(ele, output);
            } catch (error) {
                pushError(ele, error, "curl");
            }
            return;
        case 'clear':
            clear(ele);
            return;
        case 'history':
            listHistory(ele);
            return;
        default:
            pushError(ele, "command not found");
            return;
    }
}

let cliInputs = document.getElementsByClassName("cliInput") as HTMLCollectionOf<HTMLInputElement>;
Array.from(cliInputs).forEach(element => {
    element.addEventListener("keyup", ({key}) => {
        switch (key) {
            case "ArrowUp":
                if (indexAdjust >= 0 && indexAdjust < hist.length) {
                    indexAdjust++;
                    element.innerText = hist[hist.length - indexAdjust];
                }
                break;
            case "ArrowDown":
                if (indexAdjust > 1 && indexAdjust <= hist.length) {
                    indexAdjust--;
                    element.innerText = hist[hist.length - indexAdjust];
                }
                break;
            case "Enter":
                addCommandToHistory(element);
                const terminal = element.parentElement!.parentElement!;
                terminal.scrollTop = terminal.scrollHeight;
                indexAdjust = 0;
        }
    });
    element.addEventListener("paste", (event) => {
        event.preventDefault();

        let paste = event.clipboardData.getData("text");
        const lines = paste.split("\n");
        for (var i = 0; i < lines.length-1; i++) {
            element.innerText = lines[i];
            addCommandToHistory(element);
        }
        const terminal = element.parentElement!.parentElement!;
        terminal.scrollTop = terminal.scrollHeight;
        indexAdjust = 0;
        paste = lines[i];

        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(document.createTextNode(paste));
        selection.collapseToEnd();
    });
});
// setCommandStrs();
for (var commandStr in commandStrs) {
    processIPTables(commandStr);
}
