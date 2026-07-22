// backend/src/services/spacedRepetition.js
// Algorithme SM-2 (SuperMemo 2) pour la répétition espacée

/**
 * Calcule la prochaine révision selon l'algorithme SM-2
 * @param {Object} current - État actuel de la carte { ease_factor, interval_days, repetitions }
 * @param {number} quality - Qualité de la réponse (0-5)
 *   0 = Total blackout (ne se souvient pas du tout)
 *   1 = Mauvais (se souvient avec beaucoup de difficultés)
 *   2 = Difficile (se souvient avec hésitation)
 *   3 = Bon (se souvient avec effort)
 *   4 = facile (se souvient facilement)
 *   5 = Très facile (réponse immédiate)
 * @returns {Object} { ease_factor, interval_days, repetitions, next_review }
 */
function calculateNextReview(current, quality) {
  let { ease_factor = 2.50, interval_days = 0, repetitions = 0 } = current;

  if (quality >= 3) {
    // Bonne réponse → augmenter l'intervalle
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions++;
  } else {
    // Mauvaise réponse → reset complet
    repetitions = 0;
    interval_days = 1;
  }

  // Ajuster le facteur de facilité (EF)
  // Formule SM-2 : EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.30) ease_factor = 1.30;

  // Calculer la date de prochaine révision
  const next_review = new Date();
  next_review.setDate(next_review.getDate() + interval_days);

  return {
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval_days,
    repetitions,
    next_review: next_review.toISOString().split('T')[0], // YYYY-MM-DD
  };
}

/**
 * Crée la première entrée de révision pour une nouvelle carte
 * @param {number} quality - Qualité de la première réponse
 * @returns {Object} { ease_factor, interval_days, repetitions, next_review }
 */
function getInitialReview(quality) {
  return calculateNextReview({
    ease_factor: 2.50,
    interval_days: 0,
    repetitions: 0,
  }, quality);
}

module.exports = { calculateNextReview, getInitialReview };
