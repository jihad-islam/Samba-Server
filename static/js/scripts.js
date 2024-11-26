document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = result.message;
    messageDiv.style.color = response.ok ? 'green' : 'red';

    if (response.ok) {
        window.location.href = result.redirect;  // Redirect to shared folders page
    }
});
