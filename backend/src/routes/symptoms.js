const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Emergency symptom keywords (red-flag detection)
const RED_FLAG_SYMPTOMS = [
  'chest pain', 'crushing chest', 'heart attack', 'difficulty breathing', 'can\'t breathe',
  'shortness of breath', 'slurred speech', 'sudden numbness', 'sudden weakness', 'facial drooping',
  'uncontrolled bleeding', 'coughing blood', 'vomiting blood', 'severe allergic reaction',
  'anaphylaxis', 'loss of consciousness', 'unconscious', 'seizure', 'stroke', 'paralysis',
  'severe abdominal pain', 'sudden vision loss', 'suicidal thoughts', 'overdose'
];

function detectEmergency(symptoms) {
  const lowerSymptoms = symptoms.toLowerCase();
  return RED_FLAG_SYMPTOMS.some(flag => lowerSymptoms.includes(flag));
}

function generateFallbackResult(symptoms, duration, severity) {
  const isEmergency = detectEmergency(symptoms);

  if (isEmergency) {
    return {
      isEmergency: true,
      emergencyBanner: '🚨 EMERGENCY: One or more of your symptoms may indicate a life-threatening condition. Call 112 or 108 immediately!',
      differentialConsiderations: ['Potential medical emergency requiring immediate assessment'],
      selfCare: ['Do NOT attempt self-treatment', 'Call emergency services immediately', 'Stay calm and do not eat or drink anything'],
      doctorQuestions: ['What is the exact onset and character of the symptoms?'],
      disclaimer: 'This is NOT a medical diagnosis. This tool is for awareness only. Seek immediate professional medical care.'
    };
  }

  return {
    isEmergency: false,
    differentialConsiderations: [
      'Common viral or bacterial infection',
      'Stress or anxiety-related symptoms',
      'Nutritional deficiency',
      'Musculoskeletal strain'
    ],
    selfCare: [
      'Rest adequately and stay hydrated',
      'Monitor symptoms for changes',
      'Avoid strenuous activities',
      'Maintain a balanced diet'
    ],
    doctorQuestions: [
      'When did these symptoms first appear?',
      'Are symptoms constant or intermittent?',
      'What makes symptoms better or worse?',
      'Do you have any known allergies or medical conditions?'
    ],
    disclaimer: 'This symptom analysis is for educational awareness only and does NOT constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.'
  };
}

// POST /api/symptoms/check
router.post('/check', async (req, res) => {
  const { symptoms, duration, severity } = req.body;
  if (!symptoms) return res.status(400).json({ error: 'Symptoms are required' });

  let result;
  const isEmergency = detectEmergency(symptoms);

  // Try Gemini AI if available
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      const { GoogleGenerativeAI } = require('@google/genai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are a medical awareness assistant (NOT a doctor). A user reports these symptoms:
Symptoms: ${symptoms}
Duration: ${duration || 'Not specified'}
Severity: ${severity || 'Not specified'}

Provide a structured JSON response with these exact keys:
{
  "isEmergency": boolean,
  "emergencyBanner": "string or null",
  "differentialConsiderations": ["array", "of", "possible conditions"],
  "selfCare": ["array", "of", "self care tips"],
  "doctorQuestions": ["array", "of", "questions to ask doctor"],
  "disclaimer": "IMPORTANT medical disclaimer string"
}

RULES:
- Never diagnose conditions definitively
- Always include disclaimer
- If ANY red-flag symptoms (chest pain, stroke signs, severe breathing difficulty), set isEmergency=true
- Keep response professional and medically accurate
- Respond ONLY with valid JSON`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = generateFallbackResult(symptoms, duration, severity);
      }
    } catch (err) {
      console.error('Gemini API error:', err.message);
      result = generateFallbackResult(symptoms, duration, severity);
    }
  } else {
    result = generateFallbackResult(symptoms, duration, severity);
  }

  // Save to DB
  db.prepare(
    'INSERT INTO symptom_checks (user_id, symptoms, duration, severity, result, is_emergency) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, symptoms, duration || null, severity || null, JSON.stringify(result), isEmergency ? 1 : 0);

  return res.json(result);
});

// GET /api/symptoms/history
router.get('/history', (req, res) => {
  const history = db.prepare(
    'SELECT id, symptoms, duration, severity, is_emergency, checked_at FROM symptom_checks WHERE user_id = ? ORDER BY checked_at DESC LIMIT 20'
  ).all(req.user.id);
  return res.json(history);
});

module.exports = router;
