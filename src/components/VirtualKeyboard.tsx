import type { CellNoteState } from "../types";

const KEYBOARD_ROWS = [
  ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"] as const,
  ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"] as const,
  ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю"] as const,
];

type VirtualKeyboardProps = {
  disabled: boolean;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  keyNotes: Record<string, CellNoteState>;
};

export default function VirtualKeyboard({
  disabled,
  onLetter,
  onBackspace,
  onEnter,
  keyNotes,
}: VirtualKeyboardProps) {
  return (
    <section className="keyboard" aria-label="Виртуальная клавиатура">
      <div className="keyboard-row">
        {KEYBOARD_ROWS[0].map((letter) => (
          <button
            key={letter}
            type="button"
            className={`keyboard-key key-note-${keyNotes[letter] ?? "none"}`}
            disabled={disabled}
            onClick={() => onLetter(letter)}
            aria-label={`Буква ${letter}`}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="keyboard-row">
        {KEYBOARD_ROWS[1].map((letter) => (
          <button
            key={letter}
            type="button"
            className={`keyboard-key key-note-${keyNotes[letter] ?? "none"}`}
            disabled={disabled}
            onClick={() => onLetter(letter)}
            aria-label={`Буква ${letter}`}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="keyboard-row">
        <button
          type="button"
          className="keyboard-key keyboard-key-action"
          disabled={disabled}
          onClick={onEnter}
          aria-label="Проверить слово"
        >
          ✓
        </button>
        {KEYBOARD_ROWS[2].map((letter) => (
          <button
            key={letter}
            type="button"
            className={`keyboard-key key-note-${keyNotes[letter] ?? "none"}`}
            disabled={disabled}
            onClick={() => onLetter(letter)}
            aria-label={`Буква ${letter}`}
          >
            {letter}
          </button>
        ))}
        <button
          type="button"
          className="keyboard-key keyboard-key-action"
          disabled={disabled}
          onClick={onBackspace}
          aria-label="Удалить букву"
        >
          ⌫
        </button>
      </div>
    </section>
  );
}
