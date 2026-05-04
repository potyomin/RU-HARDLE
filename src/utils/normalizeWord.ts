export function normalizeWord(word: string): string {
  return word.trim().toUpperCase().replace(/Ё/g, "Е");
}
