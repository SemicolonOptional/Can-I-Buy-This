// Shared submit handler for login.html and signup.html.
function setupAuthForm({ formId, endpoint, submitId, submitLabel }) {
  const form = document.getElementById(formId);
  const errorEl = document.getElementById('error');
  const submitBtn = document.getElementById(submitId);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait…';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch (networkErr) {
      // fetch() throws "Failed to fetch" when it can't reach the
      // server at all — wrong URL, server not running, or the page
      // was opened as a local file instead of via http://localhost.
      errorEl.textContent =
        "Can't reach the server. Make sure it's running (npm start) and that you're viewing this at http://localhost:3000, not as a local file.";
      errorEl.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
      return;
    }

    try {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }
      window.location.href = '/calculator.html';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  });
}
