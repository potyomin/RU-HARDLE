import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const rawDir = path.join(projectRoot, "src", "Data", "raw");
const outputPath = path.join(projectRoot, "src", "Data", "words.generated.json");

const EXTENSION_PRIORITY = new Map([
  [".txt", 0],
  [".js", 1],
  [".mjs", 2],
  [".cjs", 3],
]);

const RU_ANY = /[\u0410-\u044F\u0401\u0451]/gu;
const REPLACEMENT = /\uFFFD/gu;
const WIN1251_DECODER = new TextDecoder("windows-1251");
const UTF8_DECODER = new TextDecoder("utf-8");

// Build reverse map so we can encode text back into windows-1251 bytes.
const WIN1251_ENCODE_MAP = new Map();
for (let byte = 0; byte < 256; byte += 1) {
  const char = WIN1251_DECODER.decode(Uint8Array.of(byte));
  if (!WIN1251_ENCODE_MAP.has(char)) {
    WIN1251_ENCODE_MAP.set(char, byte);
  }
}

function normalizeWord(word) {
  return word.trim().toUpperCase().replaceAll("\u0401", "\u0415");
}

function isValidWord(word) {
  return word.length === 5 && /^[\u0410-\u042F]{5}$/u.test(word);
}

function scoreDecodingQuality(text) {
  const sampleLines = text.split(/\r?\n/u);
  let validWords = 0;

  for (const line of sampleLines) {
    if (isValidWord(normalizeWord(line))) {
      validWords += 1;
    }
  }

  const cyrillicCount = (text.match(RU_ANY) ?? []).length;
  const brokenCount = (text.match(REPLACEMENT) ?? []).length;
  return validWords * 1000 + cyrillicCount - brokenCount * 8;
}

function maybeFixUtf8Mojibake(text) {
  const bytes = [];

  for (const char of text) {
    const encodedByte = WIN1251_ENCODE_MAP.get(char);
    if (encodedByte === undefined) {
      return text;
    }
    bytes.push(encodedByte);
  }

  return UTF8_DECODER.decode(Uint8Array.from(bytes));
}

function decodeBuffer(buffer) {
  const utf8Text = buffer.toString("utf8");
  const decoded1251 = WIN1251_DECODER.decode(buffer);
  const repairedUtf8 = maybeFixUtf8Mojibake(utf8Text);
  const repaired1251 = maybeFixUtf8Mojibake(decoded1251);
  const candidates = [utf8Text, decoded1251, repairedUtf8, repaired1251];

  let bestText = candidates[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const candidateScore = scoreDecodingQuality(candidate);
    if (candidateScore > bestScore) {
      bestText = candidate;
      bestScore = candidateScore;
    }
  }

  return bestText;
}

async function findSourceFile() {
  const entries = await fs.readdir(rawDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => EXTENSION_PRIORITY.has(path.extname(name).toLowerCase()));

  if (candidates.length === 0) {
    throw new Error("No .txt/.js dictionary found in src/Data/raw/.");
  }

  candidates.sort((left, right) => {
    const extDiff =
      EXTENSION_PRIORITY.get(path.extname(left).toLowerCase()) -
      EXTENSION_PRIORITY.get(path.extname(right).toLowerCase());

    if (extDiff !== 0) {
      return extDiff;
    }

    return left.localeCompare(right, "ru");
  });

  if (candidates.length > 1) {
    console.warn(
      `[prepare:words] Multiple sources found: ${candidates.join(", ")}. Using ${candidates[0]}.`,
    );
  }

  return path.join(rawDir, candidates[0]);
}

async function tryReadArraysFromModule(filePath) {
  const url = `${pathToFileURL(filePath).href}?cacheBust=${Date.now()}`;
  const loaded = await import(url);
  const arrays = [];

  for (const value of Object.values(loaded)) {
    if (Array.isArray(value)) {
      arrays.push(value);
    }
  }

  if (Array.isArray(loaded.default)) {
    arrays.push(loaded.default);
  }

  return arrays.flat().filter((item) => typeof item === "string");
}

function extractQuotedStrings(content) {
  const regex = /(["'`])((?:\\.|(?!\1)[^\\\r\n])*)\1/g;
  const result = [];

  for (const match of content.matchAll(regex)) {
    const value = match[2]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
    result.push(value);
  }

  return result;
}

async function parseTxtFile(filePath) {
  const content = decodeBuffer(await fs.readFile(filePath));
  return content.split(/\r?\n/u);
}

async function parseJsFile(filePath) {
  const content = decodeBuffer(await fs.readFile(filePath));

  try {
    const wordsFromModule = await tryReadArraysFromModule(filePath);
    if (wordsFromModule.length > 0) {
      return wordsFromModule;
    }
  } catch {
    // Fall through to quoted string extraction.
  }

  return extractQuotedStrings(content);
}

async function loadRawWords(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase();
  if (ext === ".txt") {
    return parseTxtFile(sourcePath);
  }
  return parseJsFile(sourcePath);
}

async function main() {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const sourcePath = await findSourceFile();
  const rawWords = await loadRawWords(sourcePath);

  // Normalize, keep only strict 5-letter Russian words, and deduplicate.
  const preparedWords = Array.from(
    new Set(rawWords.map(normalizeWord).filter((word) => isValidWord(word))),
  ).sort((left, right) => left.localeCompare(right, "ru"));

  await fs.writeFile(outputPath, `${JSON.stringify(preparedWords, null, 2)}\n`, "utf8");

  console.log(`[prepare:words] Source file: ${path.relative(projectRoot, sourcePath)}`);
  console.log(`[prepare:words] Generated: ${path.relative(projectRoot, outputPath)}`);
  console.log(`[prepare:words] Total words: ${preparedWords.length}`);

  if (preparedWords.length === 0) {
    console.warn("[prepare:words] Dictionary is empty after filtering.");
  }
}

main().catch((error) => {
  console.error(`[prepare:words] Error: ${error.message}`);
  process.exitCode = 1;
});
