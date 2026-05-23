require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import cors
const path = require('path'); // Import path module
const { Redis } = require('@upstash/redis');
const Stripe = require('stripe');
const crypto = require('crypto');
const { buildAiConfig, callAiChat } = require('./aiClient');
const { getHeroLocalizationList } = require('./heroAliases');
const { getActiveDataProvider } = require('./dataProviders');
const { buildChineseCoachMessages } = require('./dotaDataContext');
const { calculateDamageCombo, getHeroDamageProfile } = require('./damageCalculator');

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const APP_URL = process.env.APP_URL || 'https://www.dota2helper.com';
const FREE_TIER_LIMIT = 3;
const aiConfig = buildAiConfig();
const dataProvider = getActiveDataProvider();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const redis = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  ? new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
  : null;

if (!stripe) console.warn('STRIPE_SECRET_KEY not set — payment endpoints will not work');
if (!redis) console.warn('Redis not configured — rate limiting will be disabled');
// Lazy load dotaconstants using dynamic import (ES Module compatible)
let dotaconstantsData = null;
async function getDotaConstants() {
  if (!dotaconstantsData) {
    const dc = await import('dotaconstants');
    dotaconstantsData = {
      heroes: dc.heroes,
      abilities: dc.abilities,
      hero_abilities: dc.hero_abilities,
      items: dc.items,
      patch: dc.patch
    };
  }
  return dotaconstantsData;
}

const app = express();
// Use environment variable for port or default to 3002
const port = process.env.PORT || 3002; 

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use('/api/webhook', express.raw({ type: 'application/json' })); // Raw body for Stripe webhook verification
app.use(express.json()); // Parse JSON request bodies

// --- Serve Static Files --- 
// Serve static files (HTML, CSS, JS) from the current directory (__dirname)
const staticFilesPath = __dirname; 
app.use(express.static(staticFilesPath)); 

const DOTA_HERO_NAMES = getHeroLocalizationList().map((hero) => hero.localized_name);

// Get current patch version
async function getCurrentPatch() {
  const { patch } = await getDotaConstants();
  return patch[patch.length - 1]?.name || 'Unknown';
}

// Get hero abilities with current stats from dotaconstants
async function getHeroAbilitiesContext(heroName) {
  const { heroes, hero_abilities, abilities } = await getDotaConstants();
  const hero = Object.values(heroes).find(h => h.localized_name === heroName);
  if (!hero) return '';

  const heroAbilitiesData = hero_abilities[hero.name];
  if (!heroAbilitiesData) return '';
  const abilityDetails = heroAbilitiesData.abilities
    .map(abilityName => abilities[abilityName])
    .filter(a => a && a.dname && a.desc)
    .map(a => {
      let details = `**${a.dname}**: ${a.desc}`;
      if (a.attrib && a.attrib.length > 0) {
        const stats = a.attrib
          .filter(attr => attr.header || attr.key)
          .slice(0, 3) // Limit to 3 key stats
          .map(attr => {
            const value = Array.isArray(attr.value) ? attr.value.join('/') : attr.value;
            return `${attr.header || attr.key}: ${value}`;
          })
          .join(', ');
        if (stats) details += ` [${stats}]`;
      }
      return details;
    });

  // Add facets if available
  let facetInfo = '';
  if (heroAbilitiesData.facets && heroAbilitiesData.facets.length > 0) {
    const facets = heroAbilitiesData.facets
      .filter(f => f.title && f.description && !f.deprecated)
      .map(f => `${f.title}: ${f.description}`)
      .join('\n  - ');
    if (facets) facetInfo = `\nFacets:\n  - ${facets}`;
  }

  return abilityDetails.join('\n') + facetInfo;
}

