import { Ticks } from "../shared/types";

declare const require
const WerckmeisterFactory = require('werckmeisterjs/werckmeister');


interface WerckmeisterModule {
    cwrap: (name: string, returnType: string, args: any[]) => CallableFunction;
    _free: (ptr: number) => void;
    UTF8ToString: (strPtr: number) => string;
    FS: {
        writeFile: (path: string, data: string) => void,
        analyzePath: (path: string, dontResolveLastLink: boolean) => {
            isRoot: boolean,
            exists: boolean,
            error: Error,
            name: string,
            path: string,
            object: string,
            parentExists: boolean,
            parentPath: string,
            parentObject: string
        },
        mkdir: (path: string) => void
    };
}

export interface ICompilerError {
    errorMessage: string;
    positionBegin: number;
    sourceFile: string;
    sourceId: number;
}

export interface IRequestFile {
    path: string;
    data: string;
}

export interface IWerckmeisterCompiledDocument {
    eventInfos: {
        pid: number,
        sheetTime: Ticks,
        sheetEventInfos: {
            beginPosition: Ticks,
            endPosition: Ticks,
            sourceId: number
        }[],
    }[],
    midi: {
        bpm: number,
        duration: Ticks,
        midiData: string,
        sources: {
            sourceId: number,
            path: string
        }[],
        warnings: {
            message: string,
            positionBegin: number,
            sourceFile: string, 
            sourceId: number
        }[]
    }
}

export class WerckmeisterCompiler {
    module: Promise<WerckmeisterModule>;
    private createCompileResult: (file: string) => number;
    /**
     * 
     */
    constructor() {
        this.module = WerckmeisterFactory().then(async module => {
            await this.init(module);
            return module;
        });
    }

    /**
     * 
     * @param module 
     */
    async init(module: WerckmeisterModule) {
        this.prepareModule(module);
        await this.prepareFileSystem(module);
    }

    /**
     * 
     * @param module 
     */
    private prepareModule(module: WerckmeisterModule) {
        this.createCompileResult =
            module.cwrap('create_compile_result', 'number', ['string']) as (file: string) => number;
    }

    /**
     * like mkdir -p
     * @param file 
     */
    private mkdir_p(path: string, module: WerckmeisterModule) {
        const segs = path.split('/');
        const createdSegs: string[] = [];
        for (let idx = 0; idx < segs.length; ++idx) {
            if (idx === segs.length - 1) {
                // skip filename
                break;
            }
            const seg = segs[idx];
            createdSegs.push(seg);
            const dirpath = createdSegs.join('/');
            const stat = module.FS.analyzePath(dirpath, false);
            if (stat.exists) {
                continue;
            }
            module.FS.mkdir(dirpath);
        }
    }

    /**
     * 
     * @param werckmeisterModule 
     */
    private async prepareFileSystem(werckmeisterModule: WerckmeisterModule) {
        // const auxFiles:IRequestFile[] = _.cloneDeep(await this.auxiliaries);
        // const fs = werckmeisterModule.FS;
        // for (const file of auxFiles) {
        //   try {
        //     this.mkdir_p(file.path, werckmeisterModule);
        //     fs.writeFile(file.path, file.data);
        //   } catch(ex) {
        //     console.error(ex);
        //   }
        // }
    }

    /**
     * 
     * @param sheetFile 
     */
    async compile(sheetFile: IRequestFile): Promise<IWerckmeisterCompiledDocument> {
        const wm = await this.module;
        let strPtr: number = 0;
        try {
            wm.FS.writeFile(sheetFile.path, sheetFile.data);
            strPtr = this.createCompileResult(sheetFile.path);
        } catch (ex) {
            console.error(ex)
        }
        const resultStr = wm.UTF8ToString(strPtr);
        wm._free(strPtr);
        const resultJson = JSON.parse(resultStr);
        if (resultJson.errorMessage) {
            throw { error: resultJson };
        }
        return resultJson;
    }
}