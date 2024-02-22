import { processIPTables, splitByFlags } from "./command.js";
let hist = [];
let indexAdjust = 0;
function focusInput(ele) {
    ele.lastElementChild.firstElementChild.focus();
}
window.focusInput = focusInput;
function pushError(ele, text, className = "lineError") {
    let histEle = ele.parentElement.previousElementSibling;
    let newLine = document.createElement("p");
    newLine.classList.add(className);
    newLine.innerText = text;
    histEle.appendChild(newLine);
}
function pushToHistory(ele, text) {
    let histEle = ele.parentElement.previousElementSibling;
    let newLine = document.createElement("p");
    newLine.classList.add("line");
    newLine.innerText = text;
    histEle.appendChild(newLine);
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
function processCommand(ele, command) {
    if (command == "") {
        // empty command is ok
        return;
    }
    else if (command.startsWith("sudo")) {
        processCommand(ele, command.substring("sudo".length).trim());
        return;
    }
    else if (command.startsWith("iptables")) {
        try {
            let iptablesCommand = splitByFlags(command.substring("iptables".length));
            processIPTables(iptablesCommand);
        }
        catch (error) {
            pushError(ele, error, "ipTables");
        }
        return;
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
//# sourceMappingURL=terminal.js.map