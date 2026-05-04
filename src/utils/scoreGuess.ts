export type GuessScore = {
  green: number;
  yellow: number;
};

export function scoreGuess(guess: string, answer: string): GuessScore {
  const usedAnswer = new Array(answer.length).fill(false);
  const usedGuess = new Array(guess.length).fill(false);

  let green = 0;
  let yellow = 0;

  for (let i = 0; i < guess.length; i += 1) {
    if (guess[i] === answer[i]) {
      green += 1;
      usedAnswer[i] = true;
      usedGuess[i] = true;
    }
  }

  // Second pass avoids double-counting repeated letters:
  // each letter in answer can be used at most once.
  for (let i = 0; i < guess.length; i += 1) {
    if (usedGuess[i]) {
      continue;
    }

    for (let j = 0; j < answer.length; j += 1) {
      if (!usedAnswer[j] && guess[i] === answer[j]) {
        yellow += 1;
        usedAnswer[j] = true;
        usedGuess[i] = true;
        break;
      }
    }
  }

  return { green, yellow };
}

