import { ServerOptions } from "https";
import { dir, file } from "./files.js";
export const root = new dir(".data").mkdir();
const settingsFile = root.getFile("settings.json");
if (!settingsFile.exists()) {
    settingsFile.write({ http: { port: 8080 }, main: { port: 5000 } })
}
export const config = settingsFile.toJSON<settings>();
interface settings {
    https?: ServerOptions & {
        port: number,
        passThrough?: boolean
    },
    http?: {
        port: number
    }
    main: { port: number, password?: string }
    cloudflare?: string
    logLimit?: number;
    //noInsecure being set to true will disable the vanilla http server

}
export const LICENCE = new file("LICENSE");

export interface sysSettings {
    supported: boolean
    //name of the script file
    file?: string;
    //wether this needs to be an account with administrative rights. 
    root?: boolean;
    //The commands that need to be ran 
    commands?: [string];
    //The active working directory - defaults to script folder
    pwd?: [string];
}
export interface script {
    //name of the script
    name: string;
    //wether it should be registered as a system script
    system?: boolean;
    //wether it should run at startup
    startup?: boolean;
    //wether this script should restart on a crash
    autorestart?: boolean;
    //a short discription
    description?: string;
    //platform specific settings
    settings: { [key in "windows" | "darwin" | "linux"]?: sysSettings } | sysSettings;
};