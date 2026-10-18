// Bhumi Lipi AI Assistant component
// Provides an intelligent land assistant with API integration and offline knowledge engine.
import { h, icon, clear } from '../dom.js';
import { state, T } from '../i18n.js';

const QUICK_PROMPTS = [
  { id: 'check', bn: 'জমি কীভাবে যাচাই করব?', en: 'How to check land records?' },
  { id: 'khatian', bn: 'খতিয়ান ও দাগ নম্বর কী?', en: 'What are Khatian & Dag numbers?' },
  { id: 'ownership', bn: 'মালিকানা ও দলিল যাচাই', en: 'Ownership & Deed Verification' },
  { id: 'mutation', bn: 'নামজারি প্রক্রিয়া কী?', en: 'What is the mutation process?' },
  { id: 'bank', bn: 'ব্যাংক লিয়েন সেবা কীভাবে কাজ করে?', en: 'How does Bank Lien check work?' },
  { id: 'lab', bn: 'জাল দলিল ও ভূমি জালিয়াতি রোধ', en: 'Fraud Shield & Attack Lab' },
];

const KNOWLEDGE_BASE = [
  {
    keys: ['যাচাই', 'চেক', 'check', 'verify', 'কীভাবে জমি', 'how to check', 'প্লট'],
    title: { bn: 'জমি যাচাই করার সহজ ধাপ', en: 'Steps to Verify Land' },
    steps: [
      { bn: '১. হোমপেজ বা "জমি দেখুন" মেনু থেকে প্লট কোড (যেমন: DHK-UTT-0142), খতিয়ান নম্বর বা মালিকের নাম লিখুন।', en: '1. Enter plot code (e.g., DHK-UTT-0142), khatian, or owner name from the Home or Check page.' },
      { bn: '২. "খুঁজুন" বা "যাচাই" বাটনে ক্লিক করে জমির বিস্তারিত রেকর্ড দেখুন।', en: '2. Click "Search" or "Check" to review full plot details and status.' },
      { bn: '৩. সবুজ (নিরাপদ), হলুদ (সতর্কতা) বা লাল (ঝুঁকি) স্ট্যাটাস ও কারণ পর্যালোচনা করুন।', en: '3. Inspect the Green (Clean), Amber (Warning), or Red (Risk) verdict.' }
    ],
    action: { label: { bn: 'জমি দেখুন পেজে যান →', en: 'Go to Check Page →' }, route: '/check' }
  },
  {
    keys: ['খতিয়ান', 'দাগ', 'khatian', 'dag', 'cs', 'sa', 'rs', 'bs', 'সার্ভে', 'জরিপ'],
    title: { bn: 'খতিয়ান ও দাগ নম্বরের পরিচিতি', en: 'About Khatian & Dag Numbers' },
    steps: [
      { bn: 'খতিয়ান হলো জমির স্বত্বলিপি বা রেকর্ডের প্রমাণপত্র। বাংলাদেশে CS, SA, RS এবং BS জরিপে খতিয়ান তৈরি হয়েছে।', en: 'A Khatian is a certified record of rights (ROR) created during CS, SA, RS, and BS surveys.' },
      { bn: 'দাগ নম্বর হলো মৌজা মানচিত্রে নির্দিষ্ট ভূমির চিহ্নিত সীমানা বা প্লট নম্বর।', en: 'A Dag/Plot number represents a specific bounded parcel of land on a mouza cadastral map.' },
      { bn: 'ভূমি লিপি সিস্টেমে চার জরিপের খতিয়ান ও পরিমাণের মিল যাচাই করে বিরোধ শনাক্ত করা হয়।', en: 'Bhumi Lipi cross-checks area across all four survey records to detect discrepancies.' }
    ],
    action: { label: { bn: 'খতিয়ান রেকর্ড দেখুন →', en: 'View Khatian Records →' }, route: '/check' }
  },
  {
    keys: ['মালিকানা', 'দলিল', 'স্বত্ব', 'owner', 'deed', 'দলিল আসল', 'সিল', 'qr', 'কিউআর'],
    title: { bn: 'মালিকানা রেকর্ড ও দলিল যাচাই', en: 'Ownership & Deed Verification' },
    steps: [
      { bn: 'রেজিস্ট্রেশন অফিসে প্রতিটি দলিলের ক্রিপ্টোগ্রাফিক ডিজিটাল সিল (SHA-256) যুক্ত থাকে।', en: 'Every registered deed receives a tamper-evident digital seal (SHA-256).' },
      { bn: 'দলিলের কিউআর কোড স্ক্যান করে বা ৬৪-অক্ষরের সিল কোড দিয়ে সত্যতা সেকেন্ডে যাচাই করা যায়।', en: 'Verify genuineness in seconds by scanning the QR code or pasting the 64-char seal code.' },
      { bn: 'দলিলটি সর্বশেষ কি না এবং কোনো জালিয়াতি হয়েছে কি না তা তাৎক্ষণিক ধরা পড়ে।', en: 'The system instantly confirms if the deed is genuine, outdated, or altered.' }
    ],
    action: { label: { bn: 'দলিল যাচাই করুন →', en: 'Verify a Deed →' }, route: '/verify' }
  },
  {
    keys: ['নামজারি', 'খারিজ', 'mutation', 'namjari', 'এসি ল্যান্ড'],
    title: { bn: 'ডিজিটাল ই-নামজারি প্রক্রিয়া', en: 'Digital e-Mutation Process' },
    steps: [
      { bn: 'জমি বিক্রির পর স্বয়ংক্রিয়ভাবে নামজারি ট্র্যাকিং শুরু হয় এবং জমি লক হয়ে যায়।', en: 'Upon deed registration, an automated mutation ticket is spawned and the plot is locked.' },
      { bn: 'নামজারি সম্পন্ন না হওয়া পর্যন্ত একই জমি দ্বিতীয়বার বিক্রির সুযোগ নেই (ডাবল-সেল প্রোটেকশন)।', en: 'Double-sale is prevented by locking the parcel until AC Land approves the transfer.' },
      { bn: 'এসি ল্যান্ড কর্মকর্তা অনলাইনে কাগজপত্র যাচাই করে অনুমোদন বা বাতিল করেন।', en: 'AC Land officers review automated checks and make final approve/reject decisions.' }
    ],
    action: { label: { bn: 'নামজারি ট্র্যাক করুন →', en: 'Track Mutations →' }, route: '/mutation' }
  },
  {
    keys: ['ব্যাংক', 'লিয়েন', 'ঋণ', 'বন্ধক', 'bank', 'lien', 'mortgage'],
    title: { bn: 'ব্যাংক লিয়েন ও বন্ধক তথ্য', en: 'Bank Liens & Mortgages' },
    steps: [
      { bn: 'জমি ব্যাংকে বন্ধক রেখে ঋণ নিলে সিস্টেমে তাৎক্ষণিক ডিজিটাল লিয়েন যুক্ত হয়।', en: 'When land is mortgaged to a bank, an instant digital lien is registered in the chain.' },
      { bn: 'বন্ধকি জমি অন্য কারো কাছে গোপন করে বিক্রি বা একাধিক ব্যাংকে বন্ধক রাখা অসম্ভব।', en: 'Hidden sales or multiple financing on the same parcel are completely prevented.' },
      { bn: 'ব্যাংক লিয়েন পেজে গিয়ে প্লট নম্বর দিয়ে সক্রিয় লিয়েন যাচাই করা যায়।', en: 'Visit the Bank page to check active liens against any plot ID.' }
    ],
    action: { label: { bn: 'ব্যাংক লিয়েন পেজ →', en: 'Check Bank Liens →' }, route: '/bank' }
  },
  {
    keys: ['জাল', 'জালিয়াতি', 'ল্যাব', 'lab', 'অ্যাটাক', 'fraud', 'attack', 'নিরাপত্তা'],
    title: { bn: 'জালিয়াতি রোধ ও অ্যাটাক ল্যাব', en: 'Fraud Shield & Attack Lab' },
    steps: [
      { bn: 'ভূমি লিপি ৫টি প্রধান ভূমি জালিয়াতি ঠেকাতে ক্রিপ্টোগ্রাফিক সিল ও চেইন ব্যবহার করে।', en: 'Bhumi Lipi neutralizes 5 common land frauds using cryptographic seals and linked chains.' },
      { bn: 'ডাবল-সেল, পুরোনো জাল দলিল, রেকর্ড বিকৃতি, গোপন বন্ধক ও খাস জমি জালিয়াতি সরাসরি ধরা পড়ে।', en: 'Double sales, expired deeds, record tampering, hidden liens, and khas theft are blocked.' },
      { bn: 'অ্যাটাক ল্যাবে গিয়ে লাইভ ডেমো আক্রমণ চালিয়ে সরাসরি প্রমাণ দেখতে পারেন।', en: 'Visit the Attack Lab to trigger live simulations and watch attacks fail in real time.' }
    ],
    action: { label: { bn: 'অ্যাটাক ল্যাব দেখুন →', en: 'Open Attack Lab →' }, route: '/lab' }
  },
  {
    keys: ['সাহায্য', 'হেল্প', 'যোগাযোগ', 'help', 'support', 'পরিচিতি', 'about'],
    title: { bn: 'সহায়তা ও পরিচিতি', en: 'Help & Documentation' },
    steps: [
      { bn: 'ভূমি লিপি একটি আধুনিক ল্যান্ডটেক প্ল্যাটফর্ম যা ডিজিটাল বাংলাদেশে ভূমি সেবায় স্বচ্ছতা আনবে।', en: 'Bhumi Lipi is a LandTech innovation built for transparency in land governance.' },
      { bn: 'নমুনা প্লট (যেমন DHK-UTT-0142) নির্বাচন করে তাৎক্ষণিক পরীক্ষা চালাতে পারেন।', en: 'Select any sample plot to inspect real simulated verification flows.' },
      { bn: 'সিস্টেম আর্কিটেকচার ও হ্যাকাথন উপস্থাপনা দেখতে আমাদের পরিচিতি পেজ ভিজিট করুন।', en: 'For architecture and concept details, visit our About documentation.' }
    ],
    action: { label: { bn: 'আমাদের পরিচিতি →', en: 'About Bhumi Lipi →' }, route: '/about' }
  },
  {
    keys: ['integrity', 'সততা', 'সুরক্ষা', 'শিকল', 'চেইন', 'merkle', 'মার্কেল', 'রুট', 'proof', 'প্রুফ', 'independent', 'স্ক্রিপ্ট', 'verifier', 'verify_anchor', 'tamper', 'বিকৃতি'],
    title: { bn: 'সততা ও চেইন সুরক্ষা (Integrity) সেকশন ব্যবহারের নিয়ম', en: 'How to Use Chain Integrity Section' },
    steps: [
      { bn: '১. সততা ও সুরক্ষা (#/integrity) পেজে গিয়ে প্রতিটি ব্লকের SHA-256 হ্যাশ শিকল ও আজকের পাবলিক মারকেল রুট দেখতে পাবেন।', en: '1. Visit the Integrity (#/integrity) page to inspect SHA-256 block chains and daily anchored Merkle roots.' },
      { bn: '২. সিস্টেমের কোনো রেকর্ড কেউ বিকৃত বা টেম্পার করেছে কি না তা লাইভ চেইন-গার্ড স্ট্যাটাস দেখে তাৎক্ষণিক নিশ্চিত হওয়া যায়।', en: '2. Check live Chain-Guard status to instantly confirm all records remain untampered.' },
      { bn: '৩. পেজের নিচে দেওয়া স্বাধীন পাইথন ভেরিফায়ার স্ক্রিপ্ট (verify_anchor.py) ডাউনলোড করে যে কেউ অফলাইনে গাণিতিক প্রমাণ পরীক্ষা করতে পারেন।', en: '3. Download the standalone Python verifier script (verify_anchor.py) to independently verify cryptographic proofs offline.' }
    ],
    action: { label: { bn: 'সুরক্ষা পেজে যান →', en: 'Go to Integrity Page →' }, route: '/integrity' }
  },
  {
    keys: ['registrar', 'রেজিস্ট্রার', 'রেজিস্ট্রেশন', 'নিবন্ধন', 'দলিল নিবন্ধন', 'সাব-রেজিস্ট্রার', 'নতুন দলিল', 'দলিল রেজিস্ট্রি'],
    title: { bn: 'সাব-রেজিস্ট্রার (Registrar) সেকশন ব্যবহারের নিয়ম', en: 'How to Use Registrar Section' },
    steps: [
      { bn: '১. সাব-রেজিস্ট্রার পেজে প্লট নম্বর, বিক্রেতা, ক্রেতা ও দলিলের মূল্য নির্বাচন করুন।', en: '1. On the Registrar page, select the plot code, seller, buyer, and transaction price.' },
      { bn: '২. "রেজিস্টার ও সিল করুন" বাটনে ক্লিক করলে সিস্টেম স্বয়ংক্রিয়ভাবে ফ্রড রুলস চেক করে ক্রিপ্টোগ্রাফিক সিল তৈরি করবে।', en: '2. Click "Register & Seal" to run instant fraud rules and create a cryptographic digital seal.' },
      { bn: '৩. সিল নিবন্ধনের সাথে সাথে জমি লক হয়ে যাবে এবং ই-নামজারির জন্য অটোমেটিক ট্র্যাকিং টিকিট তৈরি হবে।', en: '3. The plot is instantly locked to prevent double-sale, and an e-mutation ticket is generated.' }
    ],
    action: { label: { bn: 'রেজিস্ট্রার পেজে যান →', en: 'Go to Registrar Page →' }, route: '/registrar' }
  },
  {
    keys: ['ব্যবহার', 'কীভাবে ব্যবহার', 'সেকশন', 'ফিচার', 'কন্টেন্ট', 'how to use', 'guide', 'মেনু', 'ওয়েবসাইট ব্যবহার', 'কাজে লাগবে', 'কি কি আছে', 'কীভাবে কাজ করে'],
    title: { bn: 'ভূমি লিপি ওয়েবসাইট ব্যবহারের পূর্ণাঙ্গ গাইড', en: 'Full Bhumi Lipi Usage Guide' },
    steps: [
      { bn: '• জমি দেখুন (#/check): যেকোনো প্লট কোড (যেমন DHK-UTT-0142) দিয়ে খতিয়ান, দাগ ও চার জরিপের অমিল যাচাই করুন।', en: '• Check Plot (#/check): Inspect land records, survey khatians, and discrepancies.' },
      { bn: '• দলিল যাচাই (#/verify): দলিলের কিউআর কোড বা সিল কোড দিয়ে সত্যতা প্রমাণ করুন।', en: '• Verify Deed (#/verify): Authenticate deed QR or 64-char seal fingerprint.' },
      { bn: '• সততা ও সুরক্ষা (#/integrity): পাবলিক মারকেল রুট ও স্বাধীন অফলাইন ভেরিফায়ার স্ক্রিপ্ট দেখুন।', en: '• Integrity (#/integrity): Review public Merkle roots and download offline verifier script.' },
      { bn: '• ই-নামজারি (#/mutation) ও ব্যাংক লিয়েন (#/bank): ট্র্যাকিং আইডি ও বন্ধক সংক্রান্ত তথ্য অনুসন্ধান করুন।', en: '• Mutation (#/mutation) & Bank (#/bank): Track approvals and check active liens.' },
      { bn: '• অ্যাটাক ল্যাব (#/lab): ৫টি সাধারণ ভূমি জালিয়াতি কীভাবে প্রযুক্তি দিয়ে আটকানো হয় তার লাইভ পরীক্ষা দেখুন।', en: '• Attack Lab (#/lab): Test 5 live land fraud simulations and defenses.' }
    ],
    action: { label: { bn: 'জমি দেখুন পেজে যান →', en: 'Go to Check Page →' }, route: '/check' }
  },
  {
    keys: ['মডেল', 'model', 'who are you', 'তুমি কে', 'কে বানিয়েছে', 'কার তৈরি', 'what model', 'ai model', 'কোন এআই', 'কোন মডেল'],
    title: { bn: 'ভূমি লিপি এআই মডেল (Bhumi Lipi AI Model)', en: 'Bhumi Lipi AI Model' },
    steps: [
      { bn: 'আমি "ভূমি লিপি এআই মডেল" (Bhumi Lipi AI Model)।', en: 'I am the Bhumi Lipi AI Model.' },
      { bn: 'আমি ভূমি লিপি প্ল্যাটফর্মের জমি, খতিয়ান, দলিল ও নামজারি রেকর্ড বিশ্লেষণ করার জন্য তৈরি বিশেষায়িত এআই।', en: 'I am a specialized AI built to analyze Bhumi Lipi land records, survey khatians, deeds, and mutations.' },
      { bn: 'আমি কোনো ব্যক্তিগত মতামত দিই না; শুধুমাত্র এই ওয়েবসাইটের ভূমিসেবা ও ভেরিফাইড রেজিস্ট্রি ডেটা প্রদানে সীমাবদ্ধ।', en: 'I do not provide personal opinions; I am strictly restricted to website features and verified registry data.' }
    ],
    action: { label: { bn: 'জমি দেখুন পেজে যান →', en: 'Go to Check Page →' }, route: '/check' }
  }
];

