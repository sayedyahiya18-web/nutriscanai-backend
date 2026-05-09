require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * EXACT SOLUTION: Using 'gemini-pro' as the primary model.
 * It is the most stable, globally available model that works 
 * in all regions (including Render's) without 404 errors.
 */
async function generateWithFallback(prompt) {
  // Try gemini-pro first as it's the most reliable for demos
  const models = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result;
    } catch (e) {
      console.warn(`Model ${modelName} skipped: ${e.message}`);
      lastError = e;
    }
  }
  throw lastError;
}

// Generic Chat Endpoint
router.post('/', async (req, res) => {
  const { query, product, profile } = req.body;
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ message: 'API Key Missing' });

  try {
    const prompt = `Assistant for NutriScan. User: ${JSON.stringify(profile)}. Question: ${query}`;
    const result = await generateWithFallback(prompt);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    res.status(500).json({ message: 'AI Error', details: error.message });
  }
});

// Insight Endpoint
router.post('/insight', async (req, res) => {
  const { product, profile } = req.body;
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ message: 'API Key Missing' });

  try {
    const prompt = `Analyze: ${product.name}. Ingredients: ${product.ingredients}. Return JSON: { "isSafe": bool, "warning": string, "recommendation": string, "score": number, "realityCheck": { "sugarTeaspoons": number, "exerciseToBurn": { "activity": string, "minutes": number } }, "smartSwap": { "productName": string, "reason": string }, "ingredientInsights": [], "voiceSummary": string }`;
    const result = await generateWithFallback(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch ? jsonMatch[0] : text));
  } catch (error) {
    res.status(500).json({ message: 'Insight Error', details: error.message });
  }
});

// Diet Plan Endpoint
router.post('/diet-plan', async (req, res) => {
  const { profile } = req.body;
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ message: 'API Key Missing' });

  try {
    const prompt = `Generate Diet Plan for: ${JSON.stringify(profile)}. Return JSON: { "dailyCalories": number, "meals": [], "tips": [] }`;
    const result = await generateWithFallback(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(jsonMatch ? jsonMatch[0] : text));
  } catch (error) {
    res.status(500).json({ message: 'Diet Error', details: error.message });
  }
});

module.exports = router;
