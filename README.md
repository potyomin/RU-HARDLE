# Countle / Word Countle

Русская логическая игра на 5 букв с механикой подсчёта совпадений:
- `🟩` сколько букв стоят на верных местах
- `🟨` сколько букв есть в слове, но стоят не там

Буквы не подсвечиваются по позициям, показываются только итоговые количества.

## Стек

- React
- TypeScript
- Vite
- CSS
- локальный словарь в JSON

## Быстрый старт

1. Установите зависимости:
   ```bash
   npm install
   ```
2. Положите исходный словарь в `src/Data/raw/` (поддерживаются `.txt` и `.js`).
3. Подготовьте очищенный словарь:
   ```bash
   npm run prepare:words
   ```
4. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
5. Соберите прод-версию:
   ```bash
   npm run build
   ```

## Подготовка словаря

Скрипт `scripts/prepareWords.mjs`:
- читает файл из `src/Data/raw/`
- приводит слова к верхнему регистру
- заменяет `Ё` на `Е`
- удаляет пустые строки и дубликаты
- оставляет только русские слова из 5 букв (`А-Я`)
- сортирует и сохраняет результат в `src/Data/words.generated.json`

Команда:

```bash
npm run prepare:words
```

## GitHub Pages

`vite.config.ts` содержит переменную:

```ts
const repositoryName = "countle-game";
```

Поменяйте её на имя вашего репозитория. Для `countle-game` базовый путь будет `/countle-game/`.

### Включение Pages

1. Откройте `Settings` репозитория.
2. Перейдите в `Pages`.
3. В `Source` выберите `GitHub Actions`.

Workflow находится в `.github/workflows/deploy.yml` и на каждом push в `main`:
- ставит Node.js
- устанавливает зависимости
- выполняет `npm run build`
- публикует `dist` в GitHub Pages