function getContextualTip(route) {
  switch (route) {
    case 'check':
      return {
        bn: 'আপনি জমি দেখুন পেজে আছেন। খতিয়ান, দাগ ও জরিপ রেকর্ডের অমিল বা লাল সতর্কতা আছে কি না তা দেখুন।',
        en: 'You are on Check page. Review survey records (CS/SA/RS/BS) and warning flags.'
      };
    case 'verify':
      return {
        bn: 'আপনি দলিল যাচাই পেজে আছেন। দলিলের কিউআর কোড স্ক্যান করুন অথবা সিল দিয়ে সত্যতা পরীক্ষা করুন।',
        en: 'You are on Verify page. Scan a QR code or inspect deed digital seals.'
      };
    case 'integrity':
      return {
        bn: 'আপনি সততা ও সুরক্ষা পেজে আছেন। মারকেল রুট, চেইন স্ট্যাটাস ও অফলাইন ভেরিফায়ার স্ক্রিপ্ট পরীক্ষা করতে পারেন।',
        en: 'You are on Integrity page. Inspect Merkle roots, block hash chains, and offline verifier.'
      };
    case 'registrar':
      return {
        bn: 'আপনি সাব-রেজিস্ট্রার পেজে আছেন। এখানে নতুন দলিল নিবন্ধন, ডিজিটাল সিল তৈরি ও জমি লক করার ডেমো দেখা যায়।',
        en: 'You are on Registrar page. Try deed registration, digital seal stamping, and parcel locking.'
      };
    case 'mutation':
      return {
        bn: 'আপনি নামজারি পেজে আছেন। আবেদনের অগ্রগতি দেখতে ট্র্যাকিং আইডি ব্যবহার করুন।',
        en: 'You are on Mutation page. Track application progress using the mutation tracking ID.'
      };
    case 'bank':
      return {
        bn: 'আপনি ব্যাংক লিয়েন পেজে আছেন। জমির ওপর কোনো ব্যাংক ঋণ বা বন্ধক বহাল রয়েছে কি না তা দেখুন।',
        en: 'You are on Bank page. Check active mortgage liens to prevent double financing.'
      };
    case 'lab':
      return {
        bn: 'আপনি অ্যাটাক ল্যাবে আছেন। ৫টি সাধারণ ভূমি জালিয়াতি কীভাবে প্রতিহত হয় তা সরাসরি দেখুন।',
        en: 'You are in Attack Lab. Test 5 real land fraud attempts and see them get blocked.'
      };
    case 'about':
      return {
        bn: 'আপনি পরিচিতি পেজে আছেন। ভূমি লিপির সামগ্রিক আর্কিটেকচার, টিম ও প্রযুক্তিগত দর্শন জানতে পারবেন।',
        en: 'You are on About page. Review the platform architecture, technical design, and background.'
      };
    default:
      return null;
  }
}

