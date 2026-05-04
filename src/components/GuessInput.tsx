const INPUT_MAX_LENGTH = 5;

type GuessInputProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  errorMessage: string;
};

function sanitizeInput(rawValue: string): string {
  return rawValue
    .toUpperCase()
    .replace(/Ё/g, "Е")
    .replace(/[^А-Я]/g, "")
    .slice(0, INPUT_MAX_LENGTH);
}

export default function GuessInput({
  value,
  onChange,
  onSubmit,
  disabled,
  errorMessage,
}: GuessInputProps) {
  return (
    <section>
      <form
        className="guess-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <input
          className="guess-input"
          value={value}
          type="text"
          autoComplete="off"
          inputMode="text"
          placeholder="Введите слово"
          maxLength={INPUT_MAX_LENGTH}
          disabled={disabled}
          onChange={(event) => onChange(sanitizeInput(event.target.value))}
        />
        <button className="primary-button" type="submit" disabled={disabled}>
          Проверить
        </button>
      </form>
      {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
    </section>
  );
}
