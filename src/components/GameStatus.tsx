type Status = "playing" | "won" | "lost";

type GameStatusProps = {
  status: Status;
  answer: string;
  attemptsUsed: number;
  maxAttempts: number;
};

export default function GameStatus({ status, answer, attemptsUsed, maxAttempts }: GameStatusProps) {
  if (status === "won") {
    return <p className="status status-win">Победа! Слово разгадано за {attemptsUsed} попыток.</p>;
  }

  if (status === "lost") {
    return (
      <p className="status status-lose">
        Попытки закончились. Загаданное слово: <strong>{answer}</strong>
      </p>
    );
  }

  return <p className="status status-playing">Осталось попыток: {maxAttempts - attemptsUsed}</p>;
}