export function createAssistantEngine() {
  function getAnswer(rawText) {
    const q = (rawText || '').trim().toLowerCase();
    for (const item of KNOWLEDGE_BASE) {
      if (item.keys.some((k) => q.includes(k.toLowerCase()))) {
        return item;
      }
    }
    return {
      title: {
        bn: 'ভূমি লিপি এআই সহকারী সহায়িকা',
        en: 'Bhumi Lipi AI Assistant Guide'
      },
      steps: [
        {
          bn: 'আমি ভূমি লিপি প্ল্যাটফর্মের জমি যাচাই, খতিয়ান, দাগ, ডিজিটাল দলিল সিল, সততা ও সুরক্ষা (Integrity), নামজারি ও ব্যাংক লিয়েনের তথ্যে সাহায্য করতে প্রস্তুত।',
          en: 'I can assist with Bhumi Lipi land verification, survey khatians, deed seals, integrity proofs, mutations, and bank liens.'
        },
        {
          bn: 'ওয়েবসাইটের যেকোনো ফিচার ব্যবহারের নিয়ম জানতে প্রশ্ন করতে পারেন, অথবা নির্দিষ্ট জমির রেকর্ড দেখতে প্লট কোড (যেমন: DHK-UTT-0142) লিখুন।',
          en: 'Ask how to use any section of the website, or enter a plot code (e.g. DHK-UTT-0142) to inspect verified records.'
        }
      ],
      action: {
        label: { bn: 'জমি দেখুন পেজে যান →', en: 'Go to Check Page →' },
        route: '/check'
      }
    };
  }

  return {
    query: (text) => getAnswer(text),
    getContextTip: (route) => getContextualTip(route),
  };
}

