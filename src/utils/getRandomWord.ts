export function getRandomWord(words: string[]): string {
  if (!Array.isArray(words) || words.length === 0) {
    throw new Error(
      "Словарь пуст. Добавьте слова в src/Data/raw/ и выполните npm run prepare:words.",
    );
  }

  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

