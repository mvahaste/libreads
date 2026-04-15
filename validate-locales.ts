import fs from "fs";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>;

function collectKeys(obj: JsonObject, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return collectKeys(value, fullKey);
    }

    return fullKey;
  });
}

function compareLocales(base: JsonObject, target: JsonObject) {
  const baseKeys = collectKeys(base).sort();
  const targetKeys = collectKeys(target).sort();

  const missing = baseKeys.filter((k) => !targetKeys.includes(k));
  const extra = targetKeys.filter((k) => !baseKeys.includes(k));

  return { missing, extra };
}

function loadJson(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function loadLocaleDir(dirPath: string): JsonObject {
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const merged: JsonObject = {};

  for (const file of files) {
    const namespace = path.parse(file).name;
    merged[namespace] = loadJson(path.join(dirPath, file));
  }

  return merged;
}

function main() {
  const LOCALES_DIR = path.resolve(process.cwd(), "locales");
  const BASE_LOCALE = "en";

  const localeDirs = fs.readdirSync(LOCALES_DIR).filter((entry) => {
    const fullPath = path.join(LOCALES_DIR, entry);
    return fs.statSync(fullPath).isDirectory() && entry !== BASE_LOCALE;
  });

  console.log(`Base locale: ${BASE_LOCALE}`);
  console.log(`Locales to compare: ${localeDirs.join(", ")}`);
  console.log("");

  const baseJson = loadLocaleDir(path.join(LOCALES_DIR, BASE_LOCALE));
  let hasError = false;

  for (const locale of localeDirs) {
    // Add spacing between locale reports
    if (localeDirs.indexOf(locale) >= 1) console.log("");

    const targetJson = loadLocaleDir(path.join(LOCALES_DIR, locale));
    const { missing, extra } = compareLocales(baseJson, targetJson);

    if (missing.length === 0 && extra.length === 0) {
      console.info(`${locale}/ matches ${BASE_LOCALE}/`);
    } else {
      console.warn(`Differences in ${locale}/ vs ${BASE_LOCALE}/:`);

      if (missing.length > 0) {
        console.error(` - Missing keys in ${locale}/:`);
        missing.forEach((key) => console.error(`   - ${key}`));
      }

      if (extra.length > 0) {
        console.warn(` - Extra keys in ${locale}/:`);
        extra.forEach((key) => console.warn(`   - ${key}`));
      }

      hasError = true;
    }
  }

  process.exit(hasError ? 1 : 0);
}

main();
