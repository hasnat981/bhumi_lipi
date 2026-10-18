// Dedicated AI Assistant View (আলাপ / Chat page)
// Fully matches the Bhumi Lipi AI assistant design without using third-party vendor branding.
import { h, icon, clear } from '../dom.js';
import { T, state, fmtNum } from '../i18n.js';
import { api } from '../api.js';
import { statusBadge } from './ui.js';
import { createAssistantEngine } from '../components/ai-assistant.js';

const FALLBACK_PLOTS = [
  { plot_id: 'DHK-UTT-0142', mouza: 'উত্তরা', area_decimal: 5.0, owner: 'হাসান মাহমুদ', verdict: 'green' },
  { plot_id: 'DHK-UTT-0143', mouza: 'উত্তরা', area_decimal: 7.5, owner: 'মাহবুব জামান', verdict: 'green' },
  { plot_id: 'DHK-GUL-0309', mouza: 'গুলশান', area_decimal: 6.0, owner: 'শাহেদ করিম', verdict: 'amber', locked: 1 },
  { plot_id: 'CTG-PAT-0120', mouza: 'পতেঙ্গা', area_decimal: 2.5, owner: 'নুরুল হক', verdict: 'red' },
  { plot_id: 'CTG-SAD-0877', mouza: 'সদরঘাট', area_decimal: 3.0, owner: 'আহমেদ কবির', verdict: 'green' },
  { plot_id: 'DHK-MIR-0451', mouza: 'মিরপুর', area_decimal: 4.2, owner: 'তানভীর ইসলাম', verdict: 'green' },
  { plot_id: 'DHK-SAV-0505', mouza: 'সাভার', area_decimal: 8.0, owner: 'রফিকুল ইসলাম', verdict: 'amber' },
  { plot_id: 'KHL-DUM-0033', mouza: 'ডুমুরিয়া', area_decimal: 12.0, owner: 'সরকারি খাস', verdict: 'red', khas: 1 },
  { plot_id: 'RAJ-BOG-0066', mouza: 'বগুড়া রোড', area_decimal: 5.5, owner: 'ফারহানা ইয়াসমিন', verdict: 'green' },
  { plot_id: 'RAJ-NAT-0418', mouza: 'নাটোর', area_decimal: 9.0, owner: 'সেলিম রেজা', verdict: 'amber' },
  { plot_id: 'SYL-ZKJ-0210', mouza: 'জকিগঞ্জ', area_decimal: 6.4, owner: 'কবির আহমেদ', verdict: 'red', lien: 1 },
];

const QUICK_SAMPLES = [
  { id: 'DHK-UTT-0142', labelBn: 'DHK-UTT-0142 (উত্তরা)', labelEn: 'DHK-UTT-0142 (Uttara)' },
  { id: 'DHK-GUL-0309', labelBn: 'DHK-GUL-0309 (গুলশান)', labelEn: 'DHK-GUL-0309 (Gulshan)' },
  { id: 'CTG-PAT-0120', labelBn: 'CTG-PAT-0120 (পতেঙ্গা)', labelEn: 'CTG-PAT-0120 (Patenga)' },
  { id: 'KHL-DUM-0033', labelBn: 'KHL-DUM-0033 (খাস)', labelEn: 'KHL-DUM-0033 (Khas)' },
  { id: 'SYL-ZKJ-0210', labelBn: 'SYL-ZKJ-0210 (বন্ধক)', labelEn: 'SYL-ZKJ-0210 (Lien)' },
];

