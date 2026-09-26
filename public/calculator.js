(function () {
  const savedNote = document.getElementById('saved-note');

  const formatSavedAt = (iso) => {
    const d = new Date(iso);
    return 'Saved ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  // ---- Session / logout ---------------------------------------------

  fetch('/api/session')
    .then((r) => r.json())
    .then((data) => {
      if (!data.loggedIn) {
        window.location.href = '/login.html';
        return;
      }
      document.getElementById('whoami').textContent = data.username;
      loadSavedBudget();
    })
    .catch(() => {
      document.body.innerHTML =
        '<div style="max-width:480px;margin:80px auto;padding:24px;font-family:sans-serif;text-align:center;">' +
        "<p>Can't reach the server.</p>" +
        '<p style="color:#6B7280;font-size:14px;">Make sure it\u2019s running (<code>npm start</code>) and that you\u2019re at ' +
        '<code>http://localhost:3000</code>, not a local file.</p></div>';
    });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });

  // ---- Load / save the account's budget -------------------------------

  function loadSavedBudget() {
    fetch('/api/budget')
      .then((r) => r.json())
      .then((budget) => {
        if (!budget) return;
        document.getElementById('income').value = budget.income;
        document.getElementById('expenses').value = budget.expenses;
        document.getElementById('savings').value = budget.savings;
        document.getElementById('debt').value = budget.debt;
        savedNote.textContent = formatSavedAt(budget.updatedAt);
      });
  }

  function saveBudget() {
    const payload = {
      income: document.getElementById('income').value,
      expenses: document.getElementById('expenses').value,
      savings: document.getElementById('savings').value,
      debt: document.getElementById('debt').value,
    };
    fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((budget) => {
        savedNote.textContent = formatSavedAt(budget.updatedAt);
      });
  }

  // ---- Calculator ------------------------------------------------------

  const form = document.getElementById('calc-form');
  const toggle = document.getElementById('financing-toggle');
  const financingFields = document.getElementById('financing-fields');
  let financing = false;

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    financing = btn.dataset.val === 'yes';
    [...toggle.children].forEach((b) => b.classList.toggle('active', b === btn));
    financingFields.classList.toggle('show', financing);
  });

  const fmt = (n) => {
    const sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('item-name').value.trim() || 'Item';
    const price = parseFloat(document.getElementById('item-price').value) || 0;
    const income = parseFloat(document.getElementById('income').value) || 0;
    const expenses = parseFloat(document.getElementById('expenses').value) || 0;
    const savings = parseFloat(document.getElementById('savings').value) || 0;
    const debt = parseFloat(document.getElementById('debt').value) || 0;
    const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    const term = parseFloat(document.getElementById('term').value) || 0;

    // Monthly loan payment (simple amortization), only if financing
    let monthlyPayment = 0;
    const financedAmount = Math.max(price - downPayment, 0);
    if (financing && financedAmount > 0 && term > 0) {
      const r = rate / 100 / 12;
      monthlyPayment =
        r > 0
          ? (financedAmount * (r * Math.pow(1 + r, term))) / (Math.pow(1 + r, term) - 1)
          : financedAmount / term;
    }

    const leftoverIncome = income - expenses - debt - (financing ? monthlyPayment : 0);
    const cashSpent = financing ? downPayment : price;
    const afterSavings = savings - cashSpent;
    const pctOfIncome = income > 0 ? (price / income) * 100 : 0;
    const monthsToRebuild = leftoverIncome > 0 ? cashSpent / leftoverIncome : null;

    document.getElementById('r-title').textContent = fmt(price) + ' ' + name;
    document.getElementById('r-price').textContent = fmt(price);
    document.getElementById('r-income').textContent = fmt(income);
    document.getElementById('r-expenses').textContent = fmt(expenses);
    document.getElementById('r-savings').textContent = fmt(savings);
    document.getElementById('r-after-savings').textContent = fmt(afterSavings) + ' savings';
    document.getElementById('r-leftover').textContent = fmt(leftoverIncome);
    document.getElementById('r-pct-income').textContent = pctOfIncome.toFixed(0) + '%';

    const verdictEl = document.getElementById('r-verdict');
    const noteEl = document.getElementById('r-note');
    const affordable = afterSavings >= 0 && leftoverIncome >= 0 && pctOfIncome <= 100;

    verdictEl.textContent = affordable ? 'Looks affordable' : 'Tight — review before buying';
    verdictEl.className = 'verdict ' + (affordable ? 'ok' : 'warn');

    let note = '';
    if (financing && monthlyPayment > 0) {
      note += 'Estimated monthly payment: ' + fmt(monthlyPayment) + ' over ' + term + ' months. ';
    }
    if (monthsToRebuild !== null && cashSpent > 0) {
      note +=
        'You would need approximately ' +
        monthsToRebuild.toFixed(1) +
        ' months of leftover income to rebuild the ' +
        fmt(cashSpent) +
        ' spent.';
    } else if (cashSpent > 0) {
      note += 'Your leftover income is $0 or negative, so there’s currently no surplus to rebuild savings with.';
    }
    noteEl.textContent = note;

    document.getElementById('result').classList.add('show');
    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'start' });

    saveBudget();
  });
})();
