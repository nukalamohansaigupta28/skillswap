const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const { connectDB, disconnectDB } = require('../config/db');

const initialSkills = [
  // 1. Music (6)
  {
    name: 'Acoustic & Electric Guitar',
    category: 'Music',
    description: 'Chords, fingerpicking, strumming techniques, scale theory, and soloing.',
    status: 'approved'
  },
  {
    name: 'Piano & Keyboard',
    category: 'Music',
    description: 'Classical, jazz, and pop fundamentals, hand independence, and sight-reading.',
    status: 'approved'
  },
  {
    name: 'Vocal Coaching & Singing',
    category: 'Music',
    description: 'Breath support, pitch accuracy, vocal range expansion, and resonance.',
    status: 'approved'
  },
  {
    name: 'Drums & Percussion',
    category: 'Music',
    description: 'Rhythm patterns, tempo control, double-kick technique, and limb coordination.',
    status: 'approved'
  },
  {
    name: 'Violin & Fiddle',
    category: 'Music',
    description: 'Bowing posture, intonation, finger placement, and dynamics control.',
    status: 'approved'
  },
  {
    name: 'Music Production (Ableton / FL Studio)',
    category: 'Music',
    description: 'Beat making, synth sound design, mixing, mastering, and audio arrangement.',
    status: 'approved'
  },

  // 2. Cooking (6)
  {
    name: 'Italian Pasta & Sauce Making',
    category: 'Cooking',
    description: 'Handmade pasta dough, ravioli shaping, carbonara, and slow-simmered ragu.',
    status: 'approved'
  },
  {
    name: 'Artisan Sourdough Bread Baking',
    category: 'Cooking',
    description: 'Starter cultivation, fermentation hydration, scoring, and Dutch oven baking.',
    status: 'approved'
  },
  {
    name: 'Japanese Sushi & Ramen Craft',
    category: 'Cooking',
    description: 'Rice seasoning, fish slicing, dashi broth creation, and chashu preparation.',
    status: 'approved'
  },
  {
    name: 'Indian Curry & Spice Blending',
    category: 'Cooking',
    description: 'Tadka techniques, garam masala roasting, paneer curries, and biryani layering.',
    status: 'approved'
  },
  {
    name: 'French Pastry & Desserts',
    category: 'Cooking',
    description: 'Choux pastry, macarons, crème brûlée, fruit tarts, and lamination.',
    status: 'approved'
  },
  {
    name: 'Plant-Based & Vegan Cooking',
    category: 'Cooking',
    description: 'Nutrient-dense meal prep, tofu marinades, cashew cheeses, and legumes.',
    status: 'approved'
  },

  // 3. Coding (7)
  {
    name: 'JavaScript & Modern React',
    category: 'Coding',
    description: 'ES6+, React hooks, context API, state management, and component architecture.',
    status: 'approved'
  },
  {
    name: 'Python for Data Science',
    category: 'Coding',
    description: 'Pandas, NumPy, data cleaning, automated scraping, and Matplotlib visualization.',
    status: 'approved'
  },
  {
    name: 'Node.js & Express REST APIs',
    category: 'Coding',
    description: 'Server architecture, middleware pipelines, JWT auth, and database integration.',
    status: 'approved'
  },
  {
    name: 'Mobile App Development with Flutter',
    category: 'Coding',
    description: 'Dart language, responsive widgets, state providers, and cross-platform UI.',
    status: 'approved'
  },
  {
    name: 'SQL & Database Optimization',
    category: 'Coding',
    description: 'Relational design, normalization, complex joins, indexing, and query tuning.',
    status: 'approved'
  },
  {
    name: 'Docker, CI/CD & Cloud Deployment',
    category: 'Coding',
    description: 'Containerization, multi-stage builds, GitHub Actions, and cloud hosting.',
    status: 'approved'
  },
  {
    name: 'Machine Learning with PyTorch',
    category: 'Coding',
    description: 'Tensors, neural network layers, loss functions, CNNs, and model evaluation.',
    status: 'approved'
  },

  // 4. Languages (6)
  {
    name: 'Conversational Spanish',
    category: 'Languages',
    description: 'Daily vocabulary, verb conjugations, pronunciation, and Latin culture.',
    status: 'approved'
  },
  {
    name: 'Japanese (JLPT N5-N3)',
    category: 'Languages',
    description: 'Hiragana, Katakana, essential Kanji, conversational grammar, and listening.',
    status: 'approved'
  },
  {
    name: 'French for Beginners & Travel',
    category: 'Languages',
    description: 'Everyday dialogue, travel essentials, phonetic vowels, and listening comprehension.',
    status: 'approved'
  },
  {
    name: 'German Language Mastery',
    category: 'Languages',
    description: 'Articles (der/die/das), four case declensions, sentence structure, and vocabulary.',
    status: 'approved'
  },
  {
    name: 'Mandarin Chinese (Pinyin & HSK)',
    category: 'Languages',
    description: 'The four tones, Pinyin romanization, radical strokes, and basic dialogue.',
    status: 'approved'
  },
  {
    name: 'Business English & Interview Prep',
    category: 'Languages',
    description: 'Professional email writing, presentation delivery, and job interview fluency.',
    status: 'approved'
  },

  // 5. Sports & Fitness (5)
  {
    name: 'Vinyasa Yoga & Breathwork (Pranayama)',
    category: 'Sports',
    description: 'Sun salutations, pose alignment, balance strengthening, and guided meditation.',
    status: 'approved'
  },
  {
    name: 'Tennis Coaching & Footwork',
    category: 'Sports',
    description: 'Forehand top spin, backhand slices, serve consistency, and court positioning.',
    status: 'approved'
  },
  {
    name: 'Calisthenics & Bodyweight Strength',
    category: 'Sports',
    description: 'Pull-up progressions, muscle-ups, handstands, and core control mechanics.',
    status: 'approved'
  },
  {
    name: 'Swimming Technique & Endurance',
    category: 'Sports',
    description: 'Freestyle breathing efficiency, stroke glide, flip turns, and interval training.',
    status: 'approved'
  },
  {
    name: 'Competitive Chess Strategy',
    category: 'Sports',
    description: 'Opening repertoires, pawn structures, tactical combinations, and endgame play.',
    status: 'approved'
  },

  // 6. Art & Design (6)
  {
    name: 'Digital Illustration with Procreate',
    category: 'Art',
    description: 'Layering, custom brush creation, blending modes, color palettes, and anatomy.',
    status: 'approved'
  },
  {
    name: 'Watercolor Landscape Painting',
    category: 'Art',
    description: 'Wet-on-wet washes, dry brushing, color lifting, and atmospheric perspective.',
    status: 'approved'
  },
  {
    name: 'Portrait & Street Photography',
    category: 'Art',
    description: 'Manual camera exposure, golden hour lighting, lens selection, and Lightroom editing.',
    status: 'approved'
  },
  {
    name: 'UI/UX Design in Figma',
    category: 'Art',
    description: 'Auto layout, design tokens, interactive prototyping, and component systems.',
    status: 'approved'
  },
  {
    name: 'Pottery & Ceramic Wheel Throwing',
    category: 'Art',
    description: 'Centering clay, cylinder pulling, trimming, glazing, and kiln firing.',
    status: 'approved'
  },
  {
    name: 'Video Editing & Motion Graphics (Premiere)',
    category: 'Art',
    description: 'Story pacing, audio synchronization, color grading LUTs, and keyframing.',
    status: 'approved'
  },

  // 7. Academics (5)
  {
    name: 'Calculus & Linear Algebra',
    category: 'Academics',
    description: 'Derivatives, multi-variable integration, matrices, eigenvalues, and vectors.',
    status: 'approved'
  },
  {
    name: 'Organic Chemistry & Reaction Mechanisms',
    category: 'Academics',
    description: 'Stereochemistry, SN1/SN2 substitution, resonance structures, and synthesis.',
    status: 'approved'
  },
  {
    name: 'Microeconomics & Game Theory',
    category: 'Academics',
    description: 'Supply and demand curves, Nash equilibria, market elasticity, and pricing.',
    status: 'approved'
  },
  {
    name: 'Physics: Classical Mechanics & Thermodynamics',
    category: 'Academics',
    description: "Newtonian laws, rotational dynamics, work-energy theorem, and heat cycles.",
    status: 'approved'
  },
  {
    name: 'Academic Research & Essay Writing',
    category: 'Academics',
    description: 'Thesis formulation, literature synthesis, citation standards (APA/MLA), and argument logic.',
    status: 'approved'
  },

  // 8. Other (4)
  {
    name: 'Public Speaking & Presentation Skills',
    category: 'Other',
    description: 'Storytelling, vocal modulation, stage presence, and overcoming stage fright.',
    status: 'approved'
  },
  {
    name: 'Personal Finance & Budgeting',
    category: 'Other',
    description: 'Index fund investing, 401(k) / Roth IRA allocation, credit score optimization.',
    status: 'approved'
  },
  {
    name: 'Indoor Plant Care & Propagation',
    category: 'Other',
    description: 'Light requirements, soil aeration, root propagation, and pest management.',
    status: 'approved'
  },
  {
    name: 'Woodworking & Joinery Basics',
    category: 'Other',
    description: 'Hand tool sharpening, mortise and tenon joints, sanding, and natural oil finishing.',
    status: 'approved'
  }
];

const seedSkills = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log(`[Seed] Processing ${initialSkills.length} skills...`);

    let addedCount = 0;
    let existingCount = 0;

    for (const skillData of initialSkills) {
      const existing = await Skill.findOne({ name: skillData.name });
      if (!existing) {
        await Skill.create(skillData);
        addedCount++;
      } else {
        existingCount++;
      }
    }

    console.log(`[Seed] Successfully seeded skills!`);
    console.log(`       - New skills inserted: ${addedCount}`);
    console.log(`       - Existing skills kept: ${existingCount}`);
    console.log(`       - Total approved catalog skills: ${addedCount + existingCount}`);

    return { addedCount, existingCount, total: addedCount + existingCount };
  } catch (err) {
    console.error('[Seed] Error seeding skills:', err);
    throw err;
  } finally {
    if (require.main === module) {
      await disconnectDB();
      process.exit(0);
    }
  }
};

if (require.main === module) {
  seedSkills();
}

module.exports = { seedSkills, initialSkills };

