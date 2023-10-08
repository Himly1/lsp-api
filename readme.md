# What is lsp-api?
```
Lsp-api is a library (As the author, I prefer the term: Framework) to 
limit the developers to define data access layer and accessing data.
```

## Why limit the way to define & access data access layer?
```
Its because good things always comes from the point "Simple made easy, not the reverse"
And ordinary way to define & access data access layer is a mess (its only from my own perspective).
```

## Did it really get simpler?
```
Yes!!!
```
### Ordinary way to access the server data
```
type UserProfile = {
    name: string,
    age: number,
    gender: string
}

async function getThePostsOfTheUser(userId: number, deleted: boolean, dateGreaterThan: Date): Promise<UserProfile> {
    return await fetch(
        `http://localhost:3000/api/users/${userId}posts?
        deleted=${deleted}&dateGreaterThan: ${dateGreaterThan}`
    ).then(async rs => {
        return (await rs.json()) as UserProfile
    })
}
```

### lsi-api way to access the server data
```
type GeneralResponse<T> = {
    success: boolean,
    message: string
    data: T
}

export type UserPosts = {
    "(Rest/get /users/:userId/posts?:deleted&:dateGreaterThan selfMappings (get posts of the user))": {
        req: {
            userId: number,
            deleted: boolean,
            dateGreaterThan: Date
        },
        res: GeneralResponse<{
             name: string,
             age: number,
             gender: string
        }>
    }
}
```

After that you just call the api
![Alt text](assets/call-api.png?raw=true "call api")
If you need to add more api on the `userPosts` just do below:
```
export type UserPosts = {
    "(Rest/get /users/:userId/posts?:deleted&:dateGreaterThan selfMappings (get posts of the user))": {
        req: {
            userId: number,
            deleted: boolean,
            dateGreaterThan: Date
        },
        res: GeneralResponse<{
            name: string,
            age: number,
            gender: string
        }>
    },
    "(Rest/post /users/:userId/posts {:userId id} asBody (add post of the user))": {
        req: {
            id: number,
            title: string,
            content: string
        },
        res: GeneralResponse<any>
    }
}
```
And after that you just call the new api:
![Alt text](assets/call-add-post.png?raw=true "call new api")

### It seems that did get simpler, but what if I made a typo in the api definition?
```
Dont worry!!! There is compiler for you.
import the compileAll function to your entrypoint and add it to the main funciton, thats`s all.

import {compileAll, evalApi, RestRequestSender, LocalStorageManager} from 'lsp-api'

const restRequestSender: RestRequestSender = async (url, method, requestBody) => {
    return {};
}
const localStorageManager: LocalStorageManager = {
    store: function (key: string, data: object): void {
        throw new Error('Function not implemented.');
    },
    retrieve: function (key: string): object {
        throw new Error('Function not implemented.');
    }
}

compileAll(restRequestSender, localStorageManager)
```
Here is it:
![Alt text](assets/compiler-throw-error.png?raw=true "Compiler")

### It seems that I have to memorize a lot of other "language" syntaxes?
```
Yes and No!!

Yes:
You do have to memorize some syntax but its all the same with `clojure` language. 
And `clojure` is a diglt of Lisp. You just need to remeber to close your parenthese😆, thats It!!!

No:
The syntax is simple and not too much and all of them are the same from the higher view.
Here is the some syntaxs:

