require("dotenv").config();
const { OpenAI } = require("openai");

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("No API key found in .env");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

async function check() {
  try {
    console.log("Testing OpenAI API...");
    const response = await openai.models.list();
    console.log("SUCCESS: OpenAI API is responsive. Quota is likely restored.");
    console.log("Models found:", response.data.length);
  } catch (err) {
    console.error("FAILURE: OpenAI API error:");
    console.error(err.message);
    if (err.message.includes("429")) {
        console.error("Quota still exceeded.");
    }
  }
}

check();