// Get item data for commonly built items
async function getItemContext(itemNames) {
  const { items } = await getDotaConstants();
  return itemNames
    .map(name => {
      const item = items[name];
      if (!item || !item.dname) return null;

      let details = `**${item.dname}** (${item.cost} gold)`;

      // Add key attributes
      if (item.attrib && item.attrib.length > 0) {
        const attrs = item.attrib
          .filter(a => a.display || a.key)
          .slice(0, 4)
          .map(a => {
            const display = a.display ? a.display.replace('{value}', a.value) : `${a.key}: ${a.value}`;
            return display;
          })
          .join(', ');
        if (attrs) details += `: ${attrs}`;
      }

      // Add active/passive ability
      if (item.abilities && item.abilities.length > 0) {
        const ability = item.abilities[0];
        details += ` | ${ability.type}: ${ability.title}`;
      }

      return details;
    })
    .filter(Boolean)
    .join('\n');
}

// Debug endpoint to test components
app.get('/api/debug', async (req, res) => {
    const results = { timestamps: {} };

    try {
        // Test 1: Basic response
        results.timestamps.start = Date.now();
        results.step1_basic = 'OK';

        // Test 2: Load dotaconstants
        const dcStart = Date.now();
        const dc = await getDotaConstants();
        results.timestamps.dotaconstants = Date.now() - dcStart;
        results.step2_dotaconstants = dc.patch ? 'OK' : 'FAILED';
        results.patch = dc.patch[dc.patch.length - 1]?.name;

        // Test 3: Simple AI provider call
        const aiStart = Date.now();
        const aiResponse = await callAiChat(
            axios,
            aiConfig,
            [{ role: 'user', content: 'Say "OK" and nothing else.' }],
            { maxCompletionTokens: 10, reasoningEffort: 'low' }
        );
        results.timestamps.ai = Date.now() - aiStart;
        results.ai_provider = aiConfig.provider;
        results.ai_model = aiConfig.model;
        results.ai_base_url = aiConfig.baseUrl;
        results.step3_ai = aiResponse.data.choices ? 'OK' : 'FAILED';
        results.ai_response = aiResponse.data.choices[0]?.message?.content;

        results.timestamps.total = Date.now() - results.timestamps.start;
        res.json(results);
    } catch (error) {
        results.error = error.message;
        results.timestamps.total = Date.now() - results.timestamps.start;
        res.status(500).json(results);
    }
});

// Get brief enemy abilities (key threats to watch)
async function getEnemyAbilitiesBrief(heroNames) {
  const { heroes, hero_abilities, abilities } = await getDotaConstants();

  return heroNames.map(heroName => {
    const hero = Object.values(heroes).find(h => h.localized_name === heroName);
    if (!hero) return null;

    const heroAbilitiesData = hero_abilities[hero.name];
    if (!heroAbilitiesData) return null;

    // Get ultimate and one key basic ability
    const abilityList = heroAbilitiesData.abilities
      .map(name => abilities[name])
      .filter(a => a && a.dname && a.behavior !== 'Passive');

    const ultimate = abilityList.find(a => a.ultimate);
    const keyAbility = abilityList.find(a => !a.ultimate && a.desc);

    let result = `**${heroName}**: `;
    if (keyAbility) result += `${keyAbility.dname} - ${keyAbility.desc?.slice(0, 100)}...`;
    if (ultimate) result += ` | ULT: ${ultimate.dname}`;

    return result;
  }).filter(Boolean).join('\n');
}

// Common items by role for context (including starting items)
const ROLE_ITEMS = {
  'Safe Lane': ['tango', 'quelling_blade', 'slippers', 'branches', 'magic_wand', 'power_treads', 'battle_fury', 'black_king_bar', 'butterfly', 'satanic', 'manta', 'disperser'],
  'Midlane': ['tango', 'faerie_fire', 'branches', 'bottle', 'magic_wand', 'power_treads', 'black_king_bar', 'blink', 'orchid', 'bloodthorn', 'aghanims_shard', 'ultimate_scepter'],
  'Offlane': ['tango', 'quelling_blade', 'ring_of_protection', 'branches', 'magic_wand', 'phase_boots', 'soul_ring', 'blink', 'blade_mail', 'black_king_bar', 'pipe', 'lotus_orb', 'assault'],
  'Support': ['tango', 'blood_grenade', 'enchanted_mango', 'branches', 'magic_wand', 'arcane_boots', 'force_staff', 'glimmer_cape', 'aghanims_shard', 'ultimate_scepter', 'blink'],
  'Hard Support': ['tango', 'clarity', 'blood_grenade', 'branches', 'magic_wand', 'arcane_boots', 'force_staff', 'glimmer_cape', 'ghost', 'solar_crest', 'aeon_disk']
};

