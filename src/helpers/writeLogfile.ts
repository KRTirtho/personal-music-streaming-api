import fs from "fs";
import path from "path";

/**
 * Writes any object|string|number|boolean as string to a file in with its file name
 * @author KR Tirtho
 * @param {string} filename name of the file
 * @param {*} data data to write to the file
 */
export default function writeLogFile(filename: string, data: any, { rmBeforeNew }: { rmBeforeNew?: boolean } = {}): void {
  const filepath = path.join(process.cwd(), "log", filename);
  if (rmBeforeNew && fs.existsSync(filename)) {
    fs.rmSync(filename);
  }
  fs.appendFileSync(filepath, JSON.stringify(data, null, 2), { encoding: "utf-8" });
}