// backend/list-models.js
const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

axios.get(url)
  .then(response => {
    console.log('📋 Modèles disponibles :');
    response.data.models.forEach(model => {
      console.log(`- ${model.name} (displayName: ${model.displayName})`);
      console.log(`  support generateContent: ${model.supportedGenerationMethods?.includes('generateContent')}`);
    });
  })
  .catch(error => {
    console.error('❌ Erreur:', error.response?.data || error.message);
  });