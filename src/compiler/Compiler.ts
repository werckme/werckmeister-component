import { Ticks } from "../shared/types";
import { FileInfo, IFileSystemInspector, Path } from "@werckmeister/language-features";

declare const require
const WerckmeisterFactory = require('@werckmeister/compilerjs/werckmeister');
const fs = require('fs');
const werckmeisterAuxiliaryFiles = JSON.parse(fs.readFileSync('./node_modules/@werckmeister/compilerjs/werckmeister-auxiliaries.json', 'utf8'));
const _ = require ('lodash');

interface FSNode {
    id: number,
    mode: number,
    isFolder: boolean,
    name: string,
    contents: { [filename: string]: FSNode }
}

interface WerckmeisterModule {
    cwrap: (name: string, returnType: string, args: any[]) => CallableFunction;
    _free: (ptr: number) => void;
    UTF8ToString: (strPtr: number) => string;
    FS: {
        writeFile: (path: string, data: string) => void,
        analyzePath: (path: string, dontResolveLastLink: boolean) => {
            isRoot: boolean,
            exists: boolean,
            name: string,
            path: string,
            object: FSNode,
            parentExists: boolean,
            parentPath: string,
            parentObject: string,
        },
        mkdir: (path: string) => void,
        unlink: (path: string) => void,
        stat: (path: string) => {
            mode: number,
            size: number
        }
        isDir: (mode: number) => boolean,
        isFile: (mode: number) => boolean

    };
}

class FileSystemInspector implements IFileSystemInspector {
    private blacklist = ["/dev", "/home", "/proc", "/tmp"]
    constructor(private module: WerckmeisterModule) {}
    
    public async resolve(basePath: Path, path: Path): Promise<Path> {
        return path.replace('./', basePath);
    }

    public async ls(path: Path): Promise<FileInfo[]> {
        const fs = this.module.FS;
        const analyzed = fs.analyzePath(path, false);
        const pathExistsAndIsAFolder = analyzed.exists && analyzed.object && analyzed.object.isFolder;
        if (!pathExistsAndIsAFolder) {
            return [];
        }
        const fileInfos:FileInfo[] = [];
        const contents = analyzed.object.contents;
        for(const fileName in contents) {
            const node = contents[fileName];
            if (this.blacklist.includes(`${analyzed.parentPath}${fileName}`)) {
                continue;
            }
            if (fileName[0] === '_' || fileName[0] === '.') {
                continue;
            }
            fileInfos.push({
                name: fileName,
                isDirectory: node.isFolder
            });
        }
        return fileInfos;
    }
    public async getParentPath(path: Path): Promise<Path> {
        const fs = this.module.FS;
        const analyzed = fs.analyzePath(path, false);
        return analyzed.parentPath;
    }

}

export interface ICompilerError {
    errorMessage: string;
    positionBegin: number;
    sourceFile: string;
    sourceId: number;
}

export interface ICompilerWarning {
    message: string;
    positionBegin: number;
    sourceFile: string;
    sourceId: number;
}

export class CompilerError implements ICompilerError {
    constructor(public errorMessage: string = "") {

    }
    positionBegin: number;
    sourceFile: string;
    sourceId: number;
}

export interface IRequestFile {
    path: string;
    data: string;
}

export interface SheetEventInfo {
    beginPosition: Ticks,
    endPosition: Ticks,
    sourceId: number
}

export interface IWerckmeisterCompiledDocument {
    eventInfos: {
        pid: number,
        sheetTime: Ticks,
        sheetEventInfos: SheetEventInfo[],
    }[],
    midi: {
        bpm: number,
        duration: Ticks,
        midiData: string,
        sources: {
            sourceId: number,
            path: string
        }[],
        warnings: ICompilerWarning[]
    }
}

export class WerckmeisterCompiler {
    module: Promise<WerckmeisterModule>;
    /**
     * before compiling, these files were written to the filesystem
     */
    private cwdFiles: string[] = [];
    private createCompileResult: (file: string, beginQuarters: number) => number;
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

    public async getFileSystemInspector(): Promise<IFileSystemInspector> {
        return new FileSystemInspector(await this.module);
    }

    /**
     * 
     * @param module 
     */
    private prepareModule(module: WerckmeisterModule) {
        this.createCompileResult =
            module.cwrap('create_compile_result', 'number', ['string', 'number']) as (file: string, beginQuarters: number) => number;
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
        const auxFiles:IRequestFile[] = _.cloneDeep(werckmeisterAuxiliaryFiles);
        const fs = werckmeisterModule.FS;
        for (const file of auxFiles) {
          try {
            this.mkdir_p(file.path, werckmeisterModule);
            fs.writeFile(file.path, file.data);
          } catch(ex) {
            console.error(ex);
          }
        }
    }

    public async writeFileToFS(path: string, data: string) {
        const wm = await this.module;
        wm.FS.writeFile(path,  data);
        this.cwdFiles.push(path);
    }

    async cleanCWD() {
        const fs = (await this.module).FS;

        for(const path of this.cwdFiles) {
            const info = fs.analyzePath(path, false);
            if (info.exists) {
                fs.unlink(path);
            }
        }
        this.cwdFiles.splice(0, this.cwdFiles.length);
    }

    /**
     * 
     * @param sheetFile 
     */
    async compile(sheetFiles: IRequestFile[], beginQuarters:number = 0): Promise<IWerckmeisterCompiledDocument> {
        await this.cleanCWD();
        if (!sheetFiles || sheetFiles.length === 0) {
            throw new CompilerError("no content to compile");
        }
        const wm = await this.module;
        let strPtr: number = 0;
        let mainSheet:IRequestFile = null;
        for(const sheetFile of sheetFiles) {
            if (!sheetFile.path || !sheetFile.path.trim()) {
                throw new CompilerError("sheet file has no path");
            }
            await this.writeFileToFS(sheetFile.path, sheetFile.data);
            if (sheetFile.path.trim().endsWith('.sheet')) {
                mainSheet = sheetFile;
            }
        }
        if (!mainSheet) {
            throw new CompilerError("missing main sheet file (.sheet)");
        }
        strPtr = this.createCompileResult(mainSheet.path, beginQuarters);
        const resultStr = wm.UTF8ToString(strPtr);
        wm._free(strPtr);
        const resultJson = JSON.parse(resultStr);
        if (resultJson.errorMessage) {
            throw { error: resultJson };
        }
        return resultJson;
    }
}