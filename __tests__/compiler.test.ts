import {compile, compileAll} from '../src/compiler';

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

    it('should not error error when the syntax is ok', () => {
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


describe("CompileAll Tests", () => {
    it('should throw exception when the data access layer not exists', () => {
        expect(() => {
            compileAll((url, method, requestBody): object => {
                return {}
            }, {
                store(key: string, data: object) {
                    return undefined;
                },
                retrieve(key: string): object {
                    return {}
                }
            })
        }).toThrow("ERROR: Add data access layer to your project root folder before compiling. More information: xxx");
    });
})