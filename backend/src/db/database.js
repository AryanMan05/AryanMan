const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'care_connect.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db;

// Try better-sqlite3 first (requires native build), fall back to node-sqlite3-wasm
function loadDb() {
  try {
    const Database = require('better-sqlite3');
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    console.log('✅ Using better-sqlite3 (native)');
    return db;
  } catch (e) {
    console.warn('⚠️  better-sqlite3 not available, using node-sqlite3-wasm (pure JS SQLite)');
    const { DatabaseSync } = require('node:sqlite');
    // Node.js 22.5+ has built-in SQLite!
    try {
      db = new DatabaseSync(DB_PATH);
      db.exec('PRAGMA journal_mode = WAL');
      db.exec('PRAGMA foreign_keys = ON');

      // Shim to match better-sqlite3's API
      const origPrepare = db.prepare.bind(db);
      db.prepare = (sql) => {
        const stmt = origPrepare(sql);
        return {
          run: (...params) => stmt.run(...params),
          get: (...params) => stmt.get(...params),
          all: (...params) => stmt.all(...params),
        };
      };
      console.log('✅ Using Node.js built-in SQLite');
      return db;
    } catch (e2) {
      // Last resort: node-sqlite3-wasm
      const SQLite = require('node-sqlite3-wasm').default;
      const sqlite = new SQLite();
      const wasm_db = sqlite.open(DB_PATH);
      console.log('✅ Using node-sqlite3-wasm (WebAssembly SQLite)');
      return wasm_db;
    }
  }
}

db = loadDb();

// Wrap exec for WAL pragma
function execSQL(sql) {
  try {
    if (typeof db.exec === 'function') {
      db.exec(sql);
    } else {
      // Split by ; and run each statement
      sql.split(';').forEach(stmt => {
        const s = stmt.trim();
        if (s) db.prepare(s).run();
      });
    }
  } catch (e) {
    // Ignore "table already exists" errors
    if (!e.message.includes('already exists')) {
      throw e;
    }
  }
}

function initializeDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      age INTEGER,
      gender TEXT,
      date_of_birth TEXT,
      height REAL,
      weight REAL,
      blood_group TEXT,
      activity_level TEXT DEFAULT 'sedentary',
      water_goal_glasses INTEGER DEFAULT 8,
      step_goal INTEGER DEFAULT 10000,
      sleep_goal_hours REAL DEFAULT 8.0,
      allergies TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      glasses INTEGER NOT NULL DEFAULT 1,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weight_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      notes TEXT,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sleep_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bedtime TEXT NOT NULL,
      wake_time TEXT NOT NULL,
      duration_hours REAL,
      quality TEXT DEFAULT 'Normal',
      notes TEXT,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exercise_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      calories_burned INTEGER,
      intensity TEXT DEFAULT 'Moderate',
      notes TEXT,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS step_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      steps INTEGER NOT NULL,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blood_pressure_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      systolic INTEGER NOT NULL,
      diastolic INTEGER NOT NULL,
      pulse INTEGER,
      category TEXT,
      notes TEXT,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS glucose_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reading REAL NOT NULL,
      reading_type TEXT DEFAULT 'Fasting',
      notes TEXT,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS heart_rate_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bpm INTEGER NOT NULL,
      reading_type TEXT DEFAULT 'Resting',
      notes TEXT,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT,
      frequency TEXT,
      reminder_time TEXT,
      instructions TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medication_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS health_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL DEFAULT 0,
      unit TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS symptom_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symptoms TEXT NOT NULL,
      duration TEXT,
      severity TEXT,
      result TEXT,
      is_emergency INTEGER DEFAULT 0,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      overview TEXT,
      symptoms TEXT,
      causes TEXT,
      risk_factors TEXT,
      treatments TEXT,
      prevention TEXT,
      when_to_seek_help TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS health_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_data TEXT NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Execute each statement individually to handle errors gracefully
  schema.split(';').forEach(stmt => {
    const s = stmt.trim();
    if (s && s.toUpperCase().startsWith('CREATE')) {
      try {
        db.prepare(s).run();
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.error('Schema error:', e.message, '\nSQL:', s.substring(0, 100));
        }
      }
    }
  });

  // Seed admin user
  try {
    const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hash = bcrypt.hashSync('Admin@123', 10);
      const result = db.prepare("INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'admin')").run('admin@careconnect.app', hash, 'System Administrator');
      db.prepare("INSERT INTO profiles (user_id) VALUES (?)").run(result.lastInsertRowid);
      console.log('✅ Admin user seeded: admin@careconnect.app / Admin@123');
    }
  } catch (e) {
    console.error('Admin seed error:', e.message);
  }

  // Seed conditions
  try {
    const count = db.prepare("SELECT COUNT(*) as cnt FROM conditions").get();
    if (count.cnt === 0) {
      seedConditions();
    }
  } catch (e) {
    console.error('Conditions seed error:', e.message);
  }

  console.log('✅ Database initialized at:', DB_PATH);
}

