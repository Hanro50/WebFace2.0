
import { join } from "path";
import { existsSync, mkdirSync, unlinkSync, symlinkSync, readFileSync, createWriteStream, statSync, writeFileSync, read, rmSync, readdirSync, copyFileSync, lstatSync } from 'fs';
import { createHash } from "crypto";
import { platform, type } from "os";
import { execSync } from "child_process";
/**
 * 
 * @param target Path to create the link in
 * @param path Path to the file to link to
 */
export function mklink(target: string, path: string) {
    try {
        if (existsSync(path)) unlinkSync(path)
        symlinkSync(target, path, "junction");
    } catch (e) {
        console.error(e);
        console.error("Could not create syslink between " + target + "=>" + path)
    }
}


export function mkdir(path: string) {
    if (!existsSync(path)) mkdirSync(path, { recursive: true, });
}

export function stringify(json: object) {
    //@ts-ignore
    return JSON.stringify(json, "\n", "\t");
}
const isWin = platform() == "win32";

export class dir {
    isRelative() {
        if (this.path.length < 1) return true
        if (isWin) return !this.path[0].includes(":");
        return !this.path[0].startsWith("/");
    }

    islink() {
        return lstatSync(this.sysPath()).isSymbolicLink();
    }
    path: string[];
    constructor(...path: string[]) {
        this.path = [];

        if (!isWin && path[0].startsWith("/")) {
            this.path.push("/")
        }
        path.forEach(e => {
            if (isWin)
                e = e.replace(/\\/g, '/')
            this.path.push(...e.split("/"));
        })
        this.path = this.path.filter((el) => {
            return el.length > 0;
        })


    }
    sysPath() {
        if (this.isRelative()) {
            return join(process.cwd(), ...this.path);
        }
        return join(...this.path);
    }
    mkdir() {
        mkdir(join(...this.path));
        return this;
    }
    link(linkto: string | string[] | file | dir) {
        if (linkto instanceof file)
            linkto = [...linkto.path, linkto.name];
        if (linkto instanceof dir)
            linkto = linkto.path;
        if (linkto instanceof Array)
            linkto = join(...linkto);
        mklink(this.sysPath(), linkto);
    }
    /**@override */
    toString() {
        return this.sysPath();
    }
    getDir(..._file: string[]) {
        return new dir(...this.path, ..._file);
    }

    getFile(..._file: string[]) {
        return new file(...this.path, ..._file);
    }
    rm() {
        rmSync(this.sysPath(), { recursive: true, force: true })
        return this;
    }
    exists() {
        return existsSync(this.sysPath());
    }
    javaPath() {
        return this.path.join("/");
    }
    ls() {

        let res: Array<dir | file> = [];
        if (this.exists()) {
            readdirSync(this.sysPath()).forEach(e => {
                const stat = statSync(join(this.sysPath(), e));
                res.push(stat.isFile() ? this.getFile(e) : this.getDir(e));
            })
        }
        return res;
    }
    getName() {
        return this.path[this.path.length - 1]
    }
}
export class file extends dir {
    forEach(arg0: (val: any) => void) {
        throw new Error("Method not implemented.");
    }
    dir(): dir {
        return new dir(...this.path);
    }
    name: string;
    constructor(...path: string[]) {
        super(...path);
        this.name = this.path.pop();
    }

    read(): string {
        return readFileSync(this.sysPath()).toString();
    }
    toJSON<T>() {
        if (this.exists())
            return JSON.parse(readFileSync(this.sysPath()).toString()) as T;
        console.trace();
        throw "No file to read!"
    }
    /**@override */
    getName() {
        return this.name;
    }

    /**@override */
    link(path: string | string[] | file) {
        if (platform() == "win32") {
            console.warn("[GMLL]: Symlinks in Windows need administrator priviliges!\nThings are about to go wrong!")
        }

        return super.link(path);
    }
    /**@override */
    sysPath() {
        return join(super.sysPath(), this.name);
    }

    /**@override */
    javaPath() {
        return [...this.path, this.name].join("/");
    }
    copyto(file: file) {
        copyFileSync(this.sysPath(), file.sysPath());
    }
    sha1(expected: string | string[]) {
        if (!this.exists()) return false
        const sha1 = this.getHash();
        let checksums: string[] = [];
        if (typeof expected == "string") checksums.push(expected); else checksums = expected;
        for (var chk = 0; chk < checksums.length; chk++) {
            if (checksums[chk] == sha1) return true;
        }
        return false;
    }
    getHash() {
        return createHash('sha1').update(readFileSync(this.sysPath())).digest("hex");
    }
    getSize() {
        return statSync(this.sysPath()).size;
    }
    size(expected: number) {
        if (!this.exists()) return false
        return this.getSize() == expected;
    }
    /**Returns true if the file is in missmatch */
    chkSelf(chk?: { sha1?: string | string[], size?: number }) {
        if (!chk || !this.exists()) return true
        if (chk.sha1 && !this.sha1(chk.sha1)) return true
        if (chk.size && !this.size(chk.size)) return true

        return false;
    }

    chmod() {
        if (type() != "Windows_NT")
            execSync('chmod +x ' + this.sysPath())
    }

    write(data: string | ArrayBuffer | object) {
        if (typeof data == "object")
            data = stringify(data);
        writeFileSync(this.sysPath(), data);
    }
}