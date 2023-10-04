type APIMetaData = {
    lspDef: string,
    args: string[]
}

function getApiRequestDataKeys(req: string | undefined): string[] {
    if (req === undefined) {
        return [];
    }

    // Remove the curly braces and split the string into lines
    let lines = req.replace(/[{}]/g, '').replace(",", " ").replace("\n", "").split(' ');

    // Initialize an array to hold the keys
    let keys = [];

    // Loop through each line
    for (let line of lines) {
        // Use a regular expression to extract the key from each line
        let match = line.trim().match(/(\w+)\s*:/);
        if (match) {
            keys.push(match[1]);
        }
    }

    return keys;
}

export function loadApiMetaDataFromTheSourceCode(sourceCode: string): APIMetaData[] {
    //to match strings like this: "(anything):{req: {anything}, res: {anything}}"
    const regex = new RegExp(/\"?\(\s*.*?\s*\)\"\s*:\s*{\s*req\s*:\s*{.*?}/gs);
    const matches = sourceCode.match(regex)
    return matches ? matches.map(def => {
        //to match strings like this: (anything)
        const lspDef = def.match("\\(.*\\)");
        if (lspDef == null) {
            console.error(`Unable to extract the lsp api definition from: ${def}`)
            throw "Unable to extract the lsp api definition."
        }
        //to match strings like this: req: {anything}
        const reqDataRegex = /req:\s*({[^}]*})/gs;
        const args = reqDataRegex.exec(def)?.[1];

        return {
            lspDef: lspDef[0],
            args: getApiRequestDataKeys(args)
        } as APIMetaData
    }) : [];
}
