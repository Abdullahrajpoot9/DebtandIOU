// INITIAL DATA & SETUP
const STORAGE_KEY = 'khata_book_pakistan_v1';

const sampleEntries = [
  {
    id: 'sample-1',
    person: 'Ali Raza',
    type: 'owes-me',
    amount: 1500,
    paidAmount: 0,
    category: 'Khana / Resturant',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    notes: 'Karahi dinner ka bill',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    person: 'Usman Ghani',
    type: 'i-owe',
    amount: 600,
    paidAmount: 0,
    category: 'Safar / Petrol',
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    notes: 'Bike petrol sharing',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-3',
    person: 'Hamza Khan',
    type: 'owes-me',
    amount: 5000,
    paidAmount: 2000,
    category: 'Udhari / Cash Udhar',
    dueDate: '',
    notes: 'Emergency cash madad',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-4',
    person: 'Fatima Malik',
    type: 'i-owe',
    amount: 12000,
    paidAmount: 12000,
    category: 'Ghar / Bijli / Kiraya',
    dueDate: '',
    notes: 'Bijli bill contribution',
    createdAt: new Date().toISOString()
  }
];

let entries = [];
let currentTab = 'all';

// DOM ELEMENTS
const btnAddEntry = document.getElementById('btn-add-entry');
const modalEntry = document.getElementById('modal-entry');
const entryForm = document.getElementById('entry-form');
const modalTitle = document.getElementById('modal-title');
const entryIdInput = document.getElementById('entry-id');

const modalSettle = document.getElementById('modal-settle');
const settleForm = document.getElementById('settle-form');

const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');

const viewEntries = document.getElementById('view-entries');
const viewPeople = document.getElementById('view-people');
const entriesList = document.getElementById('entries-list');
const emptyState = document.getElementById('empty-state');
const peopleGrid = document.getElementById('people-grid');
const peopleEmpty = document.getElementById('people-empty');
const peopleDatalist = document.getElementById('people-datalist');

// Helper: Format PKR Currency
function formatPKR(val) {
  return 'Rs. ' + Math.abs(val).toLocaleString('en-PK');
}

// Helper: Escape HTML
function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// STORAGE MANAGEMENT
function loadEntries() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      entries = JSON.parse(data);
    } catch (e) {
      entries = sampleEntries;
    }
  } else {
    entries = sampleEntries;
    saveEntries();
  }
  render();
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// DASHBOARD STATS CALCULATION
function updateStats() {
  let totalIOwe = 0;
  let countIOwe = 0;

  let totalOwesMe = 0;
  let countOwesMe = 0;

  entries.forEach(e => {
    const remaining = e.amount - (e.paidAmount || 0);
    if (remaining > 0) {
      if (e.type === 'i-owe') {
        totalIOwe += remaining;
        countIOwe++;
      } else {
        totalOwesMe += remaining;
        countOwesMe++;
      }
    }
  });

  const netBalance = totalOwesMe - totalIOwe;

  document.getElementById('stat-i-owe').textContent = formatPKR(totalIOwe);
  document.getElementById('stat-i-owe-sub').textContent = `${countIOwe} Udhar Baqi Hain`;

  document.getElementById('stat-owes-me').textContent = formatPKR(totalOwesMe);
  document.getElementById('stat-owes-me-sub').textContent = `${countOwesMe} Logon Se Wapas Lenay Hain`;

  const statNetEl = document.getElementById('stat-net');
  const statNetSubEl = document.getElementById('stat-net-sub');

  if (netBalance > 0) {
    statNetEl.textContent = '+' + formatPKR(netBalance);
    statNetEl.className = 'text-2xl sm:text-3xl font-extrabold text-emerald-400';
    statNetSubEl.textContent = 'Aap Faide Mein Hain (Net Positive)';
  } else if (netBalance < 0) {
    statNetEl.textContent = '-' + formatPKR(Math.abs(netBalance));
    statNetEl.className = 'text-2xl sm:text-3xl font-extrabold text-rose-400';
    statNetSubEl.textContent = 'Aap Ne Ada Karne Hain (Net Negative)';
  } else {
    statNetEl.textContent = formatPKR(0);
    statNetEl.className = 'text-2xl sm:text-3xl font-extrabold text-white';
    statNetSubEl.textContent = 'Hisab barabar hai';
  }
}

