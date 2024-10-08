import { tryReadIntInRange } from "./rule.js";
import { Network } from "./segment.js";

export const knownDomains = ["example.com"];

function exampleDotCom() : string[] {
    let output: string[] = [];
    const space = '\u00A0';
    output.push('<!doctype HTML>');
    output.push('<html>');
    output.push(space.repeat(3) + '<body>');
    output.push(space.repeat(6) + '<h1>welcome to my super cool website</h1>');
    output.push(space.repeat(3) + '</body>');
    output.push('</html>');
    return output;
}

export function isIP(potentialIP: string) : boolean {
    const potentialIpArr = potentialIP.split('.');
    if (potentialIpArr.length == 4) {
        return potentialIpArr.every((octet) => tryReadIntInRange(octet, 0, 255));
    }
    return false;
}

export function resolveDomain(domain: string) : Network {
    switch (domain) {
        case "example.com":
        case "www.example.com":
            return new Network([1,1,1,10], 32);
        default:
            throw "could not resolve host: " + domain;
    }
}

export function getSite(network: Network) : string[] {
    let ipStr: string = network.ipToString();
    switch (ipStr) {
        case "1.1.1.10":
            return exampleDotCom();
        default:
            throw "connection timed out";
    }
}