let globalAssistantModal = null;
let globalAssistantToggle = null;

// Initialize the global floating assistant
export function initGlobalAssistant(ctx) {
  if (document.getElementById('ai-fab-launcher')) return;

  const engine = createAssistantEngine();
  let conversationHistory = [];

  // Floating Action Button (FAB)
  const fab = h('button', {
    id: 'ai-fab-launcher',
    class: 'ai-fab-btn noprint',
    type: 'button',
    'aria-label': T('ভূমি লিপি AI Assistant চালু করুন', 'Open Bhumi Lipi AI Assistant'),
    title: T('ভূমি লিপি AI Assistant', 'Bhumi Lipi AI Assistant'),
    onclick: () => {
      if (ctx && ctx.navigate) ctx.navigate('/ai');
      else toggleModal();
    }
  },
    icon('bot'),
    h('span', { class: 'fab-pulse-dot' }),
    h('span', { class: 'fab-hover-tip' }, T('এআই সহকারী', 'AI Assistant'))
  );

  // Modal Panel
  const panel = h('aside', {
    id: 'ai-chat-modal',
    class: 'ai-modal-panel noprint',
    'aria-hidden': 'true',
    'aria-label': T('ভূমি লিপি AI চ্যাট', 'Bhumi Lipi AI Chat')
  });

  document.body.append(fab, panel);
  globalAssistantModal = panel;
  globalAssistantToggle = toggleModal;
  window.openBhumiAssistant = (prefill) => {
    if (ctx && ctx.navigate) {
      ctx.navigate('/ai');
      return;
    }
    if (panel.getAttribute('aria-hidden') === 'true') toggleModal();
    if (prefill) {
      setTimeout(() => {
        const inp = panel.querySelector('.hero-ai-input');
        if (inp) { inp.value = prefill; }
      }, 100);
    }
  };

  function toggleModal() {
    const isHidden = panel.getAttribute('aria-hidden') === 'true';
    if (isHidden) {
      panel.setAttribute('aria-hidden', 'false');
      panel.classList.add('is-open');
      renderModalContent();
    } else {
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.remove('is-open');
    }
  }

  function renderModalContent() {
    clear(panel);
    const currentRoute = (location.hash.slice(1) || '/').split('/')[1] || 'home';
    const ctxTip = engine.getContextTip(currentRoute);

    // Modal Header
    const mHead = h('div', { class: 'ai-modal-header' },
      h('div', { class: 'ai-badge-group' },
        h('div', { class: 'ai-avatar-icon' }, icon('bot')),
        h('div', {},
          h('strong', { class: 'ai-header-title' }, T('ভূমি লিপি AI Assistant', 'Bhumi Lipi AI Assistant')),
          h('div', { class: 'ai-status-online' }, h('span', { class: 'status-dot-pulse' }), T('অনলাইন · সার্বক্ষণিক সহায়ক', 'Online · 24/7 Assistant')))),
      h('button', {
        class: 'ai-close-btn iconbtn sm',
        type: 'button',
        'aria-label': T('বন্ধ করুন', 'Close'),
        onclick: toggleModal
      }, icon('close'))
    );

    // Messages Container
    const msgList = h('div', { class: 'ai-modal-messages', id: 'ai-modal-msg-list' });

    // Initial greeting
    const nowTime = new Intl.DateTimeFormat(state.lang === 'bn' ? 'bn-BD' : 'en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date());

    msgList.append(
      h('div', { class: 'ai-bubble-wrap incoming' },
        h('div', { class: 'ai-bubble-avatar' }, icon('bot')),
        h('div', { class: 'ai-bubble-content' },
          h('div', { class: 'ai-bubble-text' },
            h('p', {}, T('নমস্কার! 👋 আমি ভূমি লিপি AI সহকারী (ভূমি লিপি এআই মডেল)।', 'Greetings! 👋 I am your Bhumi Lipi AI Assistant (Bhumi Lipi AI Model).')),
            h('p', {}, T('আমি আপনাকে প্ল্যাটফর্মের জমি যাচাই, খতিয়ান, দলিল, নামজারি ও ওয়েবসাইটের বিভিন্ন ফিচার ব্যবহারে সাহায্য করতে পারি।',
              'I can assist you with land records, deed verification, mutations, and how to use every feature of this website.')),
            ctxTip ? h('div', { class: 'ai-ctx-tip-pill' },
              icon('info'),
              h('span', {}, T(ctxTip.bn, ctxTip.en))) : null),
          h('div', { class: 'ai-bubble-time' }, nowTime)))
    );

    // Suggestion pills
    const pillsWrap = h('div', { class: 'ai-modal-pills' },
      QUICK_PROMPTS.map((p) =>
        h('button', {
          type: 'button',
          class: 'ai-chip',
          onclick: () => postUserQuery(T(p.bn, p.en))
        }, T(p.bn, p.en)))
    );
    msgList.append(pillsWrap);

    // Input Area
    const inputField = h('input', {
      type: 'text',
      class: 'hero-ai-input',
      placeholder: T('আপনার প্রশ্ন লিখুন (যেমন: DHK-UTT-0142 কেমন?)...', 'Ask a question (e.g. Is DHK-UTT-0142 safe?)...'),
      'aria-label': T('প্রশ্ন লিখুন', 'Type question')
    });

    const sendButton = h('button', {
      type: 'button',
      class: 'hero-ai-send-btn',
      'aria-label': T('পাঠান', 'Send'),
      onclick: () => {
        const text = inputField.value.trim();
        if (text) {
          postUserQuery(text);
          inputField.value = '';
        }
      }
    }, icon('send'));

    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendButton.click();
      }
    });

    const formArea = h('div', { class: 'ai-modal-footer' },
      h('div', { class: 'hero-ai-form' }, inputField, sendButton),
      h('div', { class: 'ai-disclaimer-note' },
        T('সার্বক্ষণিক তথ্য সহায়তা · ডিজিটাল ভূমি রেকর্ডের সাথে সংযুক্ত', 'Informational support · Grounded in verified land records'))
    );

    panel.append(mHead, msgList, formArea);
    setTimeout(() => inputField.focus(), 120);

    async function postUserQuery(userText) {
      const userBubbleTime = new Intl.DateTimeFormat(state.lang === 'bn' ? 'bn-BD' : 'en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(new Date());

      // Append user bubble
      msgList.append(
        h('div', { class: 'ai-bubble-wrap outgoing' },
          h('div', { class: 'ai-bubble-content' },
            h('div', { class: 'ai-bubble-text' }, userText),
            h('div', { class: 'ai-bubble-time' }, userBubbleTime)))
      );
      msgList.scrollTop = msgList.scrollHeight;

      // Temporary typing indicator
      const typingBubble = h('div', { class: 'ai-bubble-wrap incoming ai-typing' },
        h('div', { class: 'ai-bubble-avatar' }, icon('bot')),
        h('div', { class: 'ai-bubble-content' },
          h('div', { class: 'ai-bubble-text' },
            h('span', { class: 'ai-dot-flashing' }, T('চিন্তা করছে...', 'Thinking...')))));
      msgList.append(typingBubble);
      msgList.scrollTop = msgList.scrollHeight;

      // Try backend AI API first
      let answered = false;
      try {
        const resp = await fetch('/api/ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userText, history: conversationHistory })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.answer) {
            typingBubble.remove();
            conversationHistory.push({ role: 'user', text: userText });
            conversationHistory.push({ role: 'ai', text: data.answer });

            // Format markdown bold & lines
            const formatted = formatAnswerText(data.answer, data.plots, ctx, toggleModal);
            msgList.append(
              h('div', { class: 'ai-bubble-wrap incoming' },
                h('div', { class: 'ai-bubble-avatar' }, icon('bot')),
                h('div', { class: 'ai-bubble-content' },
                  h('div', { class: 'ai-bubble-text' }, formatted),
                  h('div', { class: 'ai-bubble-time' }, userBubbleTime)))
            );
            msgList.scrollTop = msgList.scrollHeight;
            answered = true;
          }
        }
      } catch (err) {
        // Fall back to offline engine
      }

      if (!answered) {
        typingBubble.remove();
        const answer = engine.query(userText);
        conversationHistory.push({ role: 'user', text: userText });
        conversationHistory.push({ role: 'ai', text: answer.title.bn });

        const botBubble = h('div', { class: 'ai-bubble-wrap incoming' },
          h('div', { class: 'ai-bubble-avatar' }, icon('bot')),
          h('div', { class: 'ai-bubble-content' },
            h('div', { class: 'ai-bubble-text' },
              h('strong', { class: 'bot-resp-title' }, T(answer.title.bn, answer.title.en)),
              answer.steps.map((st) => h('p', { class: 'bot-resp-p' }, T(st.bn, st.en))),
              h('div', { class: 'bot-action-wrap' },
                h('a', {
                  href: '#' + answer.action.route,
                  class: 'btn sm ghost',
                  onclick: (e) => {
                    e.preventDefault();
                    toggleModal();
                    ctx.navigate(answer.action.route);
                  }
                }, icon('arrow'), T(answer.action.label.bn, answer.action.label.en)))),
            h('div', { class: 'ai-bubble-time' }, userBubbleTime))
        );
        msgList.append(botBubble);
        msgList.scrollTop = msgList.scrollHeight;
      }
    }
  }
}

