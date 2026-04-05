export interface VerificationCode {
  codeId: number;
  codeValue: string;
  expiryTime: Date;
  status: string; // e.g. "ACTIVE", "USED", "EXPIRED"
}
