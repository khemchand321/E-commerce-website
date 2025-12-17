// static/auth.js
(async function(){
  const authArea = document.getElementById('authArea');
  const modalRoot = document.getElementById('modalRoot');

  function createButton(label, onClick){
    const b = document.createElement('button'); b.className='btn'; b.textContent = label; b.addEventListener('click', onClick); return b;
  }

  function openModal(contentHtml){
    modalRoot.innerHTML = `<div class="modal-backdrop" onclick="document.getElementById('modalRoot').style.display='none'"><div class="modal" onclick="event.stopPropagation()">${contentHtml}</div></div>`;
    modalRoot.style.display = 'block';
  }

  function closeModal(){
    modalRoot.innerHTML = ''; modalRoot.style.display='none';
  }

  async function apiPost(url, body){
    const res = await fetch(url, {
      method:'POST',
      headers: {'Content-Type':'application/json'},
      credentials: 'include',
      body: JSON.stringify(body)
    });
    return res.json();
  }
  async function apiGet(url){
    const res = await fetch(url, {credentials:'include'});
    return res.json();
  }

  async function showLogin(){
    openModal(`
      <h2>Login</h2>
      <div class="form-row"><input id="loginEmail" type="email" placeholder="Email"></div>
      <div class="form-row"><input id="loginPassword" type="password" placeholder="Password"></div>
      <div style="display:flex;gap:8px">
        <button class="btn" id="loginSubmit">Login</button>
        <button class="icon-btn" id="showRegister">Register</button>
      </div>
      <div id="authMsg" class="small"></div>
    `);
    document.getElementById('loginSubmit').addEventListener('click', async ()=>{
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const res = await apiPost('/api/login', {email, password});
      const msg = document.getElementById('authMsg');
      if(res.ok){ msg.textContent = 'Logged in'; closeModal(); await refreshUser(); }
      else { msg.textContent = res.error || 'Login failed'; }
    });
    document.getElementById('showRegister').addEventListener('click', showRegister);
  }

  async function showRegister(){
    openModal(`
      <h2>Register</h2>
      <div class="form-row"><input id="regName" type="text" placeholder="Full name (optional)"></div>
      <div class="form-row"><input id="regEmail" type="email" placeholder="Email"></div>
      <div class="form-row"><input id="regPassword" type="password" placeholder="Password (min 6)"></div>
      <div style="display:flex;gap:8px">
        <button class="btn" id="regSubmit">Create account</button>
        <button class="icon-btn" id="backLogin">Back to login</button>
      </div>
      <div id="regMsg" class="small"></div>
    `);
    document.getElementById('regSubmit').addEventListener('click', async ()=>{
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const res = await apiPost('/api/register', {name, email, password});
      const msg = document.getElementById('regMsg');
      if(res.ok){ msg.textContent = 'Registered. Logging in...'; 
        // auto login
        const l = await apiPost('/api/login', {email, password});
        if(l.ok){ closeModal(); await refreshUser(); }
      } else { msg.textContent = res.error || 'Registration failed'; }
    });
    document.getElementById('backLogin').addEventListener('click', showLogin);
  }

  async function logout(){
    await apiPost('/api/logout', {});
    await refreshUser();
  }

  async function refreshUser(){
    const res = await apiGet('/api/me');
    authArea.innerHTML = '';
    if(res.ok && res.user){
      // show user + logout button
      const name = document.createElement('div'); name.textContent = res.user.name || res.user.email; name.className='small';
      const btn = createButton('Logout', logout);
      const bookingsBtn = createButton('My Bookings', async ()=>{
        // scroll to booking panel
        document.getElementById('bookingPanel').scrollIntoView({behavior:'smooth'});
      });
      authArea.appendChild(name); authArea.appendChild(bookingsBtn); authArea.appendChild(btn);
    } else {
      const open = createButton('Login / Register', showLogin);
      authArea.appendChild(open);
    }
    // trigger app refresh (app.js listens)
    if(window.onAuthChange) window.onAuthChange(res.user);
  }

  document.getElementById('openLogin').addEventListener('click', showLogin);
  await refreshUser();
})();
