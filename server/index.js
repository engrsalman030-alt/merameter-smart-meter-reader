import dotenv from 'dotenv';
dotenv.config();
console.log("API_KEY:", process.env.API_KEY);

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' })); // accept big images

const ai = new GoogleGenerativeAI(process.env.API_KEY);

app.post('/api/analyze', async (req, res) => {
  try {
    const { base64Image, knownSerialNumbers = [] } = req.body;
    if (!base64Image) return res.status(400).json({ error: "No image provided" });

    // Determine MIME type automatically from base64 string
    let mimeType = "image/jpeg";
    if (base64Image.startsWith("data:image/png")) mimeType = "image/png";
    if (base64Image.startsWith("data:image/gif")) mimeType = "image/gif";

    // Strip the "data:image/...;base64," prefix if present
    const rawData = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

    const knownSerialsText = knownSerialNumbers.length > 0
      ? `\nHere is a list of known valid serial numbers for existing meters: ${knownSerialNumbers.join(', ')}. If you see a serial number that closely matches one of these, STRONGLY prefer outputting the exact matching known serial number.`
      : '';

    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `You are an expert utility meter inspector in Pakistan.
Extract: 1. Serial number. 2. Current reading(kWh). 3. Consumed units.
JSON keys: "serialNumber", "readingValue", "consumedUnits", "confidence", "explanation".
${knownSerialsText}`;

    const result = await model.generateContent([
      { inlineData: { mimeType, data: rawData } },
      { text: prompt }
    ]);

    const resultResponse = await result.response;
    let text = resultResponse.text().trim();
    if (text.startsWith("```")) {
      const match = text.match(/```(?:json)?\s*([\s\S]+?)```/i);
      if (match) text = match[1];
    }

    const parsedResult = JSON.parse(text);
    res.json(parsedResult);

  } catch (err) {
    console.error("Server AI Error:", err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
