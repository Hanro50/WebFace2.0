import { dir, file } from "./files.js";
export const root = new dir(".data").mkdir();
const settingsFile = root.getFile("settings.json");
if (!settingsFile.exists()) {
    settingsFile.write({ proxy: { port: 8080 }, main: { port: 5000 } })
}
export const config = settingsFile.toJSON<settings>();
interface settings {
    proxy: { port: number, cloudflare?: string }
    main: { port: number, password?: string }
}
export const LICENCE = new file("LICENSE");