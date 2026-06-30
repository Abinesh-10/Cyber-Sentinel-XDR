import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function ensureAttackSchema(db) {
  const schemaPath = path.resolve(__dirname, "../../../database/schema/attacks.sql");
  db.exec(fs.readFileSync(schemaPath, "utf8"));
}
