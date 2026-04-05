const { NlpManager } = require("node-nlp");
const path = require("path");
const fs = require("fs");

const modelPath = path.join(__dirname, "../nlp-model.nlp");
const manager = new NlpManager({ languages: ["en"], forceNER: true });

async function trainNlp() {
  if (fs.existsSync(modelPath)) {
    await manager.load(modelPath);
    console.log(" NLP model loaded");
    return;
  }

  manager.addDocument("en", "I want to eat", "eat");
  manager.addDocument("en", "I am hungry", "eat");
  manager.addDocument("en", "Find food", "eat");
  manager.addDocument("en", "Where to eat", "eat");

  manager.addDocument("en", "I want to relax", "park");
  manager.addDocument("en", "I want to sightsee", "park");
  manager.addDocument("en", "I want to take a walk", "park");
  manager.addDocument("en", "Show me nature", "park");

  await manager.train();
  await manager.save(modelPath);

  console.log(" NLP model trained & saved");
}

trainNlp();

export async function detectIntent(text: string): Promise<string[]> {
  const lower = text.toLowerCase();

  // Define keyword groups with their intent labels
  const patterns = [
    { intent: "eat", words: ["eat", "food", "hungry", "lunch", "dinner", "meal"] },
    { intent: "park", words: ["relax", "park", "nature", "chill", "walk", "sightsee"] }
  ];

  const found: { intent: string; index: number }[] = [];

  // Check each keyword and store their position in text
  for (const p of patterns) {
    for (const w of p.words) {
      const idx = lower.indexOf(w);
      if (idx !== -1) {
        found.push({ intent: p.intent, index: idx });
        break; // stop once we match one word for this intent
      }
    }
  }

  // Sort by appearance in text
  found.sort((a, b) => a.index - b.index);

  // Return unique intents in order
  return [...new Set(found.map(f => f.intent))];
}

