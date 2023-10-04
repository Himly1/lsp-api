import {loadApiMetaDataFromTheSourceCode} from "../src/apiMetadata";

describe("loadApiMetaDataFromTheSourceCode tests", () => {
    it('should return empty array when there is no api definition', () => {
        const sourceCode = `import * as fs from 'fs'

export function compile() {
    const apiPath = process.cwd() + "/data/api";
    const exists = fs.existsSync(apiPath);
    if (!exists) {
        throw "ERROR: Add data access layer to your project root folder before compiling. More information: xxx";
    }
}
`
        expect(loadApiMetaDataFromTheSourceCode(sourceCode)).toEqual([]);
    });

    it('should return all api metadata if there are definition exists.', () => {
        const sourCode = `export type Roles = {
    "(Rest/get /system/roles {} (Get system roles))": {
        req: {
            filters: string
            age: number
        },
        res: {

        }
    },
    "(Rest/post /users/:id/posts {:id userId} asBody (Add post of the user))": {
        req: {
            userId: number
            title: string
            content: string
        },
        res: {

        }
    }
}`
        const apiMetadataArr = loadApiMetaDataFromTheSourceCode(sourCode);
        console.log(`apiMetadataArr? ${JSON.stringify(apiMetadataArr)}`)
        expect(apiMetadataArr.length).toEqual(2);
        expect(apiMetadataArr[0]).toEqual({"lspDef": "(Rest/get /system/roles {} (Get system roles))", "args": ["filters", "age"]})
        expect(apiMetadataArr[1]).toEqual({"lspDef": "(Rest/post /users/:id/posts {:id userId} asBody (Add post of the user))", "args": ["userId", "title", "content"]})
    });
})