// Route to serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(staticFilesPath, 'index.html')); 
});

// --- Rate Limiting Middleware ---
async function rateLimitMiddleware(req, res, next) {
  // If Redis is not configured, skip rate limiting
  if (!redis) return next();

  // Check for Pro token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const tokenData = await redis.get(`token:${token}`);
      if (tokenData && tokenData.status === 'active') {
        req.isPro = true;
        return next();
      }
    } catch (err) {
      console.error('Redis error checking token:', err);
    }
  }

  // IP-based rate limiting for free tier (check only, don't increment yet)
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim();
  const key = `ratelimit:${ip}`;

  try {
    const current = (await redis.get(key)) || 0;

    if (current >= FREE_TIER_LIMIT) {
      return res.status(429).json({
        error: 'Daily free limit reached. Upgrade to Pro for unlimited queries.',
        remaining: 0,
        limit: FREE_TIER_LIMIT
      });
    }

    req.isPro = false;
    req.rateLimitKey = key;
    req.queriesRemaining = FREE_TIER_LIMIT - current - 1; // will be decremented after success
    next();
  } catch (err) {
    console.error('Redis rate limit error:', err);
    // Fail open — don't break the app if Redis is down
    next();
  }
}

// --- Stripe Endpoints ---

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}?cancelled=true`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

app.post('/api/create-portal-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  const token = authHeader.substring(7);

  try {
    const tokenData = await redis.get(`token:${token}`);
    if (!tokenData || !tokenData.stripeCustomerId) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tokenData.stripeCustomerId,
      return_url: APP_URL,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err);
    res.status(500).json({ error: 'Failed to create portal session.' });
  }
});

app.post('/api/webhook', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const email = session.customer_details?.email || session.customer_email;

        const token = crypto.randomUUID();

        await redis.set(`token:${token}`, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          email: email,
          status: 'active',
          createdAt: new Date().toISOString()
        });

        await redis.set(`customer:${customerId}`, token);
        if (email) {
          await redis.set(`email:${email.toLowerCase()}`, customerId);
        }

        console.log(`New subscription: ${customerId}, token: ${token}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const token = await redis.get(`customer:${customerId}`);
        if (token) {
          const tokenData = await redis.get(`token:${token}`);
          if (tokenData) {
            const newStatus = subscription.status === 'active' ? 'active' : 'inactive';
            await redis.set(`token:${token}`, { ...tokenData, status: newStatus });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const token = await redis.get(`customer:${customerId}`);
        if (token) {
          const tokenData = await redis.get(`token:${token}`);
          if (tokenData) {
            await redis.set(`token:${token}`, { ...tokenData, status: 'inactive' });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

app.get('/api/checkout-success', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const customerId = session.customer;
    const token = await redis.get(`customer:${customerId}`);

    if (!token) {
      return res.status(202).json({ error: 'Processing payment. Please retry in a moment.' });
    }

    res.json({ token });
  } catch (err) {
    console.error('Checkout success error:', err);
    res.status(500).json({ error: 'Failed to retrieve subscription.' });
  }
});

app.get('/api/subscription-status', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ active: false });
  }
  const token = authHeader.substring(7);

  try {
    const tokenData = await redis.get(`token:${token}`);
    if (tokenData && tokenData.status === 'active') {
      return res.json({ active: true, email: tokenData.email });
    }
    return res.json({ active: false });
  } catch (err) {
    console.error('Status check error:', err);
    return res.json({ active: false });
  }
});

app.post('/api/recover-token', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const customerId = await redis.get(`email:${email.toLowerCase().trim()}`);
    if (!customerId) {
      return res.status(404).json({ error: 'No subscription found for this email.' });
    }

    const token = await redis.get(`customer:${customerId}`);
    if (!token) {
      return res.status(404).json({ error: 'Subscription token not found.' });
    }

    const tokenData = await redis.get(`token:${token}`);
    if (!tokenData || tokenData.status !== 'active') {
      return res.status(404).json({ error: 'Subscription is no longer active.' });
    }

    res.json({ token });
  } catch (err) {
    console.error('Token recovery error:', err);
    res.status(500).json({ error: 'Failed to recover token.' });
  }
});