// RENDER DATALIST
function updatePeopleDatalist() {
  const people = Array.from(new Set(entries.map(e => e.person))).filter(Boolean);
  peopleDatalist.innerHTML = people.map(p => `<option value="${escapeHtml(p)}"></option>`).join('');
}

// RENDER ENTRIES LIST
function renderEntries() {
  const query = searchInput.value.toLowerCase().trim();
  const status = statusFilter.value;
  const today = new Date().toISOString().split('T')[0];

  const filtered = entries.filter(item => {
    // Type / Tab filter
    if (currentTab === 'i-owe' && item.type !== 'i-owe') return false;
    if (currentTab === 'owes-me' && item.type !== 'owes-me') return false;

    // Search filter
    if (query) {
      const matchPerson = item.person.toLowerCase().includes(query);
      const matchNotes = (item.notes || '').toLowerCase().includes(query);
      const matchCat = (item.category || '').toLowerCase().includes(query);
      if (!matchPerson && !matchNotes && !matchCat) return false;
    }

    // Status filter
    const isSettled = (item.paidAmount || 0) >= item.amount;
    const isOverdue = !isSettled && item.dueDate && item.dueDate < today;

    if (status === 'settled' && !isSettled) return false;
    if (status === 'unsettled' && isSettled) return false;
    if (status === 'overdue' && !isOverdue) return false;

    return true;
  });

  if (filtered.length === 0) {
    entriesList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  entriesList.innerHTML = filtered.map(item => {
    const isIOwe = item.type === 'i-owe';
    const remaining = item.amount - (item.paidAmount || 0);
    const isSettled = remaining <= 0;
    const isOverdue = !isSettled && item.dueDate && item.dueDate < today;

    let badgeHtml = '';
    if (isSettled) {
      badgeHtml = `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"><i class="fa-solid fa-check text-[9px] me-1"></i>Hisab Chukta</span>`;
    } else if (isOverdue) {
      badgeHtml = `<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full"><i class="fa-solid fa-clock text-[9px] me-1"></i>Tareekh Guzar Gayi</span>`;
    } else {
      badgeHtml = `<span class="bg-slate-700/50 text-slate-300 border border-slate-600/40 text-[10px] font-semibold px-2 py-0.5 rounded-full">Udhar Baqi</span>`;
    }

    const typeBadge = isIOwe
      ? `<span class="text-rose-400 bg-rose-500/10 border border-rose-500/20 text-[11px] font-semibold px-2 py-0.5 rounded-md"><i class="fa-solid fa-arrow-up-right-from-square me-1"></i>Mujhe Dena Hai</span>`
      : `<span class="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold px-2 py-0.5 rounded-md"><i class="fa-solid fa-arrow-down-left-and-arrow-up-right-to-center me-1"></i>Mujhe Lena Hai</span>`;

    return `
      <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 transition hover:border-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="space-y-1.5 flex-grow">
          <div class="flex flex-wrap items-center gap-2">
            <h4 class="font-bold text-white text-sm sm:text-base">${escapeHtml(item.person)}</h4>
            ${typeBadge}
            ${badgeHtml}
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span><i class="fa-solid fa-tag text-slate-500 me-1"></i>${escapeHtml(item.category || 'General')}</span>
            ${item.dueDate ? `<span><i class="fa-regular fa-calendar text-slate-500 me-1"></i>Wapsi: ${item.dueDate}</span>` : ''}
            ${item.notes ? `<span class="text-slate-300 italic"><i class="fa-regular fa-note-sticky text-slate-500 me-1"></i>"${escapeHtml(item.notes)}"</span>` : ''}
          </div>
        </div>

        <div class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-slate-700/50 pt-3 sm:pt-0 gap-2">
          <div class="text-right">
            <div class="text-sm sm:text-base font-extrabold ${isIOwe ? 'text-rose-400' : 'text-emerald-400'}">
              ${formatPKR(item.amount)}
            </div>
            ${item.paidAmount > 0 && !isSettled ? `<div class="text-[11px] text-slate-400">Ada Shuda: ${formatPKR(item.paidAmount)} | Baqi: <span class="font-bold text-amber-400">${formatPKR(remaining)}</span></div>` : ''}
          </div>

          <div class="flex items-center gap-1">
            ${!isSettled ? `
              <button onclick="openSettleModal('${item.id}')" title="Paise Ada / Wasool Karein" class="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                <i class="fa-solid fa-hand-holding-dollar"></i> Settle
              </button>
            ` : ''}
            <button onclick="editEntry('${item.id}')" title="Edit Karein" class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button onclick="deleteEntry('${item.id}')" title="Khatam Karein" class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// RENDER PEOPLE DIRECTORY
function renderPeople() {
  const peopleMap = {};

  entries.forEach(e => {
    if (!peopleMap[e.person]) {
      peopleMap[e.person] = { iOwe: 0, owesMe: 0, totalEntries: 0 };
    }

    const remaining = e.amount - (e.paidAmount || 0);
    peopleMap[e.person].totalEntries++;

    if (e.type === 'i-owe') {
      peopleMap[e.person].iOwe += remaining;
    } else {
      peopleMap[e.person].owesMe += remaining;
    }
  });

  const peopleNames = Object.keys(peopleMap);

  if (peopleNames.length === 0) {
    peopleGrid.innerHTML = '';
    peopleEmpty.classList.remove('hidden');
    return;
  }

  peopleEmpty.classList.add('hidden');

  peopleGrid.innerHTML = peopleNames.map(person => {
    const data = peopleMap[person];
    const net = data.owesMe - data.iOwe;

    let netText = '';
    let netClass = '';

    if (net > 0) {
      netText = `${person} se ${formatPKR(net)} lene hain`;
      netClass = 'text-emerald-400 font-bold';
    } else if (net < 0) {
      netText = `${person} ko ${formatPKR(Math.abs(net))} dene hain`;
      netClass = 'text-rose-400 font-bold';
    } else {
      netText = 'Hisab Chukta (Net 0)';
      netClass = 'text-slate-400 font-medium';
    }

    return `
      <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-slate-600 transition">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-sm">
              ${escapeHtml(person.substring(0, 2).toUpperCase())}
            </div>
            <div>
              <h4 class="font-bold text-white text-sm">${escapeHtml(person)}</h4>
              <p class="text-xs text-slate-400">${data.totalEntries} Hisab Entries</p>
            </div>
          </div>
        </div>

        <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-400">Aap ne dene hain:</span>
            <span class="text-rose-400 font-semibold">${formatPKR(data.iOwe)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Usne dene hain:</span>
            <span class="text-emerald-400 font-semibold">${formatPKR(data.owesMe)}</span>
          </div>
          <div class="pt-2 border-t border-slate-800 flex justify-between text-xs">
            <span class="text-slate-300 font-semibold">Khata Net Status:</span>
            <span class="${netClass}">${netText}</span>
          </div>
        </div>

        <button onclick="filterByPerson('${escapeHtml(person)}')" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700">
          Tamam Entries Dekhein
        </button>
      </div>
    `;
  }).join('');
}

// MAIN RENDER CONTROLLER
function render() {
  updateStats();
  updatePeopleDatalist();

  if (currentTab === 'people') {
    viewEntries.classList.add('hidden');
    viewPeople.classList.remove('hidden');
    document.getElementById('entries-controls').classList.add('hidden');
    renderPeople();
  } else {
    viewPeople.classList.add('hidden');
    viewEntries.classList.remove('hidden');
    document.getElementById('entries-controls').classList.remove('hidden');
    renderEntries();
  }
}

// EVENT HANDLERS & MODALS
btnAddEntry.addEventListener('click', () => {
  entryForm.reset();
  entryIdInput.value = '';
  modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square text-emerald-400"></i><span>Naya Entry Shamil Karein</span>`;
  modalEntry.classList.remove('hidden');
});

document.querySelectorAll('.btn-close-modal').forEach(b => {
  b.addEventListener('click', () => modalEntry.classList.add('hidden'));
});

document.querySelectorAll('.btn-close-settle').forEach(b => {
  b.addEventListener('click', () => modalSettle.classList.add('hidden'));
});

entryForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = entryIdInput.value || 'entry-' + Date.now();
  const person = document.getElementById('person-name').value.trim();
  const type = entryForm.elements['type'].value;
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const category = document.getElementById('category').value;
  const dueDate = document.getElementById('due-date').value;
  const notes = document.getElementById('notes').value.trim();

  const existingIndex = entries.findIndex(item => item.id === id);

  if (existingIndex > -1) {
    entries[existingIndex] = {
      ...entries[existingIndex],
      person, type, amount, category, dueDate, notes
    };
  } else {
    entries.unshift({
      id,
      person,
      type,
      amount,
      paidAmount: 0,
      category,
      dueDate,
      notes,
      createdAt: new Date().toISOString()
    });
  }

  saveEntries();
  render();
  modalEntry.classList.add('hidden');
});

// SETTLE / PAYMENT LOGIC
window.openSettleModal = function(id) {
  const item = entries.find(e => e.id === id);
  if (!item) return;

  const remaining = item.amount - (item.paidAmount || 0);

  document.getElementById('settle-entry-id').value = item.id;
  document.getElementById('settle-person-name').textContent = item.person;
  document.getElementById('settle-remaining-amount').textContent = formatPKR(remaining);

  const settleInput = document.getElementById('settle-amount');
  settleInput.value = remaining;
  settleInput.max = remaining;

  document.getElementById('btn-pay-full').onclick = () => {
    settleInput.value = remaining;
  };

  modalSettle.classList.remove('hidden');
};

settleForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('settle-entry-id').value;
  const payVal = parseFloat(document.getElementById('settle-amount').value) || 0;

  const item = entries.find(e => e.id === id);
  if (item) {
    item.paidAmount = (item.paidAmount || 0) + payVal;
    if (item.paidAmount >= item.amount) {
      item.paidAmount = item.amount;
      // Celebration Confetti
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }
    saveEntries();
    render();
  }
  modalSettle.classList.add('hidden');
});

