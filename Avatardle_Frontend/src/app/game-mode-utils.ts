export function getSurrenderText(isComplete: boolean, guessAttempts: number, requiredAttempts: number): string {

    let diff = requiredAttempts - guessAttempts;
    if (diff <= 0 || isComplete) {
        return 'Reveal answer';
    }
    return diff === 1 ? 'Reveal answer in 1 more guess' : `Reveal answer in ${diff} more guesses`;
}

export function isSurrenderDisabled(isComplete: boolean, guessAttempts: number, requiredAttempts: number): boolean {
    return isComplete || guessAttempts < requiredAttempts;
}

export function getHintTooltip(isComplete: boolean, guessAttempts: number, requiredAttempts: number, hintId: number) {

    const diff = hintId + requiredAttempts - guessAttempts;
    if (diff <= 0 || isComplete) {
        return 'Hint available!';
    }
    return diff === 1 ? 'Hint in 1 more guess' : `Hint in ${diff} more guesses`;
}


// function onModeComplete(): void{

//     this.isComplete.set(true);
//     this.ls.patch(['classic', 'complete'], true);
//     this.ds.throwConfetti(this.ls.progress().classic.guesses.length);
//     this.ds.updateStats("classic");

// }