export default async function aiView(_, ctx) {
  const engine = createAssistantEngine();
  let conversationHistory = [];
  let selectedPlot = '';
  let allPlots = [...FALLBACK_PLOTS];

  // Fetch real plots from server registry
  api('/plots').then((plots) => {
    if (Array.isArray(plots) && plots.length > 0) {
      allPlots = plots;
      if (searchInput === document.activeElement) {
        renderDropdown(searchInput.value);
      }
      if (selectedPlot) {
        renderActiveCard();
      }
    }
  }).catch(() => {});

  const msgStream = h('div', { class: 'ai-messages-stream', id: 'ai-view-msg-stream' });

  function addWelcome() {
    clear(msgStream);
    const welcomeBubble = h('div', { class: 'ai-msg-row assistant' },
      h('div', { class: 'ai-response-card' },
        h('div', { class: 'ai-response-label' }, T('ভূমি লিপি এআই মডেল', 'Bhumi Lipi AI Model')),
        h('div', { class: 'ai-response-body' },
          h('p', {}, T('নমস্কার! আমি "ভূমি লিপি এআই মডেল"। আমি আপনাকে ভূমি লিপি ওয়েবসাইটের জমি, খতিয়ান, দলিল, নামজারি ও প্ল্যাটফর্মের বিভিন্ন সেকশন ব্যবহারের বিষয়ে সাহায্য করতে প্রস্তুত।',
            'Hello! I am the Bhumi Lipi AI Model. I am here to assist with Bhumi Lipi land records, survey khatians, deeds, mutations, and guiding you through every section of the website.')),
          h('p', {}, T('নির্দিষ্ট প্লটের তথ্য জানতে প্লট কোড (যেমন DHK-UTT-0142) লিখুন, অথবা কোনো সেকশন কীভাবে ব্যবহার করবেন তা জানতে প্রশ্ন করুন।',
            'Enter a plot code (e.g. DHK-UTT-0142) to inspect records, or ask how to use any section of this platform.'))),
        h('div', { class: 'ai-response-actions' },
          h('button', {
            type: 'button',
            class: 'ai-action-btn',
            onclick: (e) => copyText('নমস্কার! আমি "ভূমি লিপি এআই মডেল"।', e.currentTarget)
          }, icon('copy'), ' ', T('কপি', 'Copy'))))
    );
    msgStream.append(welcomeBubble);
  }

  addWelcome();

  // Input & Form elements
  const inputEl = h('textarea', {
    class: 'ai-input-field',
    rows: 1,
    placeholder: T('আপনার প্রশ্ন বাংলায় লিখুন...', 'Type your question here...'),
    'aria-label': T('আপনার প্রশ্ন লিখুন', 'Type your question')
  });

  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  const sendBtn = h('button', {
    type: 'button',
    class: 'ai-send-btn-pill',
    'aria-label': T('পাঠান', 'Send'),
    onclick: () => {
      const q = inputEl.value.trim();
      if (q) {
        postQuery(q);
        inputEl.value = '';
        inputEl.style.height = 'auto';
      }
    }
  }, icon('arrow'), ' ', T('পাঠান', 'Send'));

  const inputForm = h('div', { class: 'ai-input-form-box' }, inputEl, sendBtn);

  // Sidebar Direct Plot Search elements
  const searchInput = h('input', {
    type: 'text',
    class: 'ai-plot-search-input',
    placeholder: T('প্লট কোড বা মৌজা খুঁজুন...', 'Search plot code or mouza...'),
    'aria-label': T('প্লট খুঁজুন', 'Search plot'),
    autocapitalize: 'characters',
    spellcheck: 'false',
    autocomplete: 'off'
  });

  const clearBtn = h('button', {
    type: 'button',
    class: 'ai-plot-clear-btn',
    'aria-label': T('মুছুন', 'Clear'),
    style: 'display: none;',
    onclick: (e) => {
      e.stopPropagation();
      selectPlot('');
    }
  }, icon('x'));

  const searchBar = h('div', { class: 'ai-plot-search-bar' },
    h('span', { class: 'ai-plot-search-icon' }, icon('search')),
    searchInput,
    clearBtn
  );

  const dropdownEl = h('div', {
    class: 'ai-plot-dropdown',
    role: 'listbox',
    'aria-label': T('প্লটের তালিকা', 'Plot results')
  });
  dropdownEl.style.display = 'none';

  const searchWrap = h('div', { class: 'ai-plot-search-wrap' }, searchBar, dropdownEl);

  const activePlotCard = h('div', { class: 'ai-plot-selected-container' });

  const quickChipsWrap = h('div', { class: 'ai-plot-quick-chips' },
    QUICK_SAMPLES.map((s) => h('button', {
      type: 'button',
      class: 'ai-plot-chip',
      'data-pid': s.id,
      onclick: () => selectPlot(s.id)
    }, T(s.labelBn, s.labelEn)))
  );

  function updateChipHighlights() {
    quickChipsWrap.querySelectorAll('.ai-plot-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.getAttribute('data-pid') === selectedPlot);
    });
  }

  function renderDropdown(query) {
    clear(dropdownEl);
    const q = (query || '').trim().toLowerCase();
    let matches = [];
    if (!q) {
      matches = allPlots.slice(0, 6);
    } else {
      matches = allPlots.filter((p) => {
        const pid = (p.plot_id || '').toLowerCase();
        const mouza = (p.mouza || '').toLowerCase();
        const owner = (p.owner || '').toLowerCase();
        return pid.includes(q) || mouza.includes(q) || owner.includes(q);
      }).slice(0, 8);
    }

    if (matches.length === 0 && q) {
      const customCode = q.toUpperCase();
      dropdownEl.append(
        h('div', {
          class: 'ai-plot-dropdown-item',
          onmousedown: (e) => {
            e.preventDefault();
            selectPlot(customCode);
          }
        },
          h('div', { class: 'ai-plot-dropdown-item-top' },
            h('span', { class: 'mono bold' }, customCode),
            h('span', { class: 'chip sm' }, T('কাস্টম প্লট', 'Custom plot'))
          ),
          h('div', { class: 'ai-plot-dropdown-item-sub' },
            T('এই প্লট কোড নির্বাচন করতে ক্লিক করুন', 'Click to select this plot code'))
        )
      );
    } else {
      matches.forEach((p) => {
        const isSel = p.plot_id === selectedPlot;
        const item = h('div', {
          class: 'ai-plot-dropdown-item' + (isSel ? ' selected' : ''),
          role: 'option',
          onmousedown: (e) => {
            e.preventDefault();
            selectPlot(p.plot_id);
          }
        },
          h('div', { class: 'ai-plot-dropdown-item-top' },
            h('span', { class: 'mono bold' }, p.plot_id),
            p.verdict ? statusBadge(p.verdict) : null
          ),
          h('div', { class: 'ai-plot-dropdown-item-sub' },
            `${p.mouza || ''} · ${fmtNum(p.area_decimal || 0)} ${T('শতাংশ', 'decimal')}${p.owner ? ' · ' + p.owner : ''}`,
            p.locked ? h('span', { class: 'chip amber sm', style: 'margin-left: 4px;' }, icon('lock'), T('লক', 'Locked')) : null,
            p.lien ? h('span', { class: 'chip red sm', style: 'margin-left: 4px;' }, icon('bank'), T('বন্ধক', 'Lien')) : null,
            p.khas ? h('span', { class: 'chip red sm', style: 'margin-left: 4px;' }, T('খাস', 'Khas')) : null
          )
        );
        dropdownEl.append(item);
      });
    }
  }

  function selectPlot(plotId) {
    selectedPlot = (plotId || '').trim().toUpperCase();
    if (selectedPlot) {
      searchInput.value = selectedPlot;
      clearBtn.style.display = 'inline-flex';
    } else {
      searchInput.value = '';
      clearBtn.style.display = 'none';
    }
    dropdownEl.style.display = 'none';
    renderActiveCard();
    updateChipHighlights();
  }

  function renderActiveCard() {
    clear(activePlotCard);
    if (selectedPlot) {
      const p = allPlots.find((x) => x.plot_id === selectedPlot) || {
        plot_id: selectedPlot,
        mouza: T('অনিবন্ধিত / কাস্টম', 'Unregistered / Custom'),
        area_decimal: 0,
        owner: '',
        verdict: 'green'
      };

      const card = h('div', { class: 'ai-plot-selected-card' },
        h('div', { class: 'ai-plot-selected-head' },
          h('span', { class: 'ai-plot-selected-id' }, p.plot_id),
          p.verdict ? statusBadge(p.verdict) : null,
          h('button', {
            type: 'button',
            class: 'btn sm ghost',
            style: 'padding: 4px 8px; font-size: 12px;',
            'aria-label': T('প্লট নির্বাচন বাতিল', 'Clear plot selection'),
            onclick: () => selectPlot('')
          }, icon('x'), ' ', T('মুছুন', 'Clear'))
        ),
        h('div', { class: 'ai-plot-selected-meta' },
          p.mouza ? h('span', {}, p.mouza) : null,
          p.area_decimal ? h('span', {}, `· ${fmtNum(p.area_decimal)} ${T('শতাংশ', 'decimal')}`) : null,
          p.owner ? h('span', {}, `· ${p.owner}`) : null,
          p.locked ? h('span', { class: 'chip amber sm' }, icon('lock'), T('নামজারি বাকি · লক', 'Locked')) : null,
          p.lien ? h('span', { class: 'chip red sm' }, icon('bank'), T('ব্যাংক বন্ধক', 'Lien')) : null,
          p.khas ? h('span', { class: 'chip red sm' }, T('খাস জমি', 'Khas land')) : null
        ),
        h('div', { class: 'ai-plot-selected-hint' },
          icon('check'), ' ',
          T('এআই এখন এই প্লটের সিল ও রেকর্ড অনুযায়ী উত্তর দেবে', 'AI is analyzing this plot’s verified records'))
      );

      const actions = h('div', { class: 'ai-plot-actions' },
        h('button', {
          type: 'button',
          class: 'btn',
          style: 'width: 100%; justify-content: center;',
          onclick: () => {
            const q = T(
              `প্লট ${selectedPlot}-এর বর্তমান অবস্থা, সিল ও মালিকানার বিবরণ জানান।`,
              `Tell me about plot ${selectedPlot}'s status, seals, and ownership records.`
            );
            postQuery(q);
          }
        }, icon('arrow'), ' ', T('এই প্লট নিয়ে এআই-কে জিজ্ঞেস করুন', 'Ask AI about this plot')),
        h('button', {
          type: 'button',
          class: 'btn ghost',
          style: 'width: 100%; justify-content: center;',
          onclick: () => {
            ctx.navigate('/check/' + encodeURIComponent(selectedPlot));
          }
        }, icon('search'), ' ', T('জমি দেখুন পাতায় যান', 'Go to Check plot page'))
      );

      activePlotCard.append(card, actions);
    } else {
      const emptyBox = h('div', { class: 'ai-plot-empty-notice' },
        h('div', { class: 'muted small', style: 'font-weight: 600;' },
          T('— কোনো নির্দিষ্ট প্লট নির্বাচন করা নেই —', '— No specific plot selected —')),
        h('p', { class: 'muted small', style: 'margin-top: 4px; font-size: 12px; line-height: 1.4;' },
          T('উপরে সরাসরি যেকোনো প্লট সার্চ করুন অথবা নিচের নমুনা থেকে বেছে নিন।',
            'Search any plot directly above or pick a sample below.'))
      );
      const allCheckBtn = h('button', {
        type: 'button',
        class: 'btn ghost',
        style: 'margin-top: 14px; width: 100%; justify-content: center;',
        onclick: () => ctx.navigate('/check')
      }, icon('search'), ' ', T('সব প্লট যাচাই পাতায় যান', 'Go to Check plots page'));

      activePlotCard.append(emptyBox, allCheckBtn);
    }
  }

  // Bind search input events
  searchInput.addEventListener('input', () => {
    dropdownEl.style.display = 'flex';
    renderDropdown(searchInput.value);
    clearBtn.style.display = searchInput.value.trim() ? 'inline-flex' : (selectedPlot ? 'inline-flex' : 'none');
  });

  searchInput.addEventListener('focus', () => {
    dropdownEl.style.display = 'flex';
    renderDropdown(searchInput.value);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = searchInput.value.trim().toUpperCase();
      if (val) {
        selectPlot(val);
      }
    } else if (e.key === 'Escape') {
      dropdownEl.style.display = 'none';
    }
  });

  const onDocClick = (e) => {
    if (!searchWrap.contains(e.target)) {
      dropdownEl.style.display = 'none';
    }
  };
  document.addEventListener('click', onDocClick);
  if (ctx && ctx.onLeave) {
    ctx.onLeave(() => document.removeEventListener('click', onDocClick));
  }

  // Initial render of active card
  renderActiveCard();

  const sidebar = h('aside', { class: 'ai-sidebar-col' },
    h('div', { class: 'ai-sidebar-card' },
      h('h3', {}, T('কোন প্লট নিয়ে জানতে চান?', 'Which plot do you want to inquire about?')),
      h('p', { class: 'muted small', style: 'margin-top: 6px; line-height: 1.55;' },
        T('সরাসরি প্লট খুঁজুন বা বেছে নিন। এআই সেই জমির সিল, মালিক, বন্ধক ও নামজারির তথ্য দেখে উত্তর দেবে।',
          'Search or select a plot directly. AI will analyze its seals, owner, liens, and mutation history to answer.')),
      searchWrap,
      quickChipsWrap,
      activePlotCard),
    h('div', { class: 'ai-sidebar-card', style: 'margin-top: 18px;' },
      h('h3', {}, T('সহায়তার ক্ষেত্র ও গোপনীয়তা', 'Assistance Scope & Privacy')),
      h('p', { class: 'muted small', style: 'margin-top: 8px; line-height: 1.6;' },
        T('ভূমি লিপি এআই মডেল ওয়েবসাইট ব্যবহার ও জমি-রেজিস্ট্রি সংক্রান্ত তথ্য প্রদানে নিবেদিত। অপ্রাসঙ্গিক বাহ্যিক বিষয়ে মতামত প্রদান করা হয় না। আপনার প্রশ্ন কোথাও সংরক্ষণ করা হয় না।',
          'Powered by Bhumi Lipi AI Model for site guidance and verified land registry records. Avoids unrelated external opinions. Inquiries are private and not stored.')))
  );

  async function postQuery(text) {
    // Append user message
    msgStream.append(
      h('div', { class: 'ai-msg-row user' },
        h('div', { class: 'ai-user-bubble' }, text))
    );
    msgStream.scrollTop = msgStream.scrollHeight;

    // Typing bubble
    const typing = h('div', { class: 'ai-msg-row assistant ai-typing' },
      h('div', { class: 'ai-response-card' },
        h('div', { class: 'ai-response-label' }, T('ভূমি লিপি এআই মডেল', 'Bhumi Lipi AI Model')),
        h('span', { class: 'ai-dot-flashing' }, T('এআই চিন্তা করছে...', 'AI is analyzing...'))));
    msgStream.append(typing);
    msgStream.scrollTop = msgStream.scrollHeight;

    let answered = false;
    try {
      const payload = { question: text, history: conversationHistory };
      if (selectedPlot) payload.plot_id = selectedPlot;

      const resp = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.answer) {
          typing.remove();
          conversationHistory.push({ role: 'user', text });
          conversationHistory.push({ role: 'ai', text: data.answer });

          appendAssistantReply(data.answer, data.plots);
          answered = true;
        }
      }
    } catch {}

    if (!answered) {
      typing.remove();
      const ans = engine.query(text);
      conversationHistory.push({ role: 'user', text });
      conversationHistory.push({ role: 'ai', text: ans.title.bn });

      const replyCard = h('div', { class: 'ai-msg-row assistant' },
        h('div', { class: 'ai-response-card' },
          h('div', { class: 'ai-response-label' }, T('ভূমি লিপি এআই মডেল', 'Bhumi Lipi AI Model')),
          h('div', { class: 'ai-response-body' },
            h('strong', { class: 'bot-resp-title' }, T(ans.title.bn, ans.title.en)),
            ans.steps.map((st) => h('p', {}, T(st.bn, st.en)))),
          h('div', { class: 'ai-response-actions' },
            h('button', {
              type: 'button',
              class: 'ai-action-btn',
              onclick: (e) => copyText(T(ans.title.bn, ans.title.en), e.currentTarget)
            }, icon('copy'), ' ', T('কপি', 'Copy')),
            h('a', {
              href: '#' + ans.action.route,
              class: 'ai-action-btn',
              onclick: (e) => {
                e.preventDefault();
                ctx.navigate(ans.action.route);
              }
            }, icon('arrow'), ' ', T(ans.action.label.bn, ans.action.label.en))))
      );
      msgStream.append(replyCard);
      msgStream.scrollTop = msgStream.scrollHeight;
    }
  }

  function appendAssistantReply(rawAnswer, plots) {
    const bodyEl = h('div', { class: 'ai-response-body' });
    const lines = rawAnswer.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        bodyEl.append(h('div', { style: 'height: 6px;' }));
        return;
      }
      const p = h('p', {});
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      parts.forEach((part) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          p.append(h('strong', {}, part.slice(2, -2)));
        } else {
          p.append(part);
        }
      });
      bodyEl.append(p);
    });

    const actionsWrap = h('div', { class: 'ai-response-actions' },
      h('button', {
        type: 'button',
        class: 'ai-action-btn',
        onclick: (e) => copyText(rawAnswer, e.currentTarget)
      }, icon('copy'), ' ', T('কপি', 'Copy'))
    );

    if (Array.isArray(plots) && plots.length > 0) {
      plots.forEach((pid) => {
        actionsWrap.append(
          h('a', {
            href: '#/check/' + encodeURIComponent(pid),
            class: 'ai-action-btn',
            onclick: (e) => {
              e.preventDefault();
              ctx.navigate('/check/' + encodeURIComponent(pid));
            }
          }, icon('search'), ' ', `${pid} ${T('রেকর্ড দেখুন →', 'View Record →')}`)
        );
      });
    }

    const replyEl = h('div', { class: 'ai-msg-row assistant' },
      h('div', { class: 'ai-response-card' },
        h('div', { class: 'ai-response-label' }, T('ভূমি লিপি এআই মডেল', 'Bhumi Lipi AI Model')),
        bodyEl,
        actionsWrap)
    );

    msgStream.append(replyEl);
    msgStream.scrollTop = msgStream.scrollHeight;
  }

  function copyText(str, btn) {
    navigator.clipboard?.writeText(str).then(() => {
      const origText = btn.lastChild?.textContent;
      if (btn.lastChild) btn.lastChild.textContent = ' ' + T('কপি হয়েছে!', 'Copied!');
      setTimeout(() => {
        if (btn.lastChild && origText) btn.lastChild.textContent = origText;
      }, 1500);
    }).catch(() => {});
  }

  // Left chat column
  const chatCol = h('div', { class: 'ai-chat-column' },
    h('div', { class: 'ai-view-head' },
      h('h2', { class: 'ai-view-title' }, T('আলাপ', 'Conversation')),
      h('button', {
        type: 'button',
        class: 'btn sm ghost',
        onclick: () => {
          conversationHistory = [];
          addWelcome();
        }
      }, icon('clock'), ' ', T('নতুন আলাপ', 'New chat'))),
    msgStream,
    inputForm
  );

  return h('div', { class: 'wrap', style: 'padding-top: 24px; padding-bottom: 60px;' },
    h('div', { class: 'ai-view-layout' }, chatCol, sidebar));
}
