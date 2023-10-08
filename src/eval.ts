import {getFacts, lspToArray} from "./compiler";

export type HttpMethod = "post" | "get" | "delete" | "patch" | "put";
export type RestRequestSender = (url: string, method: HttpMethod, requestBody?: object) => object;
export type LocalStorageManager = {
    store(key: string, data: object): void,
    retrieve(key: string): object
}

let restRequestSender: RestRequestSender | undefined = undefined;
let localStorageManager: LocalStorageManager | undefined = undefined;
let metadata: {[key: string]: string[]} | undefined = undefined;

class RestRequest {
    public method: HttpMethod;
    public url: string;
    public requestBody?: object

    constructor(method: HttpMethod, url: string, requestBody?: object) {
        this.method = method;
        this.url = url;
        this.requestBody = requestBody;
    }

}

class LocalStorageRequest {
    public key: string;
    public store: boolean;
    public data?: object

    constructor(key: string, store: boolean, data?: object) {
        this.key = key;
        this.store = store;
        this.data = data;
    }
}

type SyntaxResolver = (args: string[], reqData: { [key: string]: string } | undefined, urlFormattingMappings: {
    [key: string]: string
} | undefined, requestBodyMappings: { [key: string]: string } | undefined) => RestRequest | LocalStorageRequest;


function formatUrl(unformulatedUrl: string | undefined, urlFormattingMappings: {
    [key: string]: string
} | undefined, reqData: { [key: string]: any } | undefined) {
    if (unformulatedUrl == null) {
        throw "The url should not be null"
    }

    let [urlFormatting, queryParametersFormatting] = unformulatedUrl?.split("?");
    Object.keys(urlFormattingMappings ? urlFormattingMappings : {}).forEach((key) => {
        const val = reqData ? reqData[key] : "no-related-data-in-request";
        urlFormatting = urlFormatting.replace(`:${key}`, val);
        if (queryParametersFormatting) {
            queryParametersFormatting = queryParametersFormatting.replace(`:${key}`, `${key}=${val}`)
        }
    })
    return queryParametersFormatting ? urlFormatting + "?" + queryParametersFormatting : urlFormatting;
}

function toRequestBody(requestBodyMappings: { [key: string]: string } | undefined, reqData: {
    [key: string]: any
} | undefined) {
    return Object.keys(requestBodyMappings ? requestBodyMappings : {}).reduce((previousValue, currentValue, currentIndex, array) => {
        previousValue[currentValue] = reqData?.[currentValue];
        return previousValue;
    }, {} as { [key: string]: any })
}

const keywordResolvers: { [key: string]: SyntaxResolver } = {
    'Rest/get': (args, reqData, urlFormattingMappings, requestBodyMappings) => {
        const url = args.shift();
        const finalUrl = formatUrl(url, urlFormattingMappings, reqData)
        return new RestRequest("get", finalUrl)
    },
    'Rest/post': (args, reqData, urlFormattingMappings, requestBodyMappings) => {
        const url = args.shift();
        const finalUrl = formatUrl(url, urlFormattingMappings, reqData);
        const requestBody = toRequestBody(requestBodyMappings, reqData);
        return new RestRequest('post', finalUrl, requestBody);
    },

    "Rest/delete": (args, reqData, urlFormattingMappings, requestBodyMappings) => {
        const url = args.shift();
        const finalUrl = formatUrl(url, urlFormattingMappings, reqData);
        const requestBody = toRequestBody(requestBodyMappings, reqData);
        return new RestRequest("delete", finalUrl, requestBody);
    },

    "Rest/put": (args, reqData, urlFormattingMappings, requestBodyMappings) => {
        const url = args.shift();
        const finalUrl = formatUrl(url, urlFormattingMappings, reqData);
        const requestBody = toRequestBody(requestBodyMappings, reqData);
        return new RestRequest("put", finalUrl, requestBody)
    },
    "Rest/patch": (args, reqData, urlFormattingMappings, requestBodyMappings) => {
        const url = args.shift();
        const finalUrl = formatUrl(url, urlFormattingMappings, reqData);
        const requestBody = toRequestBody(requestBodyMappings, reqData);
        return new RestRequest("patch", finalUrl, requestBody)
    },
    "Local/get-in": (args, reqData, urlFormattingMappings, requestBodyMappings) => {
        const key = args.shift();
        if (key == undefined) {
            throw "The key should not be null."
        }
        return new LocalStorageRequest(key, false, undefined);
    },
    "Local/set-in": (args, reqData, urlFormattingMappings, requestBodyMappings) => {
        const key = args.shift();
        if (key == undefined) {
            throw "The key should not be null."
        }
        return new LocalStorageRequest(key, true, reqData);
    }
}


export function evalApi<T>(lsp: string, reqData: { [key: string]: any }): T {
    if (localStorageManager == null || restRequestSender == null || metadata == null) {
        throw "Did you forget to setup the LocalStorageManager and RestRequestSender and lspMetadata? If so, Add the compileAll to your entrypoint."
    }
    const [keyword, ...args] = lspToArray(lsp)
    const facts = getFacts(lsp, metadata);
    const resolver = keywordResolvers[keyword];
    const dataAccessReq = resolver(args, reqData, facts.urlFormattingMappings, facts.bodyMappings)
    if (dataAccessReq instanceof RestRequest) {
        return restRequestSender(dataAccessReq.url, dataAccessReq.method, dataAccessReq.requestBody) as T
    }

    if (dataAccessReq.store) {
        if (dataAccessReq.data == undefined) {
            throw "Data should not be null on store operation."
        }
        return localStorageManager.store(dataAccessReq.key, dataAccessReq.data) as T;
    } else {
        return localStorageManager.retrieve(dataAccessReq.key) as T;
    }
}

export function setup(httpRequestSender: RestRequestSender, storageManager: LocalStorageManager, lspMetadata: {[key:string]:string[]}) {
    restRequestSender = httpRequestSender;
    localStorageManager = storageManager;
    metadata = lspMetadata;
}