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