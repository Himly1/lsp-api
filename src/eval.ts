type HttpMethod = "post" | "get" | "delete" | "patch" | "put";
type RestRequestSender = (url: string, method: HttpMethod, requestBody: object) => object;
type LocalStorageManager = {
    store(key: string, data: object): void,
    retrieve(key: string): object
}

let restRequestSender: RestRequestSender | undefined = undefined;
let localStorageManager: LocalStorageManager | undefined = undefined;

export function evalApi<T>(lsp: string, reqData: {[key: string]: any}, res: T): T {
   return res;
}


export function setup(httpRequestSender: RestRequestSender, storageManager: LocalStorageManager) {
    restRequestSender = httpRequestSender;
    localStorageManager = storageManager;
}