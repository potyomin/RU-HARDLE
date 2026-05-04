export type Attempt = {
  word: string;
  green: number;
  yellow: number;
};

type AttemptRowProps = {
  attempt: Attempt;
  index: number;
};

export default function AttemptRow({ attempt, index }: AttemptRowProps) {
  return (
    <li className="attempt-row">
      <span className="attempt-index">#{index + 1}</span>
      <strong className="attempt-word">{attempt.word}</strong>
      <span className="count-green">🟩 зелёных: {attempt.green}</span>
      <span className="count-yellow">🟨 жёлтых: {attempt.yellow}</span>
    </li>
  );
}