function formatAnswerText(rawText, plots, ctx, closeModal) {
  const container = h('div', { class: 'ai-gen-answer' });
  const lines = rawText.split('\n');

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      container.append(h('div', { style: 'height: 6px;' }));
      return;
    }
    const p = h('p', { class: 'bot-resp-p' });
    // Replace **bold**
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach((part) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        p.append(h('strong', {}, part.slice(2, -2)));
      } else {
        p.append(part);
      }
    });
    container.append(p);
  });

  // If specific plots are referenced, add direct link buttons
  if (Array.isArray(plots) && plots.length > 0) {
    const plotLinks = h('div', { class: 'bot-action-wrap', style: 'display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;' });
    plots.forEach((pid) => {
      plotLinks.append(
        h('a', {
          href: '#/check/' + encodeURIComponent(pid),
          class: 'btn sm ghost',
          onclick: (e) => {
            e.preventDefault();
            if (closeModal) closeModal();
            ctx.navigate('/check/' + encodeURIComponent(pid));
          }
        }, icon('search'), `${pid} ${T('রেকর্ড দেখুন →', 'View Record →')}`)
      );
    });
    container.append(plotLinks);
  }

  return container;
}

// Dedicated AI Assistant Section component (embedded on pages like Home)
export function renderAssistantSection(ctx) {
  const engine = createAssistantEngine();
  let conversationHistory = [];

  const msgList = h('div', { class: 'ai-section-messages', id: 'ai-sec-msg-list' });

  function addWelcome() {
    clear(msgList);
    const nowStr = new Intl.DateTimeFormat(state.lang === 'bn' ? 'bn-BD' : 'en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date());

    msgList.append(
      h('div', { class: 'ai-bubble-wrap incoming' },
        h('div', { class: 'ai-bubble-avatar' }, icon('bot')),
        h('div', { class: 'ai-bubble-content' },
          h('div', { class: 'ai-bubble-text' },
            h('p', {}, T('নমস্কার! 👋 আমি ভূমি লিপি এআই সহকারী (ভূমি লিপি এআই মডেল)।', 'Greetings! 👋 I am your Bhumi Lipi AI Assistant (Bhumi Lipi AI Model).')),
            h('p', {}, T('আমি ভূমি লিপি রেজিস্ট্রি ডাটাবেস থেকে যেকোনো জমির সত্যতা, খতিয়ান, নামজারি ও দলিলের সুনির্দিষ্ট তথ্য প্রদান করি। আমি শুধুমাত্র এই ওয়েবসাইটের তথ্যে সীমাবদ্ধ এবং কোনো অতিরিক্ত মতামত প্রদান করি না।',
              'I provide precise facts from the Bhumi Lipi registry database on plot safety, khatians, mutations, and deeds. Strictly restricted to website land records without external opinions.')),
            h('div', { class: 'ai-ctx-tip-pill' },
              icon('info'),
              h('span', {}, T('টিপ: নির্দিষ্ট প্লট নম্বর (যেমন DHK-UTT-0142) লিখে প্রশ্ন করলে সরাসরি ডাটাবেসের রেকর্ড বিশ্লেষণ করে উত্তর দেওয়া হবে।',
                'Tip: Ask about any plot code (e.g. DHK-UTT-0142) to get real-time verified registry facts.')))),
          h('div', { class: 'ai-bubble-time' }, nowStr)))
    );
  }
  addWelcome();

  // Suggestion chips
  const chipsWrap = h('div', { class: 'ai-modal-pills', style: 'margin-bottom: 14px;' },
    [
      { bn: 'DHK-UTT-0142 জমি কি নিরাপদ?', en: 'Is plot DHK-UTT-0142 safe?' },
      { bn: 'DHK-GUL-0309 কেমন জমি?', en: 'Check plot DHK-GUL-0309 status' },
      { bn: 'জমি কেনার আগে কী কী যাচাই করতে হয়?', en: 'What to verify before buying land?' },
      { bn: 'নামজারি প্রক্রিয়া কীভাবে কাজ করে?', en: 'How does mutation work?' },
      { bn: 'জাল দলিল চেনার সহজ উপায় কী?', en: 'How to detect fake deeds?' },
    ].map((p) =>
      h('button', {
        type: 'button',
        class: 'ai-chip',
        onclick: () => postQuery(T(p.bn, p.en))
      }, icon('search'), ' ', T(p.bn, p.en)))
  );

  const inputField = h('input', {
    type: 'text',
    class: 'hero-ai-input',
    id: 'ai-section-input',
    placeholder: T('আপনার প্রশ্ন লিখুন (যেমন: DHK-UTT-0142 জমি কেনা কি ঠিক হবে?)...', 'Ask a question (e.g. Is DHK-UTT-0142 safe to buy?)...'),
    'aria-label': T('প্রশ্ন লিখুন', 'Type question')
  });

  const sendButton = h('button', {
    type: 'button',
    class: 'hero-ai-send-btn',
    'aria-label': T('পাঠান', 'Send'),
    onclick: () => {
      const val = inputField.value.trim();
      if (val) {
        postQuery(val);
        inputField.value = '';
      }
    }
  }, icon('send'));

  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendButton.click();
    }
  });

  async function postQuery(userText) {
    const bubbleTime = new Intl.DateTimeFormat(state.lang === 'bn' ? 'bn-BD' : 'en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date());

    msgList.append(
      h('div', { class: 'ai-bubble-wrap outgoing' },
        h('div', { class: 'ai-bubble-content' },
          h('div', { class: 'ai-bubble-text' }, userText),
          h('div', { class: 'ai-bubble-time' }, bubbleTime)))
    );
    msgList.scrollTop = msgList.scrollHeight;

    const typing = h('div', { class: 'ai-bubble-wrap incoming ai-typing' },
      h('div', { class: 'ai-bubble-avatar' }, icon('bot')),
      h('div', { class: 'ai-bubble-content' },
        h('div', { class: 'ai-bubble-text' },
          h('span', { class: 'ai-dot-flashing' }, T('এআই চিন্তা করছে...', 'AI is analyzing...')))));
    msgList.append(typing);
    msgList.scrollTop = msgList.scrollHeight;

    let answered = false;
    try {
      const resp = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText, history: conversationHistory })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.answer) {
          typing.remove();
          conversationHistory.push({ role: 'user', text: userText });
          conversationHistory.push({ role: 'ai', text: data.answer });

          const formatted = formatAnswerText(data.answer, data.plots, ctx);
          msgList.append(
            h('div', { class: 'ai-bubble-wrap incoming' },
              h('div', { class: 'ai-bubble-avatar' }, icon('bot')),
              h('div', { class: 'ai-bubble-content' },
                h('div', { class: 'ai-bubble-text' }, formatted),
                h('div', { class: 'ai-bubble-time' }, bubbleTime)))
          );
          msgList.scrollTop = msgList.scrollHeight;
          answered = true;
        }
      }
    } catch {}

    if (!answered) {
      typing.remove();
      const ans = engine.query(userText);
      conversationHistory.push({ role: 'user', text: userText });
      conversationHistory.push({ role: 'ai', text: ans.title.bn });

      msgList.append(
        h('div', { class: 'ai-bubble-wrap incoming' },
          h('div', { class: 'ai-bubble-avatar' }, icon('bot')),
          h('div', { class: 'ai-bubble-content' },
            h('div', { class: 'ai-bubble-text' },
              h('strong', { class: 'bot-resp-title' }, T(ans.title.bn, ans.title.en)),
              ans.steps.map((st) => h('p', { class: 'bot-resp-p' }, T(st.bn, st.en))),
              h('div', { class: 'bot-action-wrap' },
                h('a', {
                  href: '#' + ans.action.route,
                  class: 'btn sm ghost',
                  onclick: (e) => {
                    e.preventDefault();
                    ctx.navigate(ans.action.route);
                  }
                }, icon('arrow'), T(ans.action.label.bn, ans.action.label.en)))),
            h('div', { class: 'ai-bubble-time' }, bubbleTime)))
      );
      msgList.scrollTop = msgList.scrollHeight;
    }
  }

  // Section container
  return h('section', { class: 'band ai-section', id: 'ai-assistant-section' },
    h('div', { class: 'wrap' },
      h('div', { class: 'sect-head' },
        h('div', { class: 'eyebrow' }, icon('shield'), 'Smart LandTech 2026 · স্মার্ট এআই ভূমি সহকারী'),
        h('h2', {}, T('স্মার্ট এআই ভূমি সহকারী', 'Smart AI Land Assistant')),
        h('p', {}, T('জমি ক্রয়, খতিয়ান, নামজারি বা দলিল যাচাই নিয়ে যেকোনো প্রশ্ন করুন। অফিসিয়াল রেজিস্ট্রি ডাটাবেস ও স্মার্ট এআই-এর সরাসরি সমন্বিত উত্তর পান।',
          'Ask any question regarding land records, survey khatians, mutation tracking, or deed verification.'))),
      h('div', { class: 'ai-section-console' },
        h('div', { class: 'ai-console-header' },
          h('div', { class: 'ai-badge-group' },
            h('div', { class: 'ai-avatar-icon' }, icon('bot')),
            h('div', {},
              h('strong', { class: 'ai-header-title' }, T('ভূমি লিপি AI Assistant', 'Bhumi Lipi AI Assistant')),
              h('div', { class: 'ai-status-online' },
                h('span', { class: 'status-dot-pulse' }),
                T('অনলাইন · এআই সহকারী সক্রিয়', 'Online · AI Assistant Active')))),
          h('button', {
            type: 'button',
            class: 'btn sm ghost',
            onclick: () => { conversationHistory = []; addWelcome(); }
          }, icon('clock'), T('নতুন আলাপ', 'New chat'))),
        chipsWrap,
        msgList,
        h('div', { class: 'ai-console-footer' },
          h('div', { class: 'hero-ai-form' }, inputField, sendButton),
          h('div', { class: 'ai-disclaimer-note' },
            T('আইনি সচেতনতামূলক এআই পরামর্শ · জমি কেনা বা টাকা দেওয়ার আগে মূল দলিল ও আইনজীবীর মতামত নিশ্চিত করুন।',
              'Informational AI advice · Always verify original physical documents before financial transactions.'))))));
}
