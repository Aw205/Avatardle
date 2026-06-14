# Contributing to Avatardle

Thanks for wanting to help with Avatardle. This project is a daily guessing game for Avatar: The Last Airbender and The Legend of Korra, and contributions are welcome for bug fixes, UI improvements, game content, translations, accessibility, performance, and developer tooling.

This guide explains how to get set up and how to send changes in a way that is easy to review.

## Project structure

```text
Avatardle/
  Avatardle_Frontend/   Angular app
  Avatardle_Backend/    Express backend
  assets/               Repository images used by docs
```

## Before you start

If you are planning a larger change, open an issue first so we can discuss the approach. Small bug fixes, typo fixes, content corrections, and translation improvements can usually go straight to a pull request.

Good first contributions include:

- Fixing bugs with clear reproduction steps
- Improving mobile layout or accessibility
- Correcting character, quote, episode, or music data
- Adding or improving translations
- Improving documentation
- Adding focused tests or developer tooling

## Local setup

You will need:

- Git
- Node.js matching the frontend version in `Avatardle_Frontend/.nvmrc`
- npm

Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/Avatardle.git
cd Avatardle
```

Install frontend dependencies:

```bash
cd Avatardle_Frontend
npm ci
```

Install backend dependencies:

```bash
cd ../Avatardle_Backend
npm ci
```

## Running the app locally

Start the frontend:

```bash
cd Avatardle_Frontend
npm start
```

This runs the Angular development server.

The backend is an Express app in `Avatardle_Backend`. If your change requires backend work, check whether the feature you are touching needs environment variables, database access, or production-only services before assuming it will run locally with no configuration.

## Useful commands

Frontend:

```bash
cd Avatardle_Frontend
npm start
npm run build
npm test
```

Backend:

```bash
cd Avatardle_Backend
npm ci
```

Note: the backend does not currently have a working test script. Do not treat `npm test` in `Avatardle_Backend` as a required verification step unless that changes in a future PR.

## Branches and commits

Create a new branch for your work:

```bash
git checkout -b feature/short-description
```

Use a short, descriptive branch name, for example:

- `fix/profile-dialog-layout`
- `feature/spanish-translation-updates`
- `docs/contributing-guide`
- `content/add-character-correction`

Keep commits focused. It is fine to make multiple commits while working, but please avoid mixing unrelated changes in the same pull request.

## Pull request checklist

Before opening a pull request:

- Rebase or merge the latest `main` into your branch.
- Run the relevant install/build/test commands for the files you changed.
- Check the app manually if your change affects UI or gameplay.
- Include screenshots or a short screen recording for visual changes.
- Mention any commands you ran in the PR description.
- Link the related issue, if there is one.

For frontend changes, please run:

```bash
cd Avatardle_Frontend
npm run build
```

For backend dependency or server changes, please run:

```bash
cd Avatardle_Backend
npm ci
```

## Content and data changes

Game data lives mostly in `Avatardle_Frontend/src/assets/json/`.

When changing content:

- Keep JSON valid and consistently formatted.
- Make the smallest change needed to fix the issue.
- Explain the source or reasoning for the correction in your PR.
- Check for references in related files before renaming IDs, character names, episode names, or asset filenames.

When adding or changing images or other media:

- Keep file sizes reasonable.
- Use existing naming patterns.
- Do not add copyrighted material unless it is already appropriate for this project and the maintainer has agreed to include it.

## Translation changes

Translation files live in `Avatardle_Frontend/src/assets/json/i18n/`.

When editing translations:

- Keep translation keys in sync with `en.json`.
- Do not remove keys unless the app no longer uses them.
- Preserve placeholders, punctuation, and formatting where they are meaningful.
- If you are unsure about a translation, mention that in the PR.

## Code style

Try to match the style of the file you are editing. Prefer small, readable changes over broad rewrites.

For frontend code:

- Follow the existing Angular patterns.
- Keep components focused.
- Avoid unrelated formatting churn.
- Check responsive behavior for UI changes.

For backend code:

- Keep route behavior clear and predictable.
- Validate user input where relevant.
- Avoid committing secrets, tokens, database files, or local configuration.

## Reporting bugs

When opening a bug report, include:

- What happened
- What you expected to happen
- Steps to reproduce
- Browser and device, if relevant
- Screenshots or console errors, if helpful

## Feature requests

Feature ideas are welcome. Please include:

- The problem or user need
- A short description of the proposed behavior
- Any alternatives you considered
- Mockups or examples, if relevant

## Review process

Pull requests are reviewed for correctness, maintainability, user experience, and project fit. A maintainer may ask for changes before merging. That is normal and does not mean the contribution is not appreciated.

Thanks again for helping make Avatardle better.
