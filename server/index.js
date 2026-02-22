import dotenv from 'dotenv';
dotenv.config();
console.log("API_KEY:", process.env.API_KEY);

import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' })); // accept big images

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // valid model
      contents: [
        {
          inlineData: {
            mimeType,
            data: rawData
          }
        },
        {
          text: `You are an expert utility meter inspector in Pakistan.
Extract the following information from the meter photo carefully:
1. Meter serial number (often near a barcode or labeled "Sr No.", "No.", etc.)${knownSerialsText}
2. Current cumulative reading in kWh (often the largest number, ignore decimals if hard to read, look for "kWh")
3. Current month consumed units (if clearly visible and separated from the main reading)

Return ONLY valid JSON. If you are very confident about the serial number but less so about the reading, still return high confidence for the serial number.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            serialNumber: { type: Type.STRING },
            readingValue: { type: Type.NUMBER },
            consumedUnits: { type: Type.NUMBER, nullable: true },
            confidence: { type: Type.NUMBER },
            explanation: { type: Type.STRING }
          },
          required: ["serialNumber", "readingValue", "confidence"]
        }
      }
    });

    // Sometimes the AI wraps JSON in markdown, so strip ```json ... ```
    let text = response.text.trim();
    if (text.startsWith("```")) {
      const match = text.match(/```(?:json)?\s*([\s\S]+?)```/i);
      if (match) text = match[1];
    }

    const result = JSON.parse(text);
    res.json(result);

  } catch (err) {
    console.error("Server AI Error:", err);
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
