import bcrypt from "bcrypt";
const ROUNDS = 10;
export const hashPassword = (pw: string) => bcrypt.hash(pw, ROUNDS);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
