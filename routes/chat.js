const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/', async (req, res) => {
  const { query, product, profile } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: 'Gemini API key not configured' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are NutriScan AI assistant. Your goal is to provide simple, actionable health advice based on food products.
      
      User Profile: ${JSON.stringify(profile)}
      Product: ${product.product_name}
      Ingredients: ${product.ingredients}
      Nutrition (per 100g): ${JSON.stringify(product.nutriments)}
      
      User Question: ${query}
      
      Keep the response concise, friendly, and focused on the user's specific health goals if provided.
      Avoid medical jargon. Use bullet points for clarity.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'AI failed to respond', error: error.message });
  }
});

module.exports = router;
