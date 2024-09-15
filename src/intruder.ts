import { Chain, Interface, tryReadIP, tryReadPort } from "./rule.js";
import { AddressPort, Protocol, Segment, trySendSegment } from "./segment.js";

const portInputParent = document.getElementById("portInputParent");
const portInput = document.getElementById("portInput") as HTMLInputElement;
const protocolInput = document.getElementById("protocolInput") as HTMLInputElement;
function setPortVisibility() {
    if (protocolInput.value == "icmp") {
        portInputParent.classList.add("invisible");
        portInput.removeAttribute("required");
    }
    else {
        portInputParent.classList.remove("invisible");
        portInput.setAttribute("required", "");
    }
}
setPortVisibility();
protocolInput.addEventListener("change", setPortVisibility);

const intruderForm = document.forms["intruderForm"];
intruderForm.addEventListener("submit", x => x.preventDefault());
intruderForm.onsubmit = function() {
    let form = new FormData(intruderForm);
    let source: AddressPort;
    let dest: AddressPort;
    let segment: Segment;
    let protocol = Protocol[form.get("protocol") as string]
    switch (protocol) {
        case Protocol["tcp"]:
        case Protocol["udp"]:
            let port = tryReadPort(form.get("port") as string);
            source = new AddressPort(tryReadIP(form.get("sourceIpAddress") as string), port);
            dest = new AddressPort(tryReadIP(form.get("destIpAddress") as string), port);
            segment = new Segment(protocol, source, dest);
            break;
        case Protocol["icmp"]:
            source = new AddressPort(tryReadIP(form.get("sourceIpAddress") as string));
            dest = new AddressPort(tryReadIP(form.get("destIpAddress") as string));
            segment = new Segment(protocol, source, dest);
            break;
        default:
            console.error("invalid protocol selected");
            return;
    }
    const sent = trySendSegment(segment, Chain["INPUT"], Interface["eth0"])
    pushToIntruderHistory(source, dest, protocol, sent);

}

const intruderHistory = document.getElementById("intruderHistory");
function pushToIntruderHistory(source: AddressPort, dest: AddressPort, protocol: Protocol, result: boolean) {
    let newLine = document.createElement("p");
    
    newLine.classList.add(result ? "segmentSuccess" : "segmentFailed");

    newLine.classList.add("line");
    newLine.innerText += Protocol[protocol] + (protocol == Protocol["icmp"] ? "" : dest.ports[0]) + " from " + source.network.ipToString() + " to " + dest.network.ipToString();
    intruderHistory.prepend(newLine);
}
