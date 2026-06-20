
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: "Hello",
    });
    console.log("Success:", response.text);
  } catch (err) {
    console.error("Error encountered:", err);
  }
}

test();
