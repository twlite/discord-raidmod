export function isNewUser(joined: number, created: number, byCreation: number, byJoin: number) {
    const ageByCreation = Date.now() - byCreation;
    const ageByJoin = Date.now() - byJoin;

    return created > ageByCreation && joined > ageByJoin;
}