(Rest/get url-with-formatting url-formatting-mappings (comments))
   (Rest/get /users/:id/posts/:postId {:id userId :postId postId} (get the post of the user) 
   (Rest/get /users/:id/posts?:deleted&:postedDateGreater selfMappings (get the posts of the user))

   
(Rest/post" url-with-formatting url-formatting-mappings requestBodyMappings (comments))
   (Rest/post" /users/:id/posts {:id userId} asBody (add post of the user))
   (Rest/post" /users/:id/posts selfMappings asBody (add post of the user))

```

# When should use lsp-api?
```
When you get fucked by the selftalking api definitions.

```

# How to use lsp-api
## 1.Install the lsp-api
```
npm install lsp-api
```

## 2.Add the template to your project folder 'data/api/index.ts
```
import {evalApi} from 'lsp-api'

type GeneralResponse<T> = {
    success: boolean,
    message: string
    data: T
}

export type Examples = {
    "(Rest/get /users/:id/posts?:deleted&:dateGreaterThan selfMappings)": {
        req: {
            id: number,
            deleted: boolean,
            dateGreaterThan: string
        },
        res: GeneralResponse<{
            id: number,
            title: string,
            content: string
        }[]>
    },
    "(Rest/post /users/:id/posts selfMappings asBody (Add post of the user))": {
        req: {
            id: number,
            title: string,
            content: string
        },
        res: GeneralResponse<any>
    },
    "(Rest/delete /users/:id/posts/:postId selfMappings asBody (Delete the post of the user))": {
        req: {
            id: number,
            postId: number
        },
        res: GeneralResponse<any>
    },
    "(Rest/put /users/:id/posts/:postId selfMappings asBody (update the post)": {
        req: {
            id: number,
            postId: number,
            title: string,
            content: string
        },
        res: GeneralResponse<any>
    },
    "(Rest/patch /users/:id/posts/:postId?:titleOnly selfMappings asBody (patching the post)": {
        req: {
            id: number,
            postId: number,
            titleOnly: boolean,
            title: string,
            content: string
        },
        res: GeneralResponse<any>
    },
    "(Local/get-in user-profile (get the profile of the user))": {
        req: {},
        res: {
            id?: number,
            name?: string,
            age?: number
        }
    },
    "(Local/set-in user-profile (set the profile of the user))": {
        req: {
            id?: number,
            name?: string,
            age?: number
        },
        res: {}
    }
}

export type API<T extends {
    [K in string]: {
        req: {
            [key: string]: any
        },
        res: {
            [key: string]: any
        }
    }
}> = {
    [K in keyof T]: {
        req: { [key: string]: any },
        res: { [key: string]: any }
    }
}

//Add more APIS here with the syntax: API<Examples & xxxAPISet & AnotherAPISet>
export type Apis = API<Examples>
export type FlattedApis = {
    [K in keyof Apis]: {
        apiDef: K,
        reqDef: Apis[K]
    }
}
type RequestTypeOfTheApiGeneric<T extends keyof FlattedApis> = FlattedApis[T]['reqDef']['req']
type ResponseTypeOfTheApiGeneric<T extends keyof FlattedApis> = FlattedApis[T]['reqDef']['res']

export async function api<T extends keyof FlattedApis>(api: T, req: RequestTypeOfTheApiGeneric<T>): Promise<T> {
    return evalApi(api, req);
}
```

## 3.Add compileLsp.js to your project root folder with below content
```
const compiler = require('lsp-api')
compiler.compileAll(process.cwd() + "/data/api")
```

## 4.Add the npm task `compileLsp`
```
"compileLsp": "node lspCompiler.js"
```

## 5.Change the npm task `start` to below
```
"start" : "npm run compileLsp && replace your command here"
```

## 6.Setup evalApi, add below code to your entrypoint file.
```
import {setup, HttpMethod, LocalStorageManager, RestRequestSender} from 'lsp-api'


//load the apiMetadata from the api folder
//The apiMetadata is generated by the compiler.
import metadata from './apiMetadata.json'
setup((url, method, requestBody) => {
    return {}
}, {
    store(key: string, data: object) {
    },
    retrieve(key: string): object {
        return {}
    }
}, metadata)
```

## 7.Add More apis to the type `API` in the data/api/index.ts file
```
//Add more APIS here with the syntax: API<SystemAPI & xxxAPISet & AnotherAPISet>
export type Apis = API<UserPosts | anotherApis | xxxAPIS>
```


## 8.Write api definition based on the examples
```
type GeneralResponse<T> = {
    success: boolean,
    message: string
    data: T
}

export type Examples = {
    "(Rest/get /users/:id/posts?:deleted&:dateGreaterThan selfMappings)": {
        req: {
            id: number,
            deleted: boolean,
            dateGreaterThan: string
        },
        res: GeneralResponse<{
            id: number,
            title: string,
            content: string
        }[]>
    },
    "(Rest/post /users/:id/posts selfMappings asBody (Add post of the user))": {
        req: {
            id: number,
            title: string,
            content: string
        },
        res: GeneralResponse<any>
    },
    "(Rest/delete /users/:id/posts/:postId selfMappings asBody (Delete the post of the user))": {
        req: {
            id: number,
            postId: number
        },
        res: GeneralResponse<any>
    },
    "(Rest/put /users/:id/posts/:postId selfMappings asBody (update the post)": {
        req: {
            id: number,
            postId: number,
            title: string,
            content: string
        },
        res: GeneralResponse<any>
    },
    "(Rest/patch /users/:id/posts/:postId?:titleOnly selfMappings asBody (patching the post)": {
        req: {
            id: number,
            postId: number,
            titleOnly: boolean,
            title: string,
            content: string
        },
        res: GeneralResponse<any>
    },
    "(Local/get-in user-profile (get the profile of the user))": {
        req: {},
        res: {
            id?: number,
            name?: string,
            age?: number
        }
    },
    "(Local/set-in user-profile (set the profile of the user))": {
        req: {
            id?: number,
            name?: string,
            age?: number
        },
        res: {}
    }
}
```