// --- API Routes ---

// API route to get hero list (now uses hardcoded list)
app.get('/api/heroes', async (req, res) => {
    try {
        res.json(getHeroLocalizationList());
    } catch (error) {
         // Should ideally not happen with hardcoded list, but keep for safety
        console.error("Error sending hero list:", error);
        res.status(500).json({ error: 'Failed to provide hero list.' });
    }
});

app.get('/api/damage/heroes/:hero', async (req, res) => {
    try {
        const profile = await getHeroDamageProfile(req.params.hero);
        res.json(profile);
    } catch (error) {
        console.error('Error building damage profile:', error);
        res.status(404).json({ error: error.message || 'Failed to build damage profile.' });
    }
});

app.post('/api/damage/calculate', async (req, res) => {
    try {
        const result = await calculateDamageCombo(req.body || {});
        res.json(result);
    } catch (error) {
        console.error('Error calculating damage combo:', error);
        res.status(400).json({ error: error.message || 'Failed to calculate damage combo.' });
    }
});

// API route to get tips from LLM
app.post('/api/get-tips', rateLimitMiddleware, async (req, res) => {
    const { myTeam, opponentTeam } = req.body; 

    let prompt;
    try {
        if (!myTeam || !opponentTeam || myTeam.length !== 5 || opponentTeam.length !== 5) {
             return res.status(400).json({ error: 'Invalid input structure. Requires myTeam and opponentTeam arrays of size 5.' });
        }
        const matchContext = await dataProvider.buildMatchContext(myTeam, opponentTeam);
        prompt = dataProvider.buildGroundedChinesePrompt(matchContext);
        console.log('Backend match context built for heroes:', [
          ...matchContext.teams.myTeam,
          ...matchContext.teams.opponentTeam
        ].map((entry) => entry.hero).join(', '));
    } catch (err) {
         console.warn("Failed to build match context:", err.message);
         return res.status(400).json({ error: err.message || 'Failed to build match context.' });
    }

    try {
        console.log(`Sending structured prompt to AI provider (${aiConfig.provider}, ${aiConfig.model})...`);
        const aiResponse = await callAiChat(
            axios,
            aiConfig,
            buildChineseCoachMessages(prompt),
            { temperature: 1, maxCompletionTokens: 8192, topP: 1, reasoningEffort: 'low' }
        );

        console.log('Received response from AI provider. Choices exist:', !!aiResponse.data.choices);

        const choices = aiResponse.data.choices;
        if (choices && choices.length > 0 && choices[0].message && choices[0].message.content) {
            const tips = choices[0].message.content;

            // Increment rate limit only on successful response
            if (redis && req.rateLimitKey) {
              const count = await redis.incr(req.rateLimitKey);
              if (count === 1) await redis.expire(req.rateLimitKey, 86400);
              req.queriesRemaining = Math.max(0, FREE_TIER_LIMIT - count);
            }

            res.json({ tips, remaining: req.queriesRemaining, isPro: req.isPro });
        } else {
            console.error('Unexpected response structure from AI provider:', JSON.stringify(aiResponse.data, null, 2));
            res.status(500).json({ error: 'Failed to parse response from AI model.' });
        }

    } catch (error) {
        console.error('Error calling AI provider: Status', error.response?.status);
        console.error(error.response?.data ? JSON.stringify(error.response.data) : error.message);

        let errorMessage = 'Failed to get tips from AI model.';
        if (error.response?.data?.error?.message) {
            errorMessage = `AI Model Error: ${error.response.data.error.message}`;
        } else if (error.response?.status) {
            errorMessage = `AI Model request failed with status: ${error.response.status}`;
        }
        res.status(error.response?.status || 500).json({ error: errorMessage });
    }
});

// --- Start Server --- 
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
}); 
