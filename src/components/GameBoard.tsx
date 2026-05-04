import type { Attempt, CellNoteState } from "../types";

type GameBoardProps = {
  attempts: Attempt[];
  currentGuessCells: string[];
  maxAttempts: number;
  wordLength: number;
  notes: Record<string, CellNoteState>;
  onToggleNote: (rowIndex: number, colIndex: number) => void;
  onClearRowNotes: (rowIndex: number) => void;
  onSelectInputCell: (colIndex: number) => void;
  activeCellIndex: number;
};

function getCellKey(rowIndex: number, colIndex: number): string {
  return `${rowIndex}:${colIndex}`;
}

export default function GameBoard({
  attempts,
  currentGuessCells,
  maxAttempts,
  wordLength,
  notes,
  onToggleNote,
  onClearRowNotes,
  onSelectInputCell,
  activeCellIndex,
}: GameBoardProps) {
  const currentRowIndex = attempts.length;
  const rows = Array.from({ length: maxAttempts }, (_, rowIndex) => {
    if (rowIndex < attempts.length) {
      return attempts[rowIndex].word.split("");
    }

    if (rowIndex === currentRowIndex) {
      return currentGuessCells;
    }

    return Array.from({ length: wordLength }, () => "");
  });

  return (
    <section className="board">
      {rows.map((rowLetters, rowIndex) => {
        const attempt = attempts[rowIndex];
        const isCurrentRow = rowIndex === currentRowIndex;
        const rowHasLetters = rowLetters.some((letter) => Boolean(letter));
        const rowHasNotes = Array.from({ length: wordLength }, (_, colIndex) =>
          Boolean(notes[getCellKey(rowIndex, colIndex)]),
        ).some(Boolean);

        return (
          <div key={`row-${rowIndex}`} className={`board-row ${isCurrentRow ? "board-row-active" : ""}`}>
            <div className="row-tools">
              <button
                type="button"
                className="row-clear-button"
                disabled={!rowHasNotes}
                onClick={() => onClearRowNotes(rowIndex)}
                title="Очистить выделение строки"
                aria-label={
                  rowHasLetters
                    ? `Очистить цветовые пометки в строке ${rowIndex + 1}`
                    : `Строка ${rowIndex + 1} пуста`
                }
              >
                🗑
              </button>
            </div>

            <div className="word-cells">
              {Array.from({ length: wordLength }, (_, colIndex) => {
                const letter = rowLetters[colIndex] ?? "";
                const note = notes[getCellKey(rowIndex, colIndex)] ?? "none";
                const isSelectedInput = isCurrentRow && activeCellIndex === colIndex;
                const cellClassName = `word-cell note-${note} ${isCurrentRow ? "word-cell-current" : ""} ${
                  isSelectedInput ? "word-cell-selected" : ""
                }`;

                return (
                  <button
                    key={`cell-${rowIndex}-${colIndex}`}
                    type="button"
                    className={cellClassName}
                    onClick={() => {
                      if (isCurrentRow) {
                        onSelectInputCell(colIndex);
                        return;
                      }
                      if (letter) {
                        onToggleNote(rowIndex, colIndex);
                      }
                    }}
                    aria-label={
                      isCurrentRow
                        ? `Выбрать позицию ${colIndex + 1} для ввода`
                        : letter
                          ? `Буква ${letter}, изменить пометку`
                          : "Пустая клетка"
                    }
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            <div className="score-cubes" aria-hidden={!attempt}>
              {attempt ? (
                <>
                  <span className="score-cube score-cube-yellow">{attempt.yellow}</span>
                  <span className="score-cube score-cube-green">{attempt.green}</span>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </section>
  );
}
