const express = require('express');
const axios = require('axios');
const router = express.Router();
const { calculateScore } = require('../utils/scoring');

// GET /api/product/:barcode
router.get('/:barcode', async (req, res) => {
  const { barcode } = req.params;
  const { profile } = req.query; // profile as JSON string
  
  try {
    const userProfile = profile ? JSON.parse(profile) : {};
    
    // Fetch data from Open Food Facts
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      headers: {
        'User-Agent': 'NutriScanAI - Web - Version 1.0'
      }
    });

    if (response.data.status === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = response.data.product;
    const analysis = calculateScore(product, userProfile);

    res.json({
      product_name: product.product_name || 'Unknown Product',
      brand: product.brands,
      image: product.image_front_url,
      ingredients: product.ingredients_text,
      nutriments: product.nutriments,
      analysis: analysis
    });
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
