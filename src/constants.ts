import { existsSync, mkdirSync } from "fs";
export interface mapObj<T> { [key: string]: T; }
export const dataFile = "data";
if (!existsSync(dataFile)) { mkdirSync(dataFile); }

export interface meta {
    name: string;
    path: string;
    startup?: boolean;
    restart?: boolean;
    pwd?: string;
    runner?: string;
}
export interface script {
    meta: meta,
    data: string,

}

export interface proxy {
    port: number;
    host: string;
    prxy: string;
    hide: boolean;
}
export interface proxyServerConfig {
    http?: {
        port: Number;
    }
    https?: {
        port: Number;
        key: string;
        csr: string;
        ca: string[];
    }
}