function seedConditions() {
  const conditions = [
    { name: 'Hypertension (High Blood Pressure)', category: 'Cardiology', overview: 'A chronic condition where blood pressure in the arteries is persistently elevated. Often called the "silent killer" as it may have no symptoms.', symptoms: 'Headaches, shortness of breath, nosebleeds (in severe cases), dizziness', causes: 'Genetic factors, high sodium diet, obesity, sedentary lifestyle, chronic stress', risk_factors: 'Family history, age over 55, obesity, smoking, high salt intake, diabetes', treatments: 'ACE inhibitors, beta-blockers, calcium channel blockers, diuretics, lifestyle changes', prevention: 'Regular exercise, DASH diet, reduced sodium intake, stress management, limiting alcohol', when_to_seek_help: 'BP > 180/120 mmHg, sudden severe headache, chest pain, vision changes, difficulty breathing' },
    { name: 'Type 2 Diabetes Mellitus', category: 'Endocrinology', overview: 'A metabolic disorder characterized by high blood sugar, insulin resistance, and relative lack of insulin.', symptoms: 'Frequent urination, excessive thirst, unexplained weight loss, fatigue, blurred vision, slow healing wounds', causes: 'Insulin resistance, pancreatic beta-cell dysfunction, genetic predisposition', risk_factors: 'Obesity, physical inactivity, family history, age over 45, pre-diabetes', treatments: 'Metformin, insulin therapy, GLP-1 agonists, SGLT-2 inhibitors, dietary management', prevention: 'Weight management, regular physical activity, healthy diet, avoiding sugary beverages', when_to_seek_help: 'Blood sugar > 300 mg/dL, confusion, difficulty breathing, fruity breath odor (DKA symptoms)' },
    { name: 'Asthma', category: 'Pulmonology', overview: 'A chronic inflammatory disease of the airways causing recurrent episodes of wheezing, breathlessness, and coughing.', symptoms: 'Wheezing, shortness of breath, chest tightness, chronic cough (especially at night)', causes: 'Airway inflammation, allergens, respiratory infections, exercise, environmental irritants', risk_factors: 'Family history, allergies, eczema, obesity, smoking exposure', treatments: 'Short-acting beta-agonists (albuterol), inhaled corticosteroids, long-acting bronchodilators', prevention: 'Avoiding triggers, allergen immunotherapy, annual flu vaccine, maintaining healthy weight', when_to_seek_help: 'Severe shortness of breath at rest, bluish lips, peak flow < 50% of personal best' },
    { name: 'Anxiety Disorder', category: 'Mental Health', overview: 'A group of mental health conditions characterized by excessive fear, worry, or nervousness.', symptoms: 'Excessive worry, restlessness, fatigue, difficulty concentrating, irritability, muscle tension, sleep problems', causes: 'Genetic factors, brain chemistry, life events, chronic stress, trauma', risk_factors: 'Family history, trauma, chronic illness, substance abuse', treatments: 'CBT, SSRIs, SNRIs, buspirone, mindfulness-based therapy', prevention: 'Regular exercise, stress management, avoiding caffeine/alcohol, social support', when_to_seek_help: 'Suicidal thoughts, inability to perform daily activities, symptoms lasting > 6 months' },
    { name: 'Coronary Artery Disease', category: 'Cardiology', overview: 'Plaque buildup inside coronary arteries reducing blood flow and oxygen to the heart.', symptoms: 'Chest pain (angina), shortness of breath, heart attack, fatigue with exertion', causes: 'Atherosclerosis, inflammation, oxidative stress', risk_factors: 'Hypertension, high cholesterol, diabetes, smoking, obesity, family history', treatments: 'Statins, aspirin, beta-blockers, nitroglycerin, coronary stenting, bypass surgery', prevention: 'Heart-healthy diet, regular exercise, smoking cessation, blood pressure and cholesterol control', when_to_seek_help: 'Crushing chest pain, pain radiating to arm/jaw, sudden shortness of breath - call 112 immediately' },
    { name: 'Migraine', category: 'Neurology', overview: 'A neurological condition causing severe, recurring headaches often accompanied by nausea and sensitivity to light.', symptoms: 'Throbbing headache (often one-sided), nausea, vomiting, photophobia, phonophobia, aura', causes: 'Neurological dysfunction, hormonal changes, stress, sleep disruption, dietary triggers', risk_factors: 'Family history, female gender, hormonal changes, stress, sleep disorders', treatments: 'Triptans, NSAIDs, antiemetics, preventive medications (topiramate, amitriptyline)', prevention: 'Identifying and avoiding triggers, regular sleep, stress management, hydration', when_to_seek_help: 'Worst headache of life, sudden onset, fever with stiff neck, neurological symptoms like weakness' },
    { name: 'GERD', category: 'Gastroenterology', overview: 'Chronic acid reflux where stomach acid frequently flows back into the esophagus.', symptoms: 'Heartburn, regurgitation, chest pain, difficulty swallowing, chronic cough', causes: 'Weak lower esophageal sphincter, hiatal hernia, delayed stomach emptying', risk_factors: 'Obesity, pregnancy, smoking, certain medications, eating large meals late at night', treatments: 'PPIs (omeprazole), H2 blockers, antacids, lifestyle modifications', prevention: 'Weight loss, avoiding trigger foods, eating smaller meals, not lying down after eating', when_to_seek_help: 'Difficulty swallowing, unexplained weight loss, vomiting blood, black/tarry stools' },
    { name: 'Osteoarthritis', category: 'Orthopedics', overview: 'Degenerative joint disease causing cartilage breakdown, pain, stiffness, and reduced mobility.', symptoms: 'Joint pain, stiffness (especially in morning), swelling, reduced range of motion, bone spurs', causes: 'Cartilage wear and tear, aging, previous joint injury, obesity', risk_factors: 'Age over 50, female gender, obesity, previous injury, repetitive joint use', treatments: 'NSAIDs, acetaminophen, physical therapy, joint replacement', prevention: 'Maintaining healthy weight, regular low-impact exercise, joint protection', when_to_seek_help: 'Sudden severe joint pain, joint locked in position, significant swelling after injury' },
    { name: 'Hypothyroidism', category: 'Endocrinology', overview: 'Underactive thyroid gland that does not produce enough thyroid hormone.', symptoms: 'Fatigue, weight gain, cold intolerance, constipation, dry skin, depression, slow heart rate', causes: "Hashimoto's thyroiditis, thyroid surgery, radiation therapy, iodine deficiency", risk_factors: 'Female gender, age over 60, family history, autoimmune conditions', treatments: 'Levothyroxine (synthetic T4) replacement therapy, regular TSH monitoring', prevention: 'Adequate iodine intake, regular thyroid screening in high-risk individuals', when_to_seek_help: 'Myxedema coma symptoms: extreme fatigue, low temperature, confusion' },
    { name: 'Atopic Dermatitis (Eczema)', category: 'Dermatology', overview: 'A chronic inflammatory skin condition causing itchy, red, and cracked skin.', symptoms: 'Intense itching, dry cracked skin, red or brownish-gray patches, small raised bumps', causes: 'Skin barrier dysfunction, immune system overactivation, genetic factors', risk_factors: 'Family history, asthma, allergic rhinitis, certain soaps/fabrics', treatments: 'Topical corticosteroids, calcineurin inhibitors, biologics (dupilumab)', prevention: 'Moisturizing regularly, avoiding known triggers, using mild soaps', when_to_seek_help: 'Signs of skin infection, severe itching disrupting sleep' },
    { name: 'Chronic Kidney Disease', category: 'Nephrology', overview: 'Progressive loss of kidney function over months or years.', symptoms: 'Fatigue, swollen ankles, shortness of breath, nausea, blood in urine, foamy urine', causes: 'Diabetes, hypertension, glomerulonephritis, polycystic kidney disease', risk_factors: 'Diabetes, high blood pressure, family history, age over 60', treatments: 'Blood pressure control, diabetes management, dietary changes, dialysis', prevention: 'Managing diabetes and blood pressure, staying hydrated, avoiding nephrotoxic medications', when_to_seek_help: 'Decreased urination, extreme fatigue, severe swelling, confusion' },
    { name: 'Iron Deficiency Anemia', category: 'Hematology', overview: 'A condition where blood lacks adequate healthy red blood cells due to low iron.', symptoms: 'Extreme fatigue, weakness, pale skin, chest pain, rapid heartbeat, headaches, cold extremities', causes: 'Blood loss, poor diet, inability to absorb iron, pregnancy', risk_factors: 'Women (menstruation), vegetarians, frequent blood donors, people with celiac disease', treatments: 'Iron supplements, dietary changes (red meat, leafy greens), treating underlying cause', prevention: 'Iron-rich diet, vitamin C with iron foods, regular blood tests', when_to_seek_help: 'Severe fatigue, rapid heartbeat, difficulty breathing with minimal exertion' },
  ];

  const insert = db.prepare(`
    INSERT INTO conditions (name, category, overview, symptoms, causes, risk_factors, treatments, prevention, when_to_seek_help)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of conditions) {
    try {
      insert.run(c.name, c.category, c.overview, c.symptoms, c.causes, c.risk_factors, c.treatments, c.prevention, c.when_to_seek_help);
    } catch (e) {
      console.error('Seed error for', c.name, ':', e.message);
    }
  }

  console.log('✅ Seeded', conditions.length, 'medical conditions');
}

module.exports = { db, initializeDatabase };
