import {evalApi, LocalStorageManager, RestRequestSender, setup} from "../src/eval";
import {compileAll} from "../src/compiler";
import * as fs from "fs";

const httpSender: RestRequestSender = (url, method, requestBody): object => {
    return {}
}
const localStorageManager: LocalStorageManager = {
    retrieve(key: string): object {
        return {};
    }, store(key: string, data: object): void {
    }
}

function getLspApiMetadata() {
    const json = fs.readFileSync("data/api/apiMetadata.json", 'utf-8')
    return JSON.parse(json)
}

describe("evalApi tests", () => {
    it('should throw error if http request sender or the local storage manager is not set', () => {
        expect(() => {
            evalApi<string>("(Rest/get /users/:id/posts?:deleted selfMappings)", {
                id: 234
            })
        }).toThrow("Did you forget to setup the LocalStorageManager and RestRequestSender and lspMetadata? If so, Add the compileAll to your entrypoint.")
    });

    it('should return correct results on http get request', () => {
        let finalUrl = undefined;
        let requestBody = undefined;
        compileAll("data/api")
        setup((url, method, body) => {
            finalUrl = url;
            requestBody = body;
            return {
                id: 234,
                name: 'himly',
                age: '24'
            }
        }, localStorageManager, getLspApiMetadata())
        const res = evalApi("(Rest/get /users/:id/posts?:deleted&:dateGreaterThan selfMappings)", {
            id: 234,
            deleted: false,
            dateGreaterThan: "test"
        })
        expect(res).toEqual({
            id: 234,
            name: 'himly',
            age: '24'
        })
        expect(finalUrl).toEqual("/users/234/posts?deleted=false&dateGreaterThan=test")
        expect(requestBody).toEqual(undefined);
    })

    it('should return correct results on http post request', () => {
        let finalUrl = undefined;
        let requestBody = undefined;
        compileAll("data/api")
        setup((url, method, body) => {
            finalUrl = url;
            requestBody = body;
            return {
                id: 234,
                name: 'himly',
                age: '24'
            }
        }, localStorageManager, getLspApiMetadata())
        const res = evalApi("(Rest/post /users/:id/posts selfMappings asBody (Add post of the user))", {
            id: 234
        })
        expect(res).toEqual({
            id: 234,
            name: 'himly',
            age: '24'
        })
        expect(finalUrl).toEqual("/users/234/posts")
        expect(requestBody).toEqual({id: 234})
    });

    it('should return correct results on http delete request', () => {
        let finalUrl = undefined;
        let requestBody = undefined;
        compileAll("data/api")
        setup((url, method, body) => {
            finalUrl = url;
            requestBody = body;
            return {
                id: 445,
                name: 'himly',
                age: '24'
            }
        }, localStorageManager, getLspApiMetadata())
        const res = evalApi("(Rest/delete /users/:id/posts/:postId selfMappings asBody (Delete the post of the user))", {
            id: 445,
            postId: 234,
        })
        expect(res).toEqual({
            id: 445,
            name: 'himly',
            age: '24'
        })
        expect(finalUrl).toEqual("/users/445/posts/234")
        expect(requestBody).toEqual({id: 445, postId: 234})
    });

    it('should return correct results on http put request', () => {
        let finalUrl = undefined;
        let requestBody = undefined;
        compileAll("data/api")
        setup((url, method, body) => {
            finalUrl = url;
            requestBody = body;
            return {
                id: 445,
                name: 'himly',
                age: '24'
            }
        }, localStorageManager, getLspApiMetadata())
        const res = evalApi("(Rest/put /users/:id/posts/:postId selfMappings asBody (update the post)", {
            id: 445,
            postId: 234,
        })
        expect(res).toEqual({
            id: 445,
            name: 'himly',
            age: '24'
        })
        expect(finalUrl).toEqual("/users/445/posts/234")
        expect(requestBody).toEqual({id: 445, postId: 234})
    });

    it('should return correct results on http patch request', () => {
        let finalUrl = undefined;
        let requestBody = undefined;
        compileAll("data/api")
        setup((url, method, body) => {
            finalUrl = url;
            requestBody = body;
            return {
                id: 445,
                name: 'himly',
                age: '24'
            }
        }, localStorageManager, getLspApiMetadata())
        const res = evalApi("(Rest/patch /users/:id/posts/:postId?:titleOnly selfMappings asBody (patching the post)", {
            id: 445,
            postId: 234,
            titleOnly: false
        })
        expect(res).toEqual({
            id: 445,
            name: 'himly',
            age: '24'
        })
        expect(finalUrl).toEqual("/users/445/posts/234?titleOnly=false")
        expect(requestBody).toEqual({
            "id": 445,
            "postId": 234,
            "titleOnly": false
        })
    });

    it('should return correct results on local storage set-in', () => {
        let receivedKey = undefined;
        let receivedData = undefined;
        compileAll("data/api")
        setup((url, method, body) => {
            return {
                id: 445,
                name: 'himly',
                age: '24'
            }
        },  {
           store(key: string, data: object) {
               receivedKey = key;
           },
            retrieve(key: string): object {
               receivedKey = key;
               return {test: true}
            }
        }, getLspApiMetadata())
        const res = evalApi("(Local/get-in user-profile (get the profile of the user))", {
        })
        expect(res).toEqual({
            test: true
        })
        expect(receivedKey).toEqual("user-profile")
    });

    it('should return correct results on local storage get-in', () => {
        let receivedKey = undefined;
        let receivedData = undefined;
        compileAll("data/api")
        setup((url, method, body) => {
            return {
                id: 445,
                name: 'himly',
                age: '24'
            }
        },  {
            store(key: string, data: object) {
                receivedKey = key;
                receivedData = data;
            },
            retrieve(key: string): object {
                receivedKey = key;
                return {test: true}
            }
        }, getLspApiMetadata())
        const res = evalApi("(Local/set-in user-profile (set the profile of the user))", {
            id: 234,
            name: 'himly',
            age: 24
        })
        expect(res).toEqual(undefined)
        expect(receivedKey).toEqual("user-profile")
        expect(receivedData).toEqual({
            id: 234,
            name: 'himly',
            age: 24
        })
    });
})