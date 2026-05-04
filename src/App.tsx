import { useCallback, useEffect, useMemo, useState } from "react";
import words from "./Data/words.generated.json";
import GameBoard from "./components/GameBoard";
import GameStatus from "./components/GameStatus";
import VirtualKeyboard from "./components/VirtualKeyboard";
import type { Attempt, CellNoteState } from "./types";
import { getRandomWord } from "./utils/getRandomWord";
import { normalizeWord } from "./utils/normalizeWord";
import { scoreGuess } from "./utils/scoreGuess";

type GameState = "playing" | "won" | "lost";
type Theme = "light" | "dark";

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 10;
const THEME_STORAGE_KEY = "countle-theme";
const DICTIONARY = Array.isArray(words) ? words : [];
const DICTIONARY_SET = new Set(DICTIONARY);
const NOTE_PRIORITY: Record<CellNoteState, number> = {
  none: 0,
  gray: 1,
  yellow: 2,
  green: 3,
};

function createEmptyGuessCells(): string[] {
  return Array.from({ length: WORD_LENGTH }, () => "");
}

function getCellKey(rowIndex: number, colIndex: number): string {
  return `${rowIndex}:${colIndex}`;
}

function parseCellKey(cellKey: string): { rowIndex: number; colIndex: number } | null {
  const [rowRaw, colRaw] = cellKey.split(":");
  const rowIndex = Number.parseInt(rowRaw, 10);
  const colIndex = Number.parseInt(colRaw, 10);

  if (Number.isNaN(rowIndex) || Number.isNaN(colIndex)) {
    return null;
  }

  return { rowIndex, colIndex };
}

function clampIndex(index: number): number {
  return Math.max(0, Math.min(WORD_LENGTH - 1, index));
}

function nextNoteState(state: CellNoteState): CellNoteState {
  if (state === "none") {
    return "gray";
  }
  if (state === "gray") {
    return "yellow";
  }
  if (state === "yellow") {
    return "green";
  }
  return "none";
}

function sanitizeSingleLetter(value: string): string | null {
  const prepared = normalizeWord(value).replace(/[^А-Я]/g, "");
  return prepared.length === 1 ? prepared : null;
}