// EDIT / DELETE LOGIC
window.editEntry = function(id) {
  const item = entries.find(e => e.id === id);
  if (!item) return;

  entryIdInput.value = item.id;
  document.getElementById('person-name').value = item.person;
  entryForm.elements['type'].value = item.type;
  document.getElementById('amount').value = item.amount;
  document.getElementById('category').value = item.category || 'Digar (Other)';
  document.getElementById('due-date').value = item.dueDate || '';
  document.getElementById('notes').value = item.notes || '';

  modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square text-emerald-400"></i><span>Hisab Edit Karein</span>`;
  modalEntry.classList.remove('hidden');
};

window.deleteEntry = function(id) {
  if (confirm('Kya aap waqai is entry ko khatam karna chahte hain?')) {
    entries = entries.filter(e => e.id !== id);
    saveEntries();
    render();
  }
};

window.filterByPerson = function(personName) {
  currentTab = 'all';
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active-tab');
    if (btn.dataset.tab === 'all') btn.classList.add('active-tab');
  });
  searchInput.value = personName;
  render();
};

// TAB CONTROLLER
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    btn.classList.add('active-tab');
    currentTab = btn.dataset.tab;
    render();
  });
});

// SEARCH & FILTERS
searchInput.addEventListener('input', renderEntries);
statusFilter.addEventListener('change', renderEntries);

// IMPORT / EXPORT DATA
document.getElementById('export-btn').addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `khata_book_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

document.getElementById('import-btn-trigger').addEventListener('click', () => {
  document.getElementById('import-file-input').click();
});

document.getElementById('import-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const importedData = JSON.parse(evt.target.result);
      if (Array.isArray(importedData)) {
        entries = importedData;
        saveEntries();
        render();
        alert('Data safaltapoorvak Restore ho gaya hai!');
      } else {
        alert('File ka format sahi nahi hai.');
      }
    } catch (err) {
      alert('File read karne mein ghalti hui.');
    }
  };
  reader.readAsText(file);
});

// INITIALIZE APP
loadEntries();
