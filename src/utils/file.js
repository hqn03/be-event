import fs from "fs/promises";
import path from "path";

export async function getEmailTemplate(name) {
  const filePath = path.join(process.cwd(), "src", "templates", name);
  const file = await fs.readFile(filePath, "utf8");
  return file;
}
