import {compile, compileAll, getFacts} from '../src/compiler';
import {LocalStorageManager, RestRequestSender} from "../src/eval";
import * as fs from 'fs'
import * as path from "path";

describe("Compile tests", () => {
    it('should return error when the keyword is not defined.', () => {
        expect(
            compile(`"(ImNotDefined arg1 arg2)": {req: {}, res: {}}`)[0].error
        ).toEqual("Invalid keyword.")
    });

    it('should return error when the type/string is missing', () => {
        expect(compile(`"(Local/get-in)":{req: {}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The syntax should be type/string")
    });

    it('should return error when the url formatting mappings is missing', () => {
        expect(compile(`"(Rest/get /users/test)":{req: {}, res: {}}`)[0].error).toEqual("Error on the 2st argument: The syntax should be one of type/map,fn/selfMappings")
    });

    it('should return error when the type/url`s formatting is missing', () => {
        expect(compile(`"(Rest/get {} {})":{req: {}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The syntax should be a url")
    });

    it('should return error when the url formatting is missing with selfMappings', () => {
        expect(compile(`"(Rest/get /users/:id?:test selfMappings)":{req: {id: number}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The keyword 'test' is not mapping")

        expect(compile(`"(Rest/get /users/:id?:test selfMappings)":{req: {test:string}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The keyword 'id' is not mapping")
    });

    it('should return error when the url formatting is missing with map data structure mappings', () => {
        expect(compile(`"(Rest/get /users/:id?:test {:idx id})":{req: {id: number}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The keyword 'id' is not mapping")

        expect(compile(`"(Rest/get /users/:id?:test {:id idx})":{req: {id: number}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The mapping 'idx' should be exists in the request data.")

        expect(compile(`"(Rest/get /users/:id?:test {:id id   :testx x})":{req: {id: number}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The keyword 'test' is not mapping")

        expect(compile(`"(Rest/get /users/:id?:test {:id id   :test x})":{req: {id: number}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The mapping 'x' should be exists in the request data.")

        expect(compile(`"(Rest/get /users/:id?:test {:id id   :test x})":{req: {id: number    x: string}, res: {}}`)[0].error).toEqual(undefined)
    });
})

describe("Compile tests on Rest/get", () => {
    it('should return error when keyword is not match', () => {
        expect(compile(`"(Rest/gets /users/:id?:test {:idx id})":{req: {id: number}, res: {}}`)[0].error).toEqual("Invalid keyword.")
    });

    it('should return error when the url is not an url', () => {
        expect(compile(`"(Rest/get test {:idx id})":{req: {id: number}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The syntax should be a url")
    });

    it('should return error when the url formatting mappings is missing', () => {
        expect(compile(`"(Rest/get /users/)":{req: {id: number}, res: {}}`)[0].error).toEqual("Error on the 2st argument: The syntax should be one of type/map,fn/selfMappings")
    });

    it('should return error when the url formatting mappings is wrong', () => {
        expect(compile(`"(Rest/get /users/ --)":{req: {id: number}, res: {}}`)[0].error).toEqual("Error on the 2st argument: The syntax should be one of type/map,fn/selfMappings")
    });

    it('should return error when the url is not an url', () => {
        expect(compile(`"(Rest/get /users/:id/posts?test&:name {:id id :test test :name name})":{req: {id: number, test:string, name: string}, res: {}}`)[0].error).toEqual("Error on the 1st argument: The syntax should be a url")
    });

    it('should not return error when syntax is ok', () => {
        expect(compile(`"(Rest/get /users/:id/posts?:test&:name {:id id :test test :name name})":{req: {id: number, test:string, name: string}, res: {}}`)[0].error).toEqual(undefined)
    });

    it('should not return error when syntax is ok --url', () => {
        expect(compile(`"(Rest/get /users/ selfMappings)":{req:{id: number} res: {}}`)[0].error).toEqual(undefined)
    });
})

describe("Compile tests on Rest/post", () => {
    it('should throw exception when the body mappings is missing', () => {
        expect(compile(`"(Rest/post /users/ selfMappings)":{req:{id: number} res: {}}`)[0].error).toEqual("Error on the 3st argument: The syntax should be one of type/map,fn/asBody")
    });

    it('should return error when the url formatting mappings is not correct', () => {
        expect(compile(`"(Rest/post /users/ -- asBody)":{req:{id: number} res: {}}`)[0].error).toEqual("Error on the 2st argument: The syntax should be one of type/map,fn/selfMappings")
    });

    it('should return error when the url is not correct', () => {
        expect(compile(`"(Rest/post test {} asBody)":{req:{id: number} res: {}}`)[0].error).toEqual("Error on the 1st argument: The syntax should be a url")
    });

    it('should return error when the url formatting mappings is missing', () => {
        expect(compile(`"(Rest/post /users/:id/profile?:old {} asBody)":{req:{id: number} res: {}}`)[0].error).toEqual("Error on the 1st argument: The keyword 'id' is not mapping")
    });

    it('should return error when the url formatting mappings is not correct', () => {
        expect(compile(`"(Rest/post /users/:id/profile?:old {:id idx} asBody)":{req:{id: number} res: {}}`)[0].error).toEqual("Error on the 1st argument: The mapping 'idx' should be exists in the request data.")
    });

    it('should not return error when the syntax is ok', () => {
        expect(compile(`"(Rest/post /users/:id/profile?:old selfMappings asBody)":{req:{id: number, old:boolean} res: {}}`)[0].error).toEqual(undefined)
    });
})

describe("Compile tests on Local/get-in", () => {
    it('should should return error when the key is missing', () => {
        expect(compile(`"(Local/get-in)":{req:{id: number, old:boolean} res: {}}`)[0].error).toEqual("Error on the 1st argument: The syntax should be type/string")
    });

    it('should not return error when the syntax is correct', () => {
        expect(compile(`"(Local/get-in user-profile)":{req:{id: number, old:boolean} res: {}}`)[0].error).toEqual(undefined)
    });
})

describe("Compile tests on Local/set-in", () => {
    it('should should return error when the key is missing', () => {
        expect(compile(`"(Local/set-in)":{req:{id: number, old:boolean} res: {}}`)[0].error).toEqual("Error on the 1st argument: The syntax should be type/string")
    });

    it('should not return error when the syntax is correct', () => {
        expect(compile(`"(Local/set-in user-profile)":{req:{id: number, old:boolean} res: {}}`)[0].error).toEqual(undefined)
    });
})

const httpRequestSender: RestRequestSender = (url, method, requestBody): object => {
    return {}
};
const localStorageManager: LocalStorageManager = {
    store(key: string, data: object) {
        return undefined;
    },
    retrieve(key: string): object {
        return {}
    }
}

function deleteDirectory(directory: string) {
    if (fs.existsSync(directory)) {
        fs.readdirSync(directory).forEach((file, index) => {
            const curPath = path.join(directory, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteDirectory(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(directory);
    }
}

describe("CompileAll Tests", () => {
    beforeAll(() => {
        deleteDirectory("data")
    })

    it('should throw exception when the data access layer not exists', () => {
        expect(() => {
            compileAll(httpRequestSender, localStorageManager)
        }).toThrow("ERROR: Add data access layer to your project root folder before compiling. More information: xxx");
    });
    afterAll(() => {
        const dirPath = path.join(__dirname, '../data/api');
        const filePath = path.join(dirPath, 'getFactsTestCase.ts');

        // Create directory if it doesn't exist
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, {recursive: true});
        }

        // Recreate the file with the new content
        fs.writeFileSync(filePath, `type BasicResponse<T> = {
    success: boolean,
    message: string
    data: T
}
export type Users = {
    "(Rest/get /users/:id/posts?:deleted&:dateGreaterThan selfMappings)": {
        req: {
            id: number,
            deleted: boolean,
            dateGreaterThan: string
        },
        res: BasicResponse<{
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
        res: BasicResponse<any>
    },
    "(Rest/delete /users/:id/posts/:postId selfMappings asBody (Delete the post of the user))": {
        req: {
            id: number,
            postId: number
        },
        res: BasicResponse<any>
    },
    "(Rest/put /users/:id/posts/:postId selfMappings asBody (update the post)": {
        req: {
           id: number,
           postId: number,
           title: string,
           content: string
        },
        res: BasicResponse<any>
    },
    "(Rest/patch /users/:id/posts/:postId?:titleOnly selfMappings asBody (patching the post)": {
        req: {
            id: number,
            postId: number,
            titleOnly: boolean,
            title: string,
            content: string
        },
        res: BasicResponse<any>
    },
    "(Local/get-in user-profile (get the profile of the user))": {
        req: {
            
        },
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
        res: {
        }
    } 
}`, 'utf-8'
        )
    })
})


describe("getFacts tests", () => {
    it('should throw exception when compileAll did not been called.', () => {
        expect(() => {
            getFacts("(Rest/get /users/:id/posts?:deleted selfMappings)")
        }).toThrow("No compilation found for the lsp. Should call compileAll before call getFacts. Did you forget to add the compileAll to your entrypoint?")
    });

    it('should return the correct facts', () => {
        compileAll(httpRequestSender, localStorageManager)
        const facts = getFacts("(Rest/get /users/:id/posts?:deleted&:dateGreaterThan selfMappings)")
        expect(facts).toEqual({
            urlFormattingMappings: {
                "id": "id",
                "deleted": "deleted",
                "dateGreaterThan": "dateGreaterThan"
            },
            reqDataKeys: ["id", "deleted", "dateGreaterThan"]
        })
    });
})