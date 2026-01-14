import OpenAI from "openai";
import { Client } from "pg";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embedTask(task) {
  const text = `
ID: ${task.id}
Title: ${task.title}
Content: ${JSON.stringify(task.i18nContent)}
TaskType: ${task.taskType}
  `;

  const response = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: text,
  });

  return response.data[0].embedding;
}

const pg = new Client({
  connectionString: process.env.DATABASE_URL,
});
await pg.connect();
