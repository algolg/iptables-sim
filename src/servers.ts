export const knownSites = ["example.com"];

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

export function getSite(domain: string) : string[] {
    switch (domain) {
        case "example.com":
            return exampleDotCom();
        default:
            throw "unknown site";
    }
}