function App() {
  const dictionaryReady = DICTIONARY.length > 0;
  const [answer, setAnswer] = useState<string>(() =>
    dictionaryReady ? getRandomWord(DICTIONARY) : "",
  );
  const [currentGuessCells, setCurrentGuessCells] = useState<string[]>(() => createEmptyGuessCells());
  const [activeCellIndex, setActiveCellIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [status, setStatus] = useState<GameState>("playing");
  const [errorMessage, setErrorMessage] = useState("");
  const [cellNotes, setCellNotes] = useState<Record<string, CellNoteState>>({});
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  });

  const isInputDisabled = !dictionaryReady || status !== "playing";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const appendLetter = useCallback(
    (rawValue: string) => {
      if (isInputDisabled) {
        return;
      }

      const letter = sanitizeSingleLetter(rawValue);
      if (!letter) {
        return;
      }

      const targetIndex = clampIndex(activeCellIndex);

      setCurrentGuessCells((prev) => {
        const next = [...prev];
        next[targetIndex] = letter;
        return next;
      });
      setActiveCellIndex(clampIndex(targetIndex + 1));
      setErrorMessage("");
    },
    [activeCellIndex, isInputDisabled],
  );

  const removeLetter = useCallback(() => {
    if (isInputDisabled) {
      return;
    }

    const cells = [...currentGuessCells];
    const selectedIndex = clampIndex(activeCellIndex);

    if (cells[selectedIndex]) {
      cells[selectedIndex] = "";
      setCurrentGuessCells(cells);
      setActiveCellIndex(selectedIndex);
      setErrorMessage("");
      return;
    }

    for (let colIndex = selectedIndex - 1; colIndex >= 0; colIndex -= 1) {
      if (cells[colIndex]) {
        cells[colIndex] = "";
        setCurrentGuessCells(cells);
        setActiveCellIndex(colIndex);
        setErrorMessage("");
        return;
      }
    }
  }, [activeCellIndex, currentGuessCells, isInputDisabled]);

  const submitGuess = useCallback(() => {
    if (isInputDisabled) {
      return;
    }

    const preparedGuess = normalizeWord(currentGuessCells.join(""));
    if (preparedGuess.length !== WORD_LENGTH || preparedGuess.includes(" ")) {
      setErrorMessage("Заполните все 5 клеток русскими буквами.");
      return;
    }

    if (!DICTIONARY_SET.has(preparedGuess)) {
      setErrorMessage("Такого слова нет в словаре.");
      return;
    }

    const { green, yellow } = scoreGuess(preparedGuess, answer);
    const nextAttempts = [...attempts, { word: preparedGuess, green, yellow }];

    setAttempts(nextAttempts);
    setCurrentGuessCells(createEmptyGuessCells());
    setActiveCellIndex(0);
    setErrorMessage("");

    if (green === WORD_LENGTH) {
      setStatus("won");
      return;
    }

    if (nextAttempts.length >= MAX_ATTEMPTS) {
      setStatus("lost");
    }
  }, [answer, attempts, currentGuessCells, isInputDisabled]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitGuess();
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        removeLetter();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveCellIndex((prev) => clampIndex(prev - 1));
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveCellIndex((prev) => clampIndex(prev + 1));
        return;
      }

      if (event.key.length === 1) {
        const letter = sanitizeSingleLetter(event.key);
        if (letter) {
          event.preventDefault();
          appendLetter(letter);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [appendLetter, removeLetter, submitGuess]);

  const toggleCellNote = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (rowIndex >= attempts.length) {
        return;
      }

      const rowWord = attempts[rowIndex]?.word ?? "";
      if (!rowWord[colIndex]) {
        return;
      }

      setCellNotes((prev) => {
        const key = getCellKey(rowIndex, colIndex);
        const currentState = prev[key] ?? "none";
        const nextState = nextNoteState(currentState);
        const next = { ...prev };

        if (nextState === "none") {
          delete next[key];
        } else {
          next[key] = nextState;
        }

        return next;
      });
    },
    [attempts],
  );

  const clearRowNotes = useCallback((rowIndex: number) => {
    setCellNotes((prev) => {
      const next = { ...prev };
      let changed = false;

      for (let colIndex = 0; colIndex < WORD_LENGTH; colIndex += 1) {
        const key = getCellKey(rowIndex, colIndex);
        if (key in next) {
          delete next[key];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, []);

  const keyboardNotes = useMemo(() => {
    const result: Record<string, CellNoteState> = {};
    const currentRowIndex = attempts.length;

    const getLetter = (rowIndex: number, colIndex: number): string => {
      if (rowIndex < attempts.length) {
        return attempts[rowIndex].word[colIndex] ?? "";
      }

      if (rowIndex === currentRowIndex) {
        return currentGuessCells[colIndex] ?? "";
      }

      return "";
    };

    for (const [cellKey, state] of Object.entries(cellNotes)) {
      if (state === "none") {
        continue;
      }

      const parsed = parseCellKey(cellKey);
      if (!parsed) {
        continue;
      }

      const letter = getLetter(parsed.rowIndex, parsed.colIndex);
      if (!letter) {
        continue;
      }

      const existingState = result[letter] ?? "none";
      if (NOTE_PRIORITY[state] > NOTE_PRIORITY[existingState]) {
        result[letter] = state;
      }
    }

    return result;
  }, [attempts, cellNotes, currentGuessCells]);

  const resetGame = useCallback(() => {
    if (!dictionaryReady) {
      return;
    }

    setAnswer(getRandomWord(DICTIONARY));
    setCurrentGuessCells(createEmptyGuessCells());
    setActiveCellIndex(0);
    setAttempts([]);
    setStatus("playing");
    setErrorMessage("");
    setCellNotes({});
  }, [dictionaryReady]);

  return (
    <main className="page">
      <section className="game-shell">
        <header className="shell-header">
          <div className="header-group">
            <button
              className="icon-button"
              type="button"
              aria-label="Сменить тему"
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              title="Сменить тему"
            >
              {theme === "light" ? "☀" : "☾"}
            </button>
          </div>

          <h1 className="title">RU-HARDLE</h1>

          <button
            className="icon-button"
            type="button"
            aria-label="Новая игра"
            onClick={resetGame}
            title="Заново"
          >
            ↻
          </button>
        </header>

        <p className="rules">
          Угадайте слово из 5 букв. Показаны только числа совпадений: жёлтые и зелёные.
        </p>

        {!dictionaryReady ? (
          <p className="dictionary-error">
            Словарь пуст. Добавьте файл в <code>src/Data/raw/</code>, затем выполните{" "}
            <code>npm run prepare:words</code>.
          </p>
        ) : (
          <>
            <GameStatus
              status={status}
              answer={answer}
              attemptsUsed={attempts.length}
              maxAttempts={MAX_ATTEMPTS}
            />

            {errorMessage ? <p className="error-message">{errorMessage}</p> : null}

            <GameBoard
              attempts={attempts}
              currentGuessCells={currentGuessCells}
              maxAttempts={MAX_ATTEMPTS}
              wordLength={WORD_LENGTH}
              notes={cellNotes}
              onToggleNote={toggleCellNote}
              onClearRowNotes={clearRowNotes}
              onSelectInputCell={setActiveCellIndex}
              activeCellIndex={activeCellIndex}
            />

            <VirtualKeyboard
              disabled={isInputDisabled}
              onLetter={appendLetter}
              onBackspace={removeLetter}
              onEnter={submitGuess}
              keyNotes={keyboardNotes}
            />
          </>
        )}
      </section>
    </main>
  );
}

export default App;
