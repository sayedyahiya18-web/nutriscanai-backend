const SUGAR_VARIANTS = [
  'sugar', 'glucose', 'fructose', 'sucrose', 'maltose', 'dextrose', 'corn syrup', 
  'high fructose corn syrup', 'agave nectar', 'maple syrup', 'honey', 
  'cane juice', 'maltodextrin', 'isoglucose'
];

const ADDITIVE_PATTERN = /E[0-9]{3,4}[a-z]?/i; // E-numbers like E102, E211

/**
 * Calculates a health score based on nutriments and ingredients.
 * @param {Object} product - Open Food Facts product data.
 * @param {Object} profile - User health profile (diabetes, weight_loss, fitness).
 * @returns {Object} - { score, risks, insights }
 */
function calculateScore(product, profile = {}) {
  const nutriments = product.nutriments || {};
  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  
  let score = 100;
  let risks = [];
  let insights = [];

  // 1. Sugar Analysis
  const sugarG = nutriments.sugars_100g || 0;
  let sugarPenalty = 0;
  
  if (sugarG > 15) {
    sugarPenalty = 25;
    if (profile.diabetes) sugarPenalty *= 1.5; // Stricter for diabetes
    risks.push({ level: 'danger', message: 'High sugar content' });
  } else if (sugarG > 5) {
    sugarPenalty = 10;
  }
  score -= sugarPenalty;

  // Detect hidden sugars in text
  const foundSugars = SUGAR_VARIANTS.filter(s => ingredientsText.includes(s));
  if (foundSugars.length > 3) {
    score -= 10;
    risks.push({ level: 'warning', message: 'Multiple hidden sugar variants detected' });
  }

  // 2. Saturated Fat
  const satFatG = nutriments['saturated-fat_100g'] || 0;
  if (satFatG > 5) {
    score -= 15;
    risks.push({ level: 'warning', message: 'High saturated fat' });
  }

  // 3. Sodium / Salt
  const saltG = nutriments.salt_100g || 0;
  if (saltG > 1.5) {
    score -= 15;
    risks.push({ level: 'warning', message: 'High sodium content' });
  }

  // 4. Additives (E-numbers)
  const additives = product.additives_tags || [];
  if (additives.length > 0) {
    const additivePenalty = additives.length * 10;
    score -= Math.min(additivePenalty, 30); // Cap at 30
    risks.push({ level: 'warning', message: `${additives.length} additives detected` });
  }

  // 5. Positive factors
  const proteinG = nutriments.proteins_100g || 0;
  if (proteinG > 10) {
    let proteinBonus = 10;
    if (profile.fitness) proteinBonus = 15;
    score += proteinBonus;
    insights.push('Excellent source of protein');
  }

  const fiberG = nutriments.fiber_100g || 0;
  if (fiberG > 3) {
    score += 5;
    insights.push('Good source of dietary fiber');
  }

  // 6. Profile specific logic
  if (profile.weight_loss) {
    const calories = nutriments['energy-kcal_100g'] || 0;
    if (calories > 250) {
      score -= 15;
      risks.push({ level: 'warning', message: 'High calorie density for weight loss' });
    }
  }

  // Final clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    risks,
    insights,
    data: {
      sugar: sugarG,
      fat: satFatG,
      protein: proteinG,
      calories: nutriments['energy-kcal_100g'] || 0
    }
  };
}

module.exports = { calculateScore };
