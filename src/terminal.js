import { processCat, processCurl, processIPTables, splitByFlags } from "./command.js";
import { commandStrs, flush, /*setCommandStrs*/ } from "./rule.js";
let hist = [];
let indexAdjust = 0;
function focusInput(ele) {
    ele.lastElementChild.firstElementChild.focus({ preventScroll: true });
}
window.focusInput = focusInput;
function pushLine(ele, text, className = "line") {
    let histEle = ele.parentElement.previousElementSibling;
    let newLine = document.createElement("p");
    newLine.classList.add(className);
    newLine.innerText = text;
    histEle.appendChild(newLine);
}
function pushError(ele, text, prefix = "error") {
    pushLine(ele, prefix + ": " + text, "lineError");
}
function pushToHistory(ele, text) {
    pushLine(ele, text, "lineCommand");
    if (text != "") {
        hist.push(text);
    }
}
function addCommandToHistory(ele) {
    const command = ele.value;
    pushToHistory(ele, command);
    processCommand(ele, command);
    ele.value = "";
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
function processCommand(ele, command) {
    if (command == "") {
        // empty command is ok
        return;
    }
    else if (command.startsWith("ls")) {
        pushLine(ele, "README");
    }
    else if (command.startsWith("cat")) {
        try {
            let output = processCat(command);
            if (output.length > 0) {
                for (var line of output) {
                    pushLine(ele, line);
                }
            }
        }
        catch (error) {
            pushError(ele, error, "cat");
        }
    }
    else if (command.startsWith("sudo")) {
        processCommand(ele, command.substring("sudo".length).trim());
        return;
    }
    else if (command.startsWith("iptables")) {
        if (command === "iptables -F") {
            flush();
            return;
        }
        try {
            let iptablesCommand = splitByFlags(command.substring("iptables".length));
            let output = processIPTables(iptablesCommand, command);
            if (output.length > 0) {
                for (var line of output) {
                    pushLine(ele, line);
                }
            }
        }
        catch (error) {
            pushError(ele, error, "ipTables");
        }
        return;
    }
    else if (command === "ifconfig") {
        // the unicode characters below are spaces
        pushLine(ele, "eth0: inet 192.168.0.10\u00A0\u00A0netmask 255.255.255.0\u00A0\u00A0broadcast 192.168.0.255");
    }
    else if (command.startsWith("curl")) {
        try {
            let output = processCurl(command);
            if (output.length > 0) {
                for (var line of output) {
                    pushLine(ele, line);
                }
            }
        }
        catch (error) {
            pushError(ele, error, "curl");
        }
    }
    else if (command === "clear") {
        clear(ele);
    }
    else if (command === "history") {
        listHistory(ele);
    }
    else {
        pushError(ele, "command not found...");
        return;
    }
}
let cliInputs = document.getElementsByClassName("cliInput");
Array.from(cliInputs).forEach(element => {
    element.addEventListener("keyup", ({ key }) => {
        switch (key) {
            case "ArrowUp":
                if (indexAdjust >= 0 && indexAdjust < hist.length) {
                    indexAdjust++;
                    element.value = hist[hist.length - indexAdjust];
                }
                break;
            case "ArrowDown":
                if (indexAdjust > 1 && indexAdjust <= hist.length) {
                    indexAdjust--;
                    element.value = hist[hist.length - indexAdjust];
                }
                break;
            case "Enter":
                addCommandToHistory(element);
                const terminal = element.parentElement.parentElement;
                terminal.scrollTop = terminal.scrollHeight;
                indexAdjust = 0;
        }
    });
});
// setCommandStrs();
for (var commandStr in commandStrs) {
    processIPTables(splitByFlags(commandStr), "iptables" + commandStr);
}
//# sourceMappingURL=terminal.js.map