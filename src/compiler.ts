import * as fs from 'fs'
import * as path from "path";
import {loadApiMetaDataFromTheSourceCode} from './apiMetadata'
import {LocalStorageManager, RestRequestSender, setup} from "./eval";

const keywords: { [key: string]: string[] } = {
    "Rest/get": ["(type/url)", "(one-of type/map fn/selfMappings)"],
    "Rest/post": ["(type/url)", "(one-of type/map fn/selfMappings)", "(one-of type/map fn/asBody)"],
    "Rest/delete": ["(type/url)", "(one-of type/map fn/selfMappings)", "(one-of type/map fn/asBody)"],
    "Rest/put": ["(type/url)", "(one-of type/map fn/selfMappings)", "(one-of type/map fn/asBody)"],
    "Rest/patch": ["(type/url)", "(one-of type/map fn/selfMappings)", "(one-of type/map fn/asBody)"],
    "Local/get-in": ["(type/string)"],
    "Local/set-in": ["(type/string)"]
}

export type CompilationInfo = {
    lsp: string,
    args: string[],
    error: string | undefined
}

class ValidationFactContext {
    public bodyMappings?: { [key: string]: string };
    public urlFormattingMappings?: { [key: string]: string };
    public reqDataKeys: string[]

    constructor(reqDataKeys: string[]) {
        this.reqDataKeys = reqDataKeys;
    }
}

function checkIfTheSyntaxAValidUrl(syntax: string):boolean {
   if (syntax == null || !syntax.startsWith("/")) {
       return false;
   }

   const queryParameter = syntax.split("?")[1];
   if (queryParameter == undefined) {
       return true;
   }

   const args = queryParameter.split("&");
   for (const arg of args) {
       if (!arg.startsWith(":")) {
           return false;
       }
   }




   return true;
}

const syntaxValidators: {
    [key: string]: (syntax: string | null, args: string[], facts: ValidationFactContext) => string | undefined
} = {
    "type/url": (syntax, args, facts): string | undefined => {
        if (syntax == null || !checkIfTheSyntaxAValidUrl(syntax)) {
            return "The syntax should be a url"
        }
        // Initialize a set to hold the keywords
        let keywords: Set<string> = new Set();

        // Define the regular expression
        let pattern: RegExp = /:(\w+)/g;
        let match: RegExpExecArray | null;
        // Find all matches in the current URL
        while ((match = pattern.exec(syntax)) !== null) {
            // Add the matched keyword to the set
            keywords.add(match[1]);
        }

        for (const keyword of keywords) {
            const mapping = facts.urlFormattingMappings?.[keyword];
            if (mapping == null) {
                return `The keyword '${keyword}' is not mapping`
            }

            if (facts.reqDataKeys.indexOf(mapping) <= -1) {
                return `The mapping '${mapping}' should be exists in the request data.`
            }
        }
    },
    "type/string": (syntax, args, facts): string | undefined => {
        if (syntax == null) {
            return "The syntax should be type/string"
        }
        return undefined;
    },
    "type/map": (syntax, args, facts): string | undefined => {
        if (syntax == null || !/^\{\s*(:\w+\s+\w+\s*)*\}$/.test(syntax)) {
            return "The syntax should be a map in clojure way."
        }

        let mappings: { [key: string]: string } = {};
        let pairs: string[] = syntax.slice(1, -1).trim().split(/\s+(?=:)/);
        for (let pair of pairs) {
            let [key, value] = pair.trim().split(/\s+/);
            mappings[key.slice(1)] = value;
        }
        facts.urlFormattingMappings = mappings;
        facts.bodyMappings = mappings;
        return undefined
    },
    "one-of": (syntax, args, facts): string | undefined => {
        for (const option of args) {
            const error = syntaxValidators[option](syntax, [], facts)
            if (error == undefined) {
                return undefined;
            }
        }

        return `The syntax should be one of ${args.toString()}`
    },
    "fn/selfMappings": (syntax, args, facts): string | undefined => {
        if (syntax == null || syntax !== "selfMappings") {
            return "The syntax should be the keyword: selfMappings"
        }

        facts.urlFormattingMappings = facts.reqDataKeys.reduce((rs, key) => {
            rs[key] = key;
            return rs;
        }, {} as {[key: string]: string})

        return undefined;
    },
    "fn/asBody": (syntax, args, facts): string | undefined => {
        if (syntax == null || syntax !== 'asBody') {
            return "The syntax should be the keyword: asBody"
        }

        facts.bodyMappings = facts.reqDataKeys.reduce((rs, key) => {
            rs[key] = key;
            return rs;
        }, {} as {[key: string]: string})
        return undefined;
    }
}

export function lspToArray(lsp: string): string[] {
    const stringsWithoutParentThese = lsp.slice(1, -1);
    return stringsWithoutParentThese.split(/ (?![^{]*})/).filter((str) => {
        return str.trim().length > 0;
    });
}

function compileLsp(lsp: string, facts: ValidationFactContext): CompilationInfo {
    const [keyword, ...args] = lspToArray(lsp)
    const syntaxTemplate = keywords[keyword];
    if (syntaxTemplate == undefined) {
        return {
            lsp: lsp,
            args: facts.reqDataKeys,
            error: "Invalid keyword."
        }
    }

    for (let i = syntaxTemplate.length - 1; i > -1; --i) {
        const syntax = args.length > i ? args[i] : null;
        const template = syntaxTemplate[i];
        const [keywordOfTheTemplate, ...argsOfTheTemplate] = lspToArray(template);

        const validator = syntaxValidators[keywordOfTheTemplate];
        const error = validator(syntax, argsOfTheTemplate, facts);
        if (error) {
            return {
                lsp: lsp,
                args: facts.reqDataKeys,
                error: `Error on the ${i + 1}st argument: ${error}`
            }
        }
    }

    return {
        lsp: lsp,
        args: facts.reqDataKeys,
        error: undefined
    }
}

export function compile(sourceCode: string): CompilationInfo[] {
    const metaDataArr = loadApiMetaDataFromTheSourceCode(sourceCode);
    const compilations: CompilationInfo[] = [];
    for (const metadata of metaDataArr) {
        const compilation = compileLsp(metadata.lspDef, new ValidationFactContext(metadata.args))
        compilations.push(compilation)
        if (compilation.error) {
            break;
        }

        console.log(`${metadata.lspDef} compiled successfully`)
    }
    return compilations;
}

function getTsFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            fileList = getTsFiles(path.join(dir, file), fileList);
        } else if (path.extname(file) === '.ts') {
            fileList.push(path.join(dir, file));
        }
    });

    return fileList;
}

const lspMetadata: {[key: string]:string[]} = {

}
export function compileAll(restReqSender: RestRequestSender, storageManager: LocalStorageManager) {
    setup(restReqSender, storageManager)

    const apiPath = process.cwd() + "/data/api";
    const exists = fs.existsSync(apiPath);
    if (!exists) {
        throw "ERROR: Add data access layer to your project root folder before compiling. More information: xxx";
    }
    const tsFilesPath = getTsFiles(apiPath, []);
    tsFilesPath.forEach(file => {
        const sourceCode = fs.readFileSync(file, 'utf-8')
        const compilations = compile(sourceCode)
        const error = compilations.filter(compilation => {
            return compilation.error !== undefined;
        })[0];

        if (error) {
            throw `ERROR: ${JSON.stringify(error)}`
        }

        compilations.forEach(compilation => {
            lspMetadata[compilation.lsp] = compilation.args;
        })

        if (compilations.length === 0) {
            console.warn(`No api definition found at the file: ${file}`)
        }
    })
}

export function getFacts(lsp: string) {
   const args = lspMetadata[lsp];
   if (args == null) {
       throw "No compilation found for the lsp. Should call compileAll before call getFacts. Did you forget to add the compileAll to your entrypoint?"
   }
   const facts = new ValidationFactContext(args);
   const compilation = compileLsp(lsp, facts);
   if (compilation.error) {
       throw `ERROR when compiling the lsp: ${JSON.stringify(compilation)}`
   }

   return facts;
}