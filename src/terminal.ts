let hist: string[] = [];
let indexAdjust = 0;

function focusInput(ele) {
    ele.lastElementChild.firstElementChild.focus();
}

function pushToHistory(ele, text, className = "") {
    let histEle = ele.parentElement.previousElementSibling;
    let newLine = document.createElement("p");
    newLine.classList.add(className);
    newLine.innerText = text;

    histEle.appendChild(newLine);
    hist.push(text);
}

function addCommandToHistory(ele) {
    const text = ele.value;
    pushToHistory(ele, text, "line");
    ele.value = "";
}

function processCommand(command) {
    if (command == "") {
        // empty command is acceptable
        return;
    }
    else if (command.startsWith("sudo")) {
        processCommand(command.substring(5));
        return;
    }
    else if (command.startsWith("iptables")) {
        
    }
}

let cliInput = document.getElementById("cliInput") as HTMLInputElement;
cliInput.addEventListener("keyup", ({key}) => {
    switch (key) {
        case "ArrowUp":
            if (indexAdjust >= 0 && indexAdjust < hist.length) {
                indexAdjust++;
                cliInput.value = hist[hist.length - indexAdjust];
            }
            break;
        case "ArrowDown":
            if (indexAdjust > 1 && indexAdjust <= hist.length) {
                indexAdjust--;
                cliInput.value = hist[hist.length - indexAdjust];
            }
            break;
        case "Enter":
            addCommandToHistory(cliInput);
            const terminal = cliInput.parentElement!.parentElement!;
            terminal.scrollTop = terminal.scrollHeight;
            indexAdjust = 0;
    }
})