declare module "@nlpjs/nlp" {
  export class NlpManager {
    constructor(options?: any);
    addDocument(language: string, utterance: string, intent: string): void;
    addAnswer(language: string, intent: string, answer: string): void;
    train(): Promise<void>;
    process(language: string, text: string): Promise<any>;
    save?(fileName?: string): Promise<void>; // optional save method
  }
}
