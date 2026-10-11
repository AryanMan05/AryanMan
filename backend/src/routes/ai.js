const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const MEDICAL_SAFEGUARD = `You are Care AI, a medical wellness assistant integrated into the Care Connect health platform.

STRICT RULES YOU MUST NEVER VIOLATE:
1. NEVER diagnose medical conditions definitively
2. NEVER prescribe specific prescription medications
3. ALWAYS recommend consulting licensed healthcare professionals for any medical decisions
4. Always include a disclaimer that you are an AI assistant, not a doctor
5. Provide evidence-based, medically accurate general health information
6. For any life-threatening symptoms, immediately direct to emergency services (112/108)

You can:
- Explain medical concepts, symptoms, and conditions in simple language
- Provide general wellness and lifestyle advice
- Help users understand their health data in educational terms
- Guide users on when to seek medical attention`;

const FALLBACK_RESPONSES = {
  hydration: "Staying hydrated is essential for health. General recommendation is 8 glasses (2L) per day, but your needs vary based on activity level, climate, and body size. Listen to your body and drink when thirsty.",
  sleep: "Quality sleep (7-9 hours for adults) is crucial for physical and mental health. Maintain consistent sleep schedules, avoid screens before bed, and create a cool, dark sleep environment.",
  blood_pressure: "Blood pressure readings below 120/80 mmHg are considered normal by the AHA. Regular monitoring, reducing sodium, regular exercise, and stress management help maintain healthy BP.",
  diabetes: "Managing blood sugar involves balanced diet (low glycemic index foods), regular physical activity, monitoring, and medication adherence. Always follow your doctor's personalized treatment plan.",
  default: "I'm Care AI, your health wellness assistant. I can provide general health education and wellness guidance. For medical diagnosis or treatment, always consult your healthcare provider."
};

function getFallbackResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('water') || lower.includes('hydrat')) return FALLBACK_RESPONSES.hydration;
  if (lower.includes('sleep')) return FALLBACK_RESPONSES.sleep;
  if (lower.includes('blood pressure') || lower.includes('hypertension')) return FALLBACK_RESPONSES.blood_pressure;
  if (lower.includes('diabetes') || lower.includes('glucose') || lower.includes('sugar')) return FALLBACK_RESPONSES.diabetes;
  return FALLBACK_RESPONSES.default;
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { message, includeHealthContext = false } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  let contextPrefix = '';
  if (includeHealthContext) {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    const latestBP = db.prepare('SELECT systolic, diastolic, category FROM blood_pressure_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1').get(req.user.id);
    const latestGlucose = db.prepare('SELECT reading, reading_type FROM glucose_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1').get(req.user.id);
    const activeMeds = db.prepare('SELECT name, dosage FROM medications WHERE user_id = ? AND is_active = 1 LIMIT 5').all(req.user.id);

    if (profile) {
      const w = profile.weight;
      const h = profile.height;
      const bmi = (w && h) ? (w / Math.pow(h / 100, 2)).toFixed(1) : null;
      contextPrefix = `\n\n[USER HEALTH CONTEXT - For reference only]
Age: ${profile.age || 'Not set'} | Gender: ${profile.gender || 'Not set'} | BMI: ${bmi || 'Not calculated'}
Blood Pressure: ${latestBP ? `${latestBP.systolic}/${latestBP.diastolic} (${latestBP.category})` : 'No data'}
Blood Glucose: ${latestGlucose ? `${latestGlucose.reading} mg/dL (${latestGlucose.reading_type})` : 'No data'}
Active Medications: ${activeMeds.length > 0 ? activeMeds.map(m => `${m.name} ${m.dosage || ''}`).join(', ') : 'None'}
[END CONTEXT]\n`;
    }
  }

  // Store user message
  db.prepare('INSERT INTO ai_conversations (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'user', message);

  let reply;

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      const { GoogleGenerativeAI } = require('@google/genai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Get recent conversation history (last 10 messages)
      const history = db.prepare(
        'SELECT role, content FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
      ).all(req.user.id).reverse();

      const chat = model.startChat({
        history: history.slice(0, -1).map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        systemInstruction: MEDICAL_SAFEGUARD
      });

      const result = await chat.sendMessage(contextPrefix + message);
      reply = result.response.text();
    } catch (err) {
      console.error('Gemini AI error:', err.message);
      reply = getFallbackResponse(message) + '\n\n*Note: AI service temporarily unavailable. This is a pre-configured response.*';
    }
  } else {
    reply = getFallbackResponse(message) + '\n\n*Note: Configure GEMINI_API_KEY for intelligent AI responses.*\n\n⚕️ **Disclaimer:** I am Care AI, a health awareness assistant. I am not a doctor. Always consult licensed healthcare professionals for medical decisions.';
  }

  // Store assistant reply
  db.prepare('INSERT INTO ai_conversations (user_id, role, content) VALUES (?, ?, ?)').run(req.user.id, 'assistant', reply);

  return res.json({ reply, model: process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : 'fallback' });
});

// GET /api/ai/history
router.get('/history', (req, res) => {
  const history = db.prepare(
    'SELECT id, role, content, created_at FROM ai_conversations WHERE user_id = ? ORDER BY created_at ASC LIMIT 50'
  ).all(req.user.id);
  return res.json(history);
});

// DELETE /api/ai/history — clear conversation
router.delete('/history', (req, res) => {
  db.prepare('DELETE FROM ai_conversations WHERE user_id = ?').run(req.user.id);
  return res.json({ message: 'Conversation cleared' });
});

module.exports = router;
