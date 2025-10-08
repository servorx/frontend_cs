// Determina el rol: primero desde query param ?role=, luego localStorage, sino por defecto 'cliente'
function detectRole(){
  try{
    const params = new URLSearchParams(window.location.search);
    const r = params.get('role');
    if(r) return r;
  }catch(e){}
  try{ const stored = localStorage.getItem('demoRole'); if(stored) return stored; }catch(e){}
  return 'cliente';
}
const currentRole = detectRole();

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  normalizeStoredPurchases();
  renderRoleMenu();
  setupNavLinks();
  setupGlobalHandlers();
  setupModal();
  setupSearchAndCart();
});

function normalizeStoredPurchases(){
  try{
    const purchases = JSON.parse(localStorage.getItem('purchasesDemo')||'[]');
    let changed = false;
    const normalized = purchases.map(rec=>{
      if(!rec.items && rec.cart){ rec.items = rec.cart; }
      if(!rec.items || !Array.isArray(rec.items)){
        // legacy simple shape: {id, item, img, fecha}
        const it = rec.item ? [{name: rec.item, price: rec.price||0, qty: rec.qty||1, img: rec.img||'../images/repuestos.jpg'}] : [];
        rec.items = it;
      }
      rec.items = rec.items.map(it=>({name: it.name||it.item||'Producto', price: Number(it.price||0), qty: Number(it.qty||1), img: it.img || it.imgsrc || '../images/repuestos.jpg'}));
      rec.total = Number(rec.total || rec.items.reduce((s,i)=>s + (i.price||0)*(i.qty||1),0));
      return rec;
    });
    if(JSON.stringify(purchases) !== JSON.stringify(normalized)){
      localStorage.setItem('purchasesDemo', JSON.stringify(normalized));
    }
  }catch(e){ console.warn('normalize purchases error', e); }
  try{
    const invoices = JSON.parse(localStorage.getItem('invoicesDemo')||'[]');
    const normalizedInv = invoices.map(rec=>{
      if(!rec.items && rec.cart){ rec.items = rec.cart; }
      if(rec.items && Array.isArray(rec.items)){
        rec.items = rec.items.map(it=>({name: it.name||it.item||'Producto', price: Number(it.price||0), qty: Number(it.qty||1), img: it.img || '../images/repuestos.jpg'}));
        rec.total = Number(rec.total || rec.items.reduce((s,i)=>s + (i.price||0)*(i.qty||1),0));
      }
      return rec;
    });
    localStorage.setItem('invoicesDemo', JSON.stringify(normalizedInv));
  }catch(e){ console.warn('normalize invoices error', e); }
}

function initNav(){
  const userBtn = document.getElementById('userBtn');
  const userMenu = document.getElementById('userMenu');
  userBtn.addEventListener('click', () => {
    const expanded = userBtn.getAttribute('aria-expanded') === 'true';
    userBtn.setAttribute('aria-expanded', String(!expanded));
    userMenu.classList.toggle('hidden');
  });
}

function setupGlobalHandlers(){
  // close menu when clicking outside
  document.addEventListener('click', (e)=>{
    const menu = document.getElementById('userMenu');
    const btn = document.getElementById('userBtn');
    if(menu.classList.contains('hidden')) return;
    if(!menu.contains(e.target) && !btn.contains(e.target)){
      menu.classList.add('hidden'); btn.setAttribute('aria-expanded','false');
    }
  });

  // close with ESC
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      const menu = document.getElementById('userMenu');
      menu.classList.add('hidden'); document.getElementById('userBtn').setAttribute('aria-expanded','false');
    }
  });
}

function renderRoleMenu(){
  const menu = document.getElementById('userMenu');
  menu.innerHTML = '';
  // don't show the raw role label 'mecanico' in the user menu to keep headers clean
  if(currentRole && currentRole !== 'mecanico'){
    const roleTitle = document.createElement('div');
    roleTitle.style.padding = '6px 8px';
    roleTitle.style.opacity = '0.9';
    roleTitle.textContent = `Rol: ${currentRole}`;
    menu.appendChild(roleTitle);
  }

  const items = getMenuItemsForRole(currentRole);
  items.forEach(it => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = it.label;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(it.section);
      menu.classList.add('hidden');
    });
    menu.appendChild(a);
  });

  const hr = document.createElement('hr');
  hr.style.border = 'none';
  hr.style.height = '1px';
  hr.style.background = 'rgba(255,255,255,0.04)';
  hr.style.margin = '8px 0';
  menu.appendChild(hr);

  const logout = document.createElement('a');
  logout.href = '#';
  logout.textContent = 'Cerrar sesión';
  logout.addEventListener('click', (e) => { e.preventDefault(); try{ localStorage.removeItem('demoRole'); }catch(err){}; window.location.href = '../index.html'; });
  menu.appendChild(logout);
}

function getMenuItemsForRole(role){
  if(role === 'mecanico'){
    return [
      {label:'Vehículos pendientes', section:'vehiculos'},
      {label:'Agenda de trabajo', section:'home'},
      {label:'Consultar proveedor', section:'home'}
    ];
  }
  if(role === 'cliente'){
    return [
      {label:'Facturas', section:'facturas'},
      {label:'Compras', section:'compras'}
    ];
  }
  if(role === 'admin'){
    return [
      {label:'Agregar/Eliminar repuesto', section:'admin'},
      {label:'Agregar/Eliminar mecánico', section:'admin'}
    ];
  }
  return [];
}

function setupNavLinks(){
  document.getElementById('nav-home').addEventListener('click', (e)=>{e.preventDefault(); navigateTo('home')});
  document.getElementById('nav-contact').addEventListener('click', (e)=>{e.preventDefault(); navigateTo('contact')});
  document.getElementById('nav-services').addEventListener('click', (e)=>{e.preventDefault(); navigateTo('services')});
}

function navigateTo(sectionId){
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(sectionId);
  if(target){
    target.classList.add('active');
  }

  // render dynamic sections
  if(sectionId === 'vehiculos') renderVehiculos();
  if(sectionId === 'facturas') renderFacturas();
  if(sectionId === 'compras') renderCompras();
  if(sectionId === 'admin') renderAdmin();
  if(sectionId === 'services') renderServices();
  if(sectionId === 'alquiler') renderAlquilerForm();
  if(sectionId === 'repuestos-list') renderRepuestosPage();
  if(sectionId === 'mantenimiento-list') renderMantenimientoPage();
}

function renderServices(){
  // if client, show detailed options
  if(currentRole === 'cliente'){
    // show services as links to subpages using actual service images
    const sec = document.getElementById('services');
    sec.innerHTML = '';
    const container = document.createElement('div');
    const h2 = document.createElement('h2'); h2.textContent = 'Servicios para clientes'; container.appendChild(h2);
    const cards = document.createElement('div'); cards.className = 'cards';
    const card1 = document.createElement('article'); card1.className='card'; card1.innerHTML = `<img src="../images/servicios/mecanico.jpg" alt="Alquiler de mecánico"><h3>Alquiler de mecánico</h3><p>Solicita un mecánico a domicilio</p><div class="card-actions"><button id="goAlquiler" class="btn-primary">Solicitar alquiler</button></div>`;
    const card2 = document.createElement('article'); card2.className='card'; card2.innerHTML = `<img src="../images/servicios/repuestos.jpg" alt="Repuestos"><h3>Repuestos</h3><p>Compra repuestos para carro o moto</p><div class="card-actions"><button id="goRepuestos" class="btn-primary">Ver repuestos</button></div>`;
    const card3 = document.createElement('article'); card3.className='card'; card3.innerHTML = `<img src="../images/servicios/mantenimiento.jpg" alt="Mantenimiento"><h3>Mantenimiento</h3><p>Agenda mantenimiento para tu vehículo</p><div class="card-actions"><button id="goMantenimiento" class="btn-primary">Ver servicios</button></div>`;
    cards.appendChild(card1); cards.appendChild(card2); cards.appendChild(card3);
    container.appendChild(cards); sec.appendChild(container);
    document.getElementById('goAlquiler').addEventListener('click', ()=>navigateTo('alquiler'));
    document.getElementById('goRepuestos').addEventListener('click', ()=>navigateTo('repuestos-list'));
    document.getElementById('goMantenimiento').addEventListener('click', ()=>navigateTo('mantenimiento-list'));
    return;
  }
}

/* Alquiler form */
function renderAlquilerForm(){
  const sec = document.getElementById('alquiler'); sec.innerHTML = '';
  const card = document.createElement('div'); card.className='hero-card';
  card.innerHTML = `
    <h2>Solicitar alquiler de mecánico</h2>
    <form id="alquilerForm">
      <div class="form-row"><div class="col"><label>Nombre del cliente</label><input id="al-nombre" type="text" required></div>
      <div class="col"><label>Teléfono</label><input id="al-telefono" type="text" required></div></div>
      <div class="form-row"><div class="col"><label>Dirección</label><input id="al-direccion" type="text" required></div>
      <div class="col"><label>Tipo</label><select id="al-tipo"><option value="casa">Casa</option><option value="conjunto">Conjunto</option></select></div></div>
      <div class="form-row"><div class="col"><label>Fecha</label><input id="al-fecha" type="date" required></div>
      <div class="col"><label>Hora (ej: 10:30 AM)</label><input id="al-hora" type="text" placeholder="hh:mm AM/PM" required></div></div>
      <div class="form-field"><label>Tipo de servicio</label><select id="al-servicio"></select></div>
      <div class="form-field" id="al-otro-wrap" style="display:none"><label>Descripción corta (si eliges Otro)</label><input id="al-otro" type="text" placeholder="Describe brevemente el servicio"></div>
      <div style="margin-top:12px"><button type="submit" class="btn-primary">Solicitar servicio</button></div>
    </form>
  `;
  sec.appendChild(card);

  // set min date to today
  const fecha = document.getElementById('al-fecha'); if(fecha){ const d = new Date().toISOString().split('T')[0]; fecha.setAttribute('min', d); }

  document.getElementById('alquilerForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const nombre = document.getElementById('al-nombre').value.trim();
    const telefono = document.getElementById('al-telefono').value.trim();
    const direccion = document.getElementById('al-direccion').value.trim();
    const tipo = document.getElementById('al-tipo').value;
    const fechaVal = document.getElementById('al-fecha').value;
    const hora = document.getElementById('al-hora').value.trim();
    const servicio = document.getElementById('al-servicio').value;
    const otroDesc = document.getElementById('al-otro') ? document.getElementById('al-otro').value.trim() : '';
    // Validations
    if(!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) return showToast('Nombre inválido. Sólo letras y espacios.');
    if(!/^3\d{9}$/.test(telefono)) return showToast('Teléfono inválido. Debe comenzar con 3 y tener 10 dígitos.');
    if(!/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(hora)) return showToast('Hora inválida. Formato: hh:mm AM/PM');
    // fecha already min enforced but double-check
    if(new Date(fechaVal) < new Date(new Date().toISOString().split('T')[0])) return alert('La fecha debe ser hoy o posterior');
    // simulate submit
    showToast('Solicitud enviada correctamente');
    console.log('Alquiler solicitado', {nombre, telefono, direccion, tipo, fechaVal, hora, servicio});
    document.getElementById('alquilerForm').reset();
  });

  // populate servicio options from services (limit to relevant ones)
  const servSelect = document.getElementById('al-servicio');
  const services = getServices().slice(0,12);
  services.forEach(s=>{ const opt = document.createElement('option'); opt.value = s.title; opt.textContent = s.title; servSelect.appendChild(opt); });
  const optOtro = document.createElement('option'); optOtro.value = 'Otro'; optOtro.textContent = 'Otro'; servSelect.appendChild(optOtro);
  servSelect.addEventListener('change', ()=>{
    const wrap = document.getElementById('al-otro-wrap'); if(servSelect.value === 'Otro'){ wrap.style.display = ''; } else { wrap.style.display = 'none'; }
  });
}

/* Repuestos page */
function renderRepuestosPage(){
  const sec = document.getElementById('repuestos-list'); sec.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Repuestos disponibles'; sec.appendChild(title);

  const repuestos = getRepuestos();
  const grid = document.createElement('div'); grid.className = 'cards';

  grid.innerHTML = repuestos.map((r,i)=>{
    return `<article class="card"><img src="${r.img||'../images/repuestos.jpg'}"><div style="padding:12px"><h3>${escapeHtml(r.nombre)}</h3><p>${escapeHtml(r.descripcion||'')}</p><div class="badges"><span class="badge brand">${escapeHtml(r.brand||'—')}</span> <span class="badge tipo">${escapeHtml(r.type === 'moto' ? 'Moto' : 'Auto')}</span></div><div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700">$${(r.precio||0).toFixed(2)}</div><div><button class="add-to-cart-item btn-primary" data-name="${escapeHtml(r.nombre)}">Añadir</button> <button class="buy-now btn-secondary" data-name="${escapeHtml(r.nombre)}">Comprar</button></div></div></div></article>`;
  }).join('');

  sec.appendChild(grid);

  grid.querySelectorAll('.add-to-cart-item').forEach(b=> b.addEventListener('click', (e)=>{
    const name = e.currentTarget.dataset.name; const list = getRepuestos(); const item = list.find(x=>x.nombre===name); if(!item) return; const cart = getCart(); cart.push({name:item.nombre, price:item.precio||0, img:item.img, qty:1}); saveCart(cart); renderCartCount(); renderCartPanel(); showToast('Repuesto añadido al carrito');
  }));

  grid.querySelectorAll('.buy-now').forEach(b=> b.addEventListener('click', (e)=>{
    const name = e.currentTarget.dataset.name; const list = getRepuestos(); const item = list.find(x=>x.nombre===name); if(!item) return;
    const node = document.createElement('div'); node.innerHTML = `<h3>Comprar ahora: ${escapeHtml(item.nombre)}</h3><div style="margin-top:8px">Precio unitario: $${(item.precio||0).toFixed(2)}</div><div style="margin-top:8px"><label>Cantidad</label><input id="buy-qty" type="number" value="1" min="1" style="width:80px;padding:8px;border-radius:6px;background:#fff;color:#111;border:1px solid rgba(0,0,0,0.08)"></div><div style="margin-top:12px" class="form-actions"><button id="buy-confirm" class="btn-primary">Pagar ahora</button><button id="buy-cancel" class="btn-secondary">Cancelar</button></div>`;
    openModal(node);
    document.getElementById('buy-cancel').addEventListener('click', closeModal);
    document.getElementById('buy-confirm').addEventListener('click', ()=>{ const q = parseInt(document.getElementById('buy-qty').value||1,10); const singleCart = [{name:item.nombre, price:item.precio||0, img:item.img, qty:q}]; closeModal(); openCheckoutModal(singleCart, true); });
  }));
}

function debounce(fn, wait){ let t; return function(...a){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a), wait); }; }

/* Mantenimiento page with 'Solicitar cita' surprise */
function renderMantenimientoPage(){
  const sec = document.getElementById('mantenimiento-list'); sec.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Servicios de mantenimiento'; sec.appendChild(title);
  const grid = document.createElement('div'); grid.className='cards';
  const services = getServices();
  services.forEach((s,i)=>{
    const card = document.createElement('article'); card.className='card';
    const imgSrc = s.img || '../images/mantenimientos/revision-frenos.jpg';
    card.innerHTML = `<img src="${imgSrc}" alt="${escapeHtml(s.title)}"><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.desc)}</p><div style="padding:12px;display:flex;gap:8px;justify-content:space-between;align-items:center"><div style="font-weight:700">$${(s.price||0).toFixed(2)}</div><div><button class="solicitar-cita btn-primary" data-s="${i}">Solicitar cita</button></div></div>`;
    grid.appendChild(card);
  });
  sec.appendChild(grid);

  // handlers for each card
  sec.querySelectorAll('.solicitar-cita').forEach(b=> b.addEventListener('click', ()=> openSolicitarCitaModal()));
}

function openSolicitarCitaModal(){
  const form = document.createElement('div');
  form.innerHTML = `
    <h3>Solicitar cita de mantenimiento</h3>
    <form id="citaForm" class="modal-form">
      <div class="form-row"><div class="col"><div class="form-field"><label>Placa</label><input id="cita-placa" type="text" required></div></div><div class="col"><div class="form-field"><label>Modelo</label><input id="cita-modelo" type="text" required></div></div></div>
      <div class="form-row"><div class="col"><div class="form-field"><label>Marca</label><input id="cita-marca" type="text" required></div></div><div class="col"><div class="form-field"><label>Año</label><input id="cita-ano" type="number" min="1900" max="2099" required></div></div></div>
      <div class="form-row"><div class="col"><div class="form-field"><label>Kilometraje</label><input id="cita-km" type="number" required></div></div><div class="col"><div class="form-field"><label>Nombre del cliente</label><input id="cita-nombre" type="text" required></div></div></div>
      <div class="form-row"><div class="col"><div class="form-field"><label>Teléfono</label><input id="cita-tel" type="text" required placeholder="Ej: 3XXXXXXXXX"></div></div><div class="col"><div class="form-field"><label>Fecha de llevar vehículo</label><input id="cita-fecha" type="date" required></div></div></div>
      <div class="form-row"><div class="col"><div class="form-field"><label>Hora (hh:mm AM/PM)</label><input id="cita-hora" type="text" placeholder="hh:mm AM/PM" required></div></div></div>
      <div class="form-actions"><button id="cita-send" class="btn-primary" type="submit">Pedir cita</button><button id="cita-cancel" class="btn-secondary" type="button">Cancelar</button></div>
    </form>
  `;
  openModal(form);
  // set min date for cita-fecha
  const fecha = document.getElementById('cita-fecha'); if(fecha){ const d = new Date().toISOString().split('T')[0]; fecha.setAttribute('min', d); }
  document.getElementById('cita-cancel').addEventListener('click', closeModal);
  document.getElementById('citaForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const hora = document.getElementById('cita-hora').value.trim();
    const nombre = document.getElementById('cita-nombre').value.trim();
    const tel = document.getElementById('cita-tel').value.trim();
    if(!/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(hora)) return showToast('Hora inválida');
    if(!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) return showToast('Nombre inválido. Sólo letras y espacios.');
    if(!/^3\d{9}$/.test(tel)) return showToast('Teléfono inválido. Debe comenzar con 3 y tener 10 dígitos.');
    // collect and simulate
    const data = {
      placa: document.getElementById('cita-placa').value.trim(), modelo: document.getElementById('cita-modelo').value.trim(), marca: document.getElementById('cita-marca').value.trim(), ano: document.getElementById('cita-ano').value,
      km: document.getElementById('cita-km').value, nombre, tel, fecha: document.getElementById('cita-fecha').value, hora
    };
    console.log('Cita solicitada', data); showToast('Solicitud enviada correctamente'); closeModal();
  });
}

/* Demo data */
const demoVehiculos = [
  {id:1, cliente:'Juan Perez', modelo:'Toyota Corolla', img:'../images/mecanico.jpg', ready:false},
  {id:2, cliente:'María López', modelo:'Honda Civic', img:'../images/mecanico.jpg', ready:false},
  {id:3, cliente:'Luis García', modelo:'Ford Ranger', img:'../images/mecanico.jpg', ready:true}
];

const demoFacturas = [
  {id:1, descripcion:'Cambio de aceite', precio:45.5},
  {id:2, descripcion:'Repuesto frenos', precio:120}
];

const demoCompras = [
  {id:1, item:'Batería', img:'../images/repuestos.jpg', fecha:'2024-09-01'},
  {id:2, item:'Filtro de aire', img:'../images/repuestos.jpg', fecha:'2025-02-12'}
];

function getVehFromStorage(){
  const raw = localStorage.getItem('vehiculosDemo');
  if(raw) return JSON.parse(raw);
  localStorage.setItem('vehiculosDemo', JSON.stringify(demoVehiculos));
  return demoVehiculos;
}

function saveVehToStorage(list){
  localStorage.setItem('vehiculosDemo', JSON.stringify(list));
}

function renderVehiculos(){
  const section = document.getElementById('vehiculos');
  section.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Vehículos pendientes';
  section.appendChild(title);

  const list = document.createElement('div'); list.className = 'veh-list';
  const items = getVehFromStorage();
  if(items.length === 0){
    const p = document.createElement('p'); p.textContent = 'No hay vehículos pendientes.'; section.appendChild(p); return;
  }
  items.forEach(v => {
    const item = document.createElement('div'); item.className = 'veh-item';
    const img = document.createElement('img'); img.src = v.img; img.alt = v.modelo;
    const info = document.createElement('div'); info.style.flex = '1';
    info.innerHTML = `<strong>${v.modelo}</strong><div style="opacity:0.9">Cliente: ${v.cliente}</div>`;
    const actions = document.createElement('div');

    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = !!v.ready;
    checkbox.addEventListener('change', ()=>{
      v.ready = checkbox.checked; saveVehToStorage(items); renderVehiculos();
    });
    actions.appendChild(checkbox);

    item.appendChild(img); item.appendChild(info); item.appendChild(actions);
    list.appendChild(item);
  });
  section.appendChild(list);
}

/* Search and Cart features */
function setupSearchAndCart(){
  // search
  const input = document.getElementById('siteSearch');
  if(input){
    // build a lightweight global index from services and repuestos so the search finds across sections
    const suggestions = document.createElement('div'); suggestions.id = 'searchSuggestions'; suggestions.className='search-suggestions hidden'; document.querySelector('.search-box').appendChild(suggestions);
    let globalIndex = [];
    function buildIndex(){
      globalIndex = [];
      try{
        const services = getServices();
        services.forEach((s,i)=> globalIndex.push({type:'servicio', title:s.title, desc:s.desc, section:'mantenimiento-list', idx:i, img: s.img || '../images/mantenimientos/revision-frenos.jpg'}));
      }catch(e){}
      try{
        const rep = getRepuestos();
        rep.forEach((r,i)=> globalIndex.push({type:'repuesto', title:r.nombre, desc:r.descripcion, section:'repuestos-list', idx:i, img:r.img || '../images/repuestos.jpg'}));
      }catch(e){}
    }
    buildIndex();

    input.addEventListener('input', ()=>{
      const q = input.value.trim().toLowerCase();
      // first, filter visible cards on current page as before
      document.querySelectorAll('.card').forEach(card=>{
        const title = (card.querySelector('h3')?.textContent||'').toLowerCase();
        const desc = (card.querySelector('p')?.textContent||'').toLowerCase();
        const show = !q || title.includes(q) || desc.includes(q);
        card.style.display = show ? '' : 'none';
      });

      // then, show cross-page suggestions
      suggestions.innerHTML = '';
      if(!q){ suggestions.classList.add('hidden'); return; }
      const matches = globalIndex.filter(item => (item.title||'').toLowerCase().includes(q) || (item.desc||'').toLowerCase().includes(q));
      if(matches.length === 0){ suggestions.classList.add('hidden'); return; }
      matches.slice(0,8).forEach(m=>{
        const row = document.createElement('a'); row.href='#'; row.className='suggestion-item'; row.innerHTML = `<img src="${m.img}" alt="" style="width:40px;height:28px;object-fit:cover;margin-right:8px;border-radius:4px"> <div style="flex:1"><div style="font-weight:700">${escapeHtml(m.title)}</div><div style="font-size:12px;opacity:0.8">${escapeHtml(m.type)}</div></div>`;
        row.addEventListener('click', (ev)=>{ ev.preventDefault(); suggestions.classList.add('hidden'); navigateTo(m.section); setTimeout(()=>{ // try to highlight the matching card
          document.querySelectorAll('#'+m.section+' .card').forEach((c,idx)=>{ if(m.type==='repuesto' && idx===m.idx) c.style.boxShadow='0 8px 30px rgba(255,107,0,0.18)'; if(m.type==='servicio' && idx===m.idx) c.style.boxShadow='0 8px 30px rgba(30,144,255,0.12)'; });
        },200); });
        suggestions.appendChild(row);
      });
      suggestions.classList.remove('hidden');
    });
  }

  // cart
  document.querySelectorAll('.add-cart').forEach(btn=> btn.addEventListener('click', onAddCart));
  const cartToggle = document.getElementById('cartToggle'); if(cartToggle) cartToggle.addEventListener('click', toggleCartPanel);
  renderCartCount(); renderCartPanel();
}

function getCart(){ try{ return JSON.parse(localStorage.getItem('cartDemo')||'[]'); }catch(e){return [];} }
function saveCart(c){ localStorage.setItem('cartDemo', JSON.stringify(c)); }

function onAddCart(e){
  const btn = e.currentTarget; const name = btn.dataset.name; const price = parseFloat(btn.dataset.price||0); const img = btn.dataset.img;
  const cart = getCart(); cart.push({name, price, img, qty:1}); saveCart(cart); renderCartCount(); renderCartPanel(); showToast('Añadido al carrito');
}

function renderCartCount(){ const cnt = getCart().length; const el = document.getElementById('cartCount'); if(el) el.textContent = String(cnt); }

function toggleCartPanel(){ const panel = document.getElementById('cartPanel'); const visible = !panel.classList.contains('hidden'); if(visible){ panel.classList.add('hidden'); panel.setAttribute('aria-hidden','true'); } else { panel.classList.remove('hidden'); panel.setAttribute('aria-hidden','false'); renderCartPanel(); } }

function renderCartPanel(){
  const itemsEl = document.getElementById('cartItems'); if(!itemsEl) return; itemsEl.innerHTML = '';
  const cart = getCart(); if(cart.length===0){ itemsEl.innerHTML = '<div style="opacity:0.9">El carrito está vacío</div>'; document.getElementById('cartTotal').textContent = 'Total: $0.00'; return; }

  let total = 0;
  cart.forEach((it, idx)=>{
    total += (it.price||0) * (it.qty||1);
    const row = document.createElement('div'); row.className='cart-item';
    const img = document.createElement('img'); img.src = it.img || '../images/repuestos.jpg'; img.style.width='56px'; img.style.height='42px'; img.style.objectFit='cover'; img.style.borderRadius='6px';
    const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<div style="font-weight:700">${it.name}</div><div style="opacity:0.9">$${(it.price||0).toFixed(2)}</div>`;
    const actions = document.createElement('div');

    // quantity controls
    const qtyWrap = document.createElement('div'); qtyWrap.className='qty-control';
    const minus = document.createElement('button'); minus.textContent='-'; minus.addEventListener('click', ()=>{ updateQty(idx, (it.qty||1)-1); });
    const qtyInput = document.createElement('input'); qtyInput.type='number'; qtyInput.min='1'; qtyInput.value = it.qty || 1; qtyInput.addEventListener('change', ()=>{ updateQty(idx, parseInt(qtyInput.value||1,10)); });
    const plus = document.createElement('button'); plus.textContent='+'; plus.addEventListener('click', ()=>{ updateQty(idx, (it.qty||1)+1); });
    qtyWrap.appendChild(minus); qtyWrap.appendChild(qtyInput); qtyWrap.appendChild(plus);

    const rem = document.createElement('button'); rem.textContent='Quitar'; rem.addEventListener('click', ()=>{ removeCartItem(idx); });
    actions.appendChild(qtyWrap); actions.appendChild(rem);

    row.appendChild(img); row.appendChild(meta); row.appendChild(actions);
    itemsEl.appendChild(row);
  });

  document.getElementById('cartTotal').textContent = `Total: $${total.toFixed(2)}`;
}

function updateQty(index, value){
  const cart = getCart(); if(!cart[index]) return; if(isNaN(value) || value < 1) value = 1; cart[index].qty = value; saveCart(cart); renderCartCount(); renderCartPanel();
}

function removeCartItem(index){ const cart = getCart(); cart.splice(index,1); saveCart(cart); renderCartCount(); renderCartPanel(); showToast('Artículo eliminado'); }

// checkout behaviour: if cliente -> open checkout modal
document.addEventListener('click', (e)=>{
  if(e.target && e.target.id === 'checkoutBtn'){
    const role = currentRole;
    if(role !== 'cliente') return alert('Solo clientes pueden realizar compras en este demo');
    const cart = getCart(); if(cart.length===0) return alert('Carrito vacío');
    openCheckoutModal(cart);
  }
  // 'Comprar ahora' buttons on repuestos list
  if(e.target && e.target.classList && e.target.classList.contains('buy-now')){
    const name = e.target.dataset.name; const r = getRepuestos().find(x=>x.nombre===name); if(!r) return; const singleCart = [{name:r.nombre, price:r.precio||0, img:r.img, qty:1}];
    openCheckoutModal(singleCart, true);
  }
});

function openCheckoutModal(cart, singleItem=false){
  const total = cart.reduce((s,i)=>s + (i.price||0)*(i.qty||1), 0);
  const node = document.createElement('div');
  node.innerHTML = `<h3>Pagar compra</h3>
    <div style="margin-bottom:8px">Items: ${cart.length} — Total: $${total.toFixed(2)}</div>
    <form id="checkoutForm">
      <div class="form-row"><div class="col"><label>Nombre en la tarjeta</label><input id="pay-name" type="text" required></div><div class="col"><label>Número de tarjeta</label><input id="pay-card" type="text" required></div></div>
      <div class="form-row"><div class="col"><label>Fecha expiración</label><input id="pay-exp" type="text" placeholder="MM/AA" required></div><div class="col"><label>CVV</label><input id="pay-cvv" type="text" required></div></div>
      <div class="form-actions"><button type="submit" id="pay-confirm" class="btn-primary">Confirmar pago (simulado)</button><button id="pay-cancel" type="button" class="btn-secondary">Cancelar</button></div>
    </form>`;
  openModal(node);
  document.getElementById('pay-cancel').addEventListener('click', closeModal);
  document.getElementById('checkoutForm').addEventListener('submit', (ev)=>{
    ev.preventDefault();
    // capture buyer name and simulate payment
    const buyer = (document.getElementById('pay-name')?.value || '').trim() || 'Cliente (demo)';
    showToast('Pago procesado (simulado)');
    closeModal();
    (async ()=>{
      // generate PDF for user (optional)
      await generateInvoicePDF(cart);
      // normalize items
      const normalized = (cart||[]).map(i=>({name:i.name, price: Number(i.price||0), qty: Number(i.qty||1), img: i.img || '../images/repuestos.jpg'}));
      const total = normalized.reduce((s,it)=> s + (it.price||0)*(it.qty||1), 0);
      const invoiceRecord = {id: Date.now(), date: new Date().toISOString(), buyer, items: normalized, total};
      saveInvoice(invoiceRecord); savePurchase(invoiceRecord);
      if(!singleItem){ saveCart([]); renderCartCount(); renderCartPanel(); }
      navigateTo('facturas'); setTimeout(()=> renderFacturas(true, invoiceRecord),120);
    })();
  });
}


function renderFacturas(){
  // If called with true, generate invoice from cart (checkout flow)
  const createFromCart = arguments[0] === true;
  const cartArg = arguments[1];
  const section = document.getElementById('facturas'); section.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Facturas'; section.appendChild(title);

  if(createFromCart){
    const invoiceRec = cartArg || getCart();
    // if we were passed an invoice record, render it directly
    if(invoiceRec && invoiceRec.items){
      const invoice = buildInvoiceDocument(invoiceRec.items, invoiceRec);
      section.appendChild(invoice);
    } else {
      const cart = cartArg || getCart();
      const invoice = buildInvoiceDocument(cart);
      section.appendChild(invoice);
    }
    // buttons
    const btnRow = document.createElement('div'); btnRow.style.marginTop='12px';
    const dl = document.createElement('button'); dl.textContent='Descargar factura (HTML)'; dl.className='btn-primary'; dl.addEventListener('click', ()=>{ downloadInvoiceHTML(invoice.innerHTML); });
    const pr = document.createElement('button'); pr.textContent='Imprimir / Guardar como PDF'; pr.className='btn-secondary'; pr.style.marginLeft='8px'; pr.addEventListener('click', ()=>{ openPrintableInvoice(invoice.innerHTML); });
  const pdfBtn = document.createElement('button'); pdfBtn.textContent='Descargar PDF'; pdfBtn.className='btn-primary'; pdfBtn.style.marginLeft='8px';
  pdfBtn.addEventListener('click', async ()=>{ try{ await generateInvoicePDF(cart); }catch(err){ console.error(err); alert('Error generando PDF'); } });
    btnRow.appendChild(dl); btnRow.appendChild(pr);
    btnRow.appendChild(pdfBtn);
    section.appendChild(btnRow);
    // save invoice and purchase history
    // (now handled earlier in checkout flow)
    // if we invoiced the global cart, clear it
    if(!cartArg){ saveCart([]); renderCartCount(); renderCartPanel(); }
    showToast('Compra realizada. Factura generada.');
    return;
  }

  const invoices = getInvoices();
  const clearBtn = document.createElement('button'); clearBtn.className='btn-secondary'; clearBtn.style.marginLeft='12px'; clearBtn.textContent = '➖ Limpiar historial';
  clearBtn.addEventListener('click', ()=>{
    if(!confirm('¿Borrar todo el historial de facturas? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem('invoicesDemo');
    showToast('Historial de facturas limpiado');
    renderFacturas();
  });
  section.appendChild(clearBtn);

  if(invoices.length === 0){
    const p = document.createElement('p'); p.textContent = 'No hay facturas disponibles.'; section.appendChild(p);
  } else {
    invoices.forEach(inv=>{
      const node = buildInvoiceDocument(inv.items || inv, inv);
      const wrapper = document.createElement('div'); wrapper.style.marginBottom='18px'; wrapper.appendChild(node);
      section.appendChild(wrapper);
    });
  }
}

/* Persist invoices and purchases */
function getInvoices(){ try{ return JSON.parse(localStorage.getItem('invoicesDemo')||'[]'); }catch(e){ return []; } }
function saveInvoice(inv){ const list = getInvoices(); list.unshift(inv); localStorage.setItem('invoicesDemo', JSON.stringify(list)); }

function getPurchases(){ try{ return JSON.parse(localStorage.getItem('purchasesDemo')||'[]'); }catch(e){ return []; } }
function savePurchase(rec){ const list = getPurchases(); list.unshift(rec); localStorage.setItem('purchasesDemo', JSON.stringify(list)); }

function buildInvoiceDocument(cartItemsOrRecord, maybeRecord){
  // support being passed either an invoice record {buyer, items, id, date, total}
  let record = null;
  if(Array.isArray(cartItemsOrRecord)) record = {items: cartItemsOrRecord, buyer: (maybeRecord && maybeRecord.buyer) || 'Cliente (demo)', id: Date.now(), date: new Date().toISOString()};
  else record = cartItemsOrRecord || {items: [], buyer: 'Cliente (demo)', id: Date.now(), date: new Date().toISOString()};

  const items = record.items || [];
  const container = document.createElement('div'); container.className='invoice';
  const header = document.createElement('header'); header.innerHTML = `<div><div style="display:flex;align-items:center;gap:12px"><img src="../images/logo.webp" style="width:90px;height:auto"> <div><h1 style="margin:0">Taller Toreto</h1><div style="font-size:13px">Factura</div></div></div></div><div style="text-align:right"><strong>#{${record.id}}</strong><div style="font-size:13px">${new Date(record.date).toLocaleString()}</div></div>`;
  container.appendChild(header);
  const billTo = document.createElement('div'); billTo.className='bill-to'; billTo.innerHTML = `<strong>Cliente:</strong> ${escapeHtml(record.buyer || 'Cliente (demo)')}`; container.appendChild(billTo);

  const table = document.createElement('table');
  // Header columns as requested: #deFactura, nombre, cantidad, precio unitario, precio total
  table.innerHTML = `<thead><tr><th style="width:80px">#Factura</th><th>Nombre</th><th>Cantidad</th><th>Precio unitario</th><th>Precio total</th></tr></thead>`;
  const tbody = document.createElement('tbody'); let total=0;
  items.forEach(it=>{
    const price = Number(it.price||0); const qty = Number(it.qty||1); const sub = price*qty; total+=sub;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(String(record.id))}</td><td>${escapeHtml(it.name||'')}</td><td>${qty}</td><td>$${price.toFixed(2)}</td><td>$${sub.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody); container.appendChild(table);
  // final total row
  const foot = document.createElement('div'); foot.style.display='flex'; foot.style.justifyContent='flex-end'; foot.style.marginTop='12px'; foot.innerHTML = `<div style="font-weight:800;font-size:18px">Total a pagar: $${total.toFixed(2)}</div>`;
  container.appendChild(foot);
  return container;
}

function downloadInvoiceHTML(innerHtml){
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>Factura - Taller Toreto</title><style>body{font-family:Arial;padding:20px}</style></head><body>${innerHtml}</body></html>`;
  const blob = new Blob([doc], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `factura-${Date.now()}.html`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function openPrintableInvoice(innerHtml){
  const w = window.open('', '_blank');
  if(!w) return alert('Permite ventanas emergentes para imprimir');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Factura</title><style>body{font-family:Arial;padding:20px}</style></head><body>${innerHtml}</body></html>`);
  w.document.close();
  setTimeout(()=>{ w.print(); }, 300);
}

// Generate PDF using jsPDF (client-side)
async function loadImageAsDataURL(url){
  try{
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve,reject)=>{
      const reader = new FileReader(); reader.onload = ()=>resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
    });
  }catch(e){ return null; }
}

// Generate PDF using jsPDF (client-side) and include logo if available
async function generateInvoicePDF(cart){
  if(!cart || cart.length===0) return alert('Carrito vacío');
  const { jsPDF } = window.jspdf || {};
  if(!jsPDF) return alert('jsPDF no está disponible');

  // Try load logo and convert to PNG dataURL
  const logoUrl = '../images/logo.webp';
  let logoData = await loadImageAsDataURL(logoUrl);
  // convert to PNG if necessary using canvas
  if(logoData){
    try{
      const img = new Image(); img.src = logoData;
      await new Promise(r=>img.onload = r);
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0);
      logoData = canvas.toDataURL('image/png');
    }catch(e){ logoData = null; }
  }

  const doc = new jsPDF({unit:'pt', format:'a4'});
  const margin = 40; let y = 40;
  if(logoData){ try{ doc.addImage(logoData, 'PNG', margin, y, 80, 40); }catch(e){} }
  doc.setFontSize(18); doc.text('Taller Toreto - Factura', margin + (logoData?100:0), y + 12); y+=48;
  doc.setFontSize(11); doc.text(`Fecha: ${new Date().toLocaleString()}`, margin, y); y+=20;
  doc.text('Cliente: Usuario (demo)', margin, y); y+=24;

  // Table header
  doc.setFontSize(12); doc.text('Producto', margin, y); doc.text('P. Unit', 360, y); doc.text('Cant', 440, y); doc.text('Subtotal', 500, y); y+=8;
  doc.setDrawColor(200); doc.line(margin, y, 560, y); y+=12;
  let total = 0;
  for(const it of cart){
    const name = it.name || '';
    const price = it.price || 0; const qty = it.qty || 1; const sub = price*qty; total += sub;
    doc.setFontSize(11); doc.text(String(name), margin, y);
    doc.text(`$${price.toFixed(2)}`, 360, y);
    doc.text(String(qty), 440, y);
    doc.text(`$${sub.toFixed(2)}`, 500, y);
    y += 18;
    if(y > 750){ doc.addPage(); y = 40; }
  }
  y += 8; doc.setDrawColor(200); doc.line(margin, y, 560, y); y+=18;
  doc.setFontSize(13); doc.text(`Total: $${total.toFixed(2)}`, 420, y);

  const filename = `factura-${Date.now()}.pdf`;
  doc.save(filename);
}

function renderCompras(){
  const section = document.getElementById('compras'); section.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Historial de compras'; section.appendChild(title);
  const clearP = document.createElement('button'); clearP.className='btn-secondary'; clearP.style.marginLeft='12px'; clearP.textContent = '➖ Limpiar historial';
  clearP.addEventListener('click', ()=>{
    if(!confirm('¿Borrar todo el historial de compras?')) return;
    localStorage.removeItem('purchasesDemo');
    showToast('Historial de compras limpiado');
    renderCompras();
  });
  section.appendChild(clearP);
  const purchases = getPurchases();
  if(purchases.length === 0){ const p = document.createElement('p'); p.textContent = 'No tienes compras aún.'; section.appendChild(p); return; }
  const grid = document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(auto-fit,minmax(280px,1fr))'; grid.style.gap='12px';
  purchases.forEach(rec=>{
    const card = document.createElement('div'); card.style.background='rgba(255,255,255,0.03)'; card.style.padding='12px'; card.style.borderRadius='10px';
    const h = document.createElement('h4'); h.textContent = `Compra #${rec.id}`;
    const date = document.createElement('div'); date.style.opacity = 0.9; date.textContent = new Date(rec.date).toLocaleString();
    const total = document.createElement('div'); total.style.fontWeight = '700'; total.textContent = `Total: $${(rec.total||0).toFixed(2)}`;
    const list = document.createElement('div');
    const items = Array.isArray(rec.items) ? rec.items : (rec.cart || []);
    items.forEach(it=>{
      const itEl = document.createElement('div'); itEl.style.display='flex'; itEl.style.gap='8px'; itEl.style.alignItems='center'; itEl.style.marginTop='6px';
      const img = document.createElement('img'); img.src = it.img || '../images/repuestos.jpg'; img.style.width='64px'; img.style.height='44px'; img.style.objectFit='cover'; img.style.borderRadius='6px';
      const meta = document.createElement('div');
      const qty = Number(it.qty||1); const price = Number(it.price||0); const sub = (price*qty).toFixed(2);
      meta.innerHTML = `<div style="font-weight:700">${escapeHtml(it.name||'Item')}</div><div style="opacity:0.9">Unit: $${price.toFixed(2)} &nbsp; x &nbsp; ${qty} = <strong>$${sub}</strong></div>`;
      itEl.appendChild(img); itEl.appendChild(meta); list.appendChild(itEl);
    });
    card.appendChild(h); card.appendChild(date); card.appendChild(total); card.appendChild(list); grid.appendChild(card);
  });
  section.appendChild(grid);
}

function renderAdmin(){
  const section = document.getElementById('admin'); section.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Panel administrativo (demo)'; section.appendChild(title);
  const p = document.createElement('p'); p.textContent = 'Aquí puedes agregar o eliminar repuestos y mecánicos. Los cambios se guardan en localStorage (demo).'; section.appendChild(p);

  // admin data
  const repuestos = getRepuestos();
  const mecanicos = getMecanicos();

  // Repuestos panel
  const repPanel = document.createElement('div'); repPanel.className='admin-panel';
  const rLabel = document.createElement('label'); rLabel.textContent='Agregar repuesto (nombre)'; repPanel.appendChild(rLabel);
  const rInput = document.createElement('input'); rInput.type='text'; rInput.placeholder='Ej: Amortiguador'; repPanel.appendChild(rInput);
  const rBtn = document.createElement('button'); rBtn.textContent='Agregar repuesto';
  rBtn.addEventListener('click', ()=>{ if(!rInput.value.trim()) return alert('Ingresa nombre'); addRepuesto(rInput.value.trim()); rInput.value=''; renderAdmin(); });
  repPanel.appendChild(rBtn);

  const repList = document.createElement('div'); repList.className='admin-list';
  repuestos.forEach((r,i)=>{
    const it = document.createElement('div'); it.className='admin-item';
    const left = document.createElement('div'); left.style.display='flex'; left.style.gap='8px'; left.style.alignItems='center';
    const img = document.createElement('img'); img.src = r.img || '../images/repuestos.jpg'; img.style.width='64px'; img.style.height='48px'; img.style.objectFit='cover'; img.style.borderRadius='6px';
    const info = document.createElement('div'); info.innerHTML = `<div style="font-weight:600">${r.nombre}</div><div style="opacity:0.9">${r.precio ? '$'+r.precio : ''}</div>`;
    left.appendChild(img); left.appendChild(info);
    it.appendChild(left);
    const controls = document.createElement('div');
    const edit = document.createElement('button'); edit.textContent='Editar'; edit.className='btn-secondary'; edit.addEventListener('click', ()=>{ openEditRepuestoModal(i); });
    const del = document.createElement('button'); del.textContent='Eliminar'; del.addEventListener('click', ()=>{ if(confirm('Eliminar repuesto?')){ removeRepuesto(i); renderAdmin(); showToast('Repuesto eliminado'); } });
    controls.appendChild(edit); controls.appendChild(del);
    it.appendChild(controls);
    repList.appendChild(it);
  });
  repPanel.appendChild(repList);

  // Mecanicos panel
  const mecPanel = document.createElement('div'); mecPanel.className='admin-panel';
  const mLabel = document.createElement('label'); mLabel.textContent='Agregar mecánico (nombre)'; mecPanel.appendChild(mLabel);
  const mInput = document.createElement('input'); mInput.type='text'; mInput.placeholder='Ej: Pedro Ruiz'; mecPanel.appendChild(mInput);
  const mBtn = document.createElement('button'); mBtn.textContent='Agregar mecánico';
  mBtn.addEventListener('click', ()=>{ if(!mInput.value.trim()) return alert('Ingresa nombre'); addMecanico(mInput.value.trim()); mInput.value=''; renderAdmin(); });
  mecPanel.appendChild(mBtn);

  const mecList = document.createElement('div'); mecList.className='admin-list';
  mecanicos.forEach((m,i)=>{
    const it = document.createElement('div'); it.className='admin-item';
    const left = document.createElement('div'); left.style.display='flex'; left.style.gap='8px'; left.style.alignItems='center';
    const img = document.createElement('img'); img.src = m.photo || '../images/mecanico.jpg'; img.style.width='64px'; img.style.height='48px'; img.style.objectFit='cover'; img.style.borderRadius='6px';
    const info = document.createElement('div'); info.innerHTML = `<div style="font-weight:600">${m.nombre}</div><div style="opacity:0.9">${m.contacto || ''}</div>`;
    left.appendChild(img); left.appendChild(info);
    it.appendChild(left);
    const controls = document.createElement('div');
    const edit = document.createElement('button'); edit.textContent='Editar'; edit.className='btn-secondary'; edit.addEventListener('click', ()=>{ openEditMecanicoModal(i); });
    const del = document.createElement('button'); del.textContent='Eliminar'; del.addEventListener('click', ()=>{ if(confirm('Eliminar mecánico?')){ removeMecanico(i); renderAdmin(); showToast('Mecánico eliminado'); } });
    controls.appendChild(edit); controls.appendChild(del);
    it.appendChild(controls);
    mecList.appendChild(it);
  });
  mecPanel.appendChild(mecList);

  section.appendChild(repPanel); section.appendChild(mecPanel);
}

/* Admin storage helpers */
function getRepuestos(){
  const raw = localStorage.getItem('repuestosDemo');
  // file mapping (title -> filename in images/repuestos)
  const imgMap = {
    'Amortiguador':'amortiguadores.webp',
    'Filtro de aceite':'filtro aceite.jpg',
    'Bujía':'bujia.webp',
    'Batería':'bateria.webp',
    'Alternador':'alternador.jpg',
    'Radiador':'radiador.webp',
    'Correa de distribución':'correa.jpg',
    'Pastillas de freno':'Pastillas-de-freno.jpg',
    'Disco de freno':'disco freno.jpg',
    'Sensor de oxígeno':'sensor-oxigeno.png',
    'Neumático moto':'neumatico.webp',
    'Cadena de transmisión':'cadena.webp',
    'Piñón':'piñon.webp',
    'Kit arrastre':'kit-arrastre.webp',
    'Pastillas freno moto':'Pastillas-de-freno.jpg',
    'Filtro aire moto':'filtro-aire.webp',
    'Bujía moto':'bujia.webp',
    'Manillar':'manillar.jpg',
    'Escape moto':'escape.webp'
  };
  if(raw){
    try{
      const arr = JSON.parse(raw);
      let changed = false;
      arr.forEach(it=>{
        if(!it.img || it.img === '../images/repuestos.jpg' || it.img.endsWith('repuestos.jpg')){
          const candidate = imgMap[it.nombre] || null;
          if(candidate){ it.img = `../images/repuestos/${candidate}`; changed = true; }
        }
      });
      if(changed) localStorage.setItem('repuestosDemo', JSON.stringify(arr));
      return arr;
    }catch(e){ console.warn('repuestos parse error', e); }
  }
  // create a concise demo set and map to actual uploaded images by filename
  const brands = ['Bosch','Valeo','Brembo','Denso','NGK','K&N','Motul','Castrol','Mahle','SKF'];
  const car = ['Amortiguador','Filtro de aceite','Bujía','Batería','Alternador','Radiador','Correa de distribución','Pastillas de freno','Disco de freno','Sensor de oxígeno'];
  const moto = ['Neumático moto','Cadena de transmisión','Piñón','Kit arrastre','Pastillas freno moto','Filtro aire moto','Bujía moto','Amortiguador moto','Manillar','Escape moto'];
  const parts = [];
  car.forEach((name,i)=> parts.push({nombre:name, precio: Math.round(30 + i*5), descripcion:`Repuesto para auto: ${name}`, img:`../images/repuestos/${imgMap[name]||'repuestos.jpg'}`, brand: brands[i%brands.length], type:'car'}));
  moto.forEach((name,i)=> parts.push({nombre:name, precio: Math.round(25 + i*4), descripcion:`Repuesto para moto: ${name}`, img:`../images/repuestos/${imgMap[name]||'repuestos.jpg'}`, brand: brands[(i+3)%brands.length], type:'moto'}));
  localStorage.setItem('repuestosDemo', JSON.stringify(parts));
  return parts;
}

function getServices(){
  const raw = localStorage.getItem('servicesDemo'); if(raw) return JSON.parse(raw);
  const services = [];
  const list = ['Cambio de aceite','Alineación','Balanceo','Revisión general','Cambio de pastillas de freno','Cambio de discos','Lavado y detallado','Revisión de suspensión','Diagnóstico electrónico','Revisión de frenos'];
  // map service titles to images in images/servicios (you stored 3 service images there)
  const svcImg = {
    'Cambio de aceite':'mantenimiento.jpg',
    'Alineación':'mecanico.jpg',
    'Balanceo':'mantenimiento.jpg',
    'Revisión general':'mantenimiento.jpg',
    'Cambio de pastillas de freno':'mantenimiento.jpg',
    'Cambio de discos':'mantenimiento.jpg',
    'Lavado y detallado':'mantenimiento.jpg',
    'Revisión de suspensión':'mantenimiento.jpg',
    'Diagnóstico electrónico':'mecanico.jpg',
    'Revisión de frenos':'mantenimiento.jpg'
  };
  list.forEach((s,i)=> services.push({title:s, desc:`Servicio de ${s}`, price: Math.round(25 + i*5), img:`../images/servicios/${svcImg[s]||'mantenimiento.jpg'}`}));
  localStorage.setItem('servicesDemo', JSON.stringify(services));
  return services;
}
function addRepuesto(obj){
  const list = getRepuestos(); list.push(obj); localStorage.setItem('repuestosDemo', JSON.stringify(list));
}
function updateRepuesto(index, obj){
  const list = getRepuestos(); list[index] = obj; localStorage.setItem('repuestosDemo', JSON.stringify(list));
}
function removeRepuesto(index){
  const list = getRepuestos(); list.splice(index,1); localStorage.setItem('repuestosDemo', JSON.stringify(list));
}

function getMecanicos(){
  const raw = localStorage.getItem('mecanicosDemo');
  if(raw) return JSON.parse(raw);
  const defaults = [
    {nombre:'Carlos Méndez', contacto:'carlos@example.com', photo:'../images/mecanico.jpg'},
    {nombre:'Ana Torres', contacto:'ana@example.com', photo:'../images/mecanico.jpg'}
  ];
  localStorage.setItem('mecanicosDemo', JSON.stringify(defaults));
  return defaults;
}
function addMecanico(obj){
  const list = getMecanicos(); list.push(obj); localStorage.setItem('mecanicosDemo', JSON.stringify(list));
}
function updateMecanico(index, obj){
  const list = getMecanicos(); list[index] = obj; localStorage.setItem('mecanicosDemo', JSON.stringify(list));
}
function removeMecanico(index){
  const list = getMecanicos(); list.splice(index,1); localStorage.setItem('mecanicosDemo', JSON.stringify(list));
}

// Expose a tiny helper to change role quickly (demo only)
window.__setDemoRole = function(role){
  localStorage.setItem('demoRole', role); alert('Role cambiado a '+role+'; recarga la página para ver efecto.');
};

/* Modal & toasts */
function setupModal(){
  const modal = document.getElementById('modal');
  const close = document.getElementById('modalClose');
  close.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
}

function openModal(html){
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody'); body.innerHTML = ''; body.appendChild(html);
  modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false');
}

function closeModal(){
  const modal = document.getElementById('modal'); modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true');
}

function showToast(msg, timeout=3000){
  const container = document.getElementById('toasts');
  const t = document.createElement('div'); t.className='toast'; t.textContent = msg; container.appendChild(t);
  setTimeout(()=>{ t.style.transform='translateY(10px)'; t.style.opacity='0.1'; setTimeout(()=>t.remove(),300); }, timeout);
}

function fileToDataURL(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Edit Repuesto modal */
function openEditRepuestoModal(index){
  const repuestos = getRepuestos();
  const data = repuestos[index] || {nombre:'', precio:0, descripcion:'', img:''};
  const form = document.createElement('div');
  form.innerHTML = `
    <h3>Editar repuesto</h3>
    <div class="form-row">
      <div class="col">
        <div class="form-field"><label>Nombre</label><input id="rep-nombre" type="text" value="${escapeHtml(data.nombre)}"></div>
        <div class="form-field"><label>Precio</label><input id="rep-precio" type="number" value="${data.precio || 0}" step="0.01"></div>
        <div class="form-field"><label>Descripción</label><textarea id="rep-desc">${escapeHtml(data.descripcion || '')}</textarea></div>
      </div>
      <div class="col">
        <div class="form-field"><label>Imagen (opcional)</label><input id="rep-img" type="file" accept="image/*"></div>
        <div style="margin-top:8px"><img id="rep-preview" src="${data.img || '../images/repuestos.jpg'}" style="width:100%;height:160px;object-fit:cover;border-radius:6px"></div>
      </div>
    </div>
    <div class="form-actions"><button id="rep-save" class="btn-primary">Guardar</button><button id="rep-cancel" class="btn-secondary">Cancelar</button></div>
  `;

  openModal(form);

  const fileInput = document.getElementById('rep-img');
  const preview = document.getElementById('rep-preview');
  fileInput.addEventListener('change', async (e)=>{ if(e.target.files && e.target.files[0]){ const url = await fileToDataURL(e.target.files[0]); preview.src = url; }});

  document.getElementById('rep-cancel').addEventListener('click', ()=>{ closeModal(); });
  document.getElementById('rep-save').addEventListener('click', async ()=>{
    const nombre = document.getElementById('rep-nombre').value.trim();
    const precio = parseFloat(document.getElementById('rep-precio').value) || 0;
    const descripcion = document.getElementById('rep-desc').value.trim();
    const imgsrc = preview.src;
    if(!nombre) return alert('Nombre requerido');
    const obj = {nombre, precio, descripcion, img: imgsrc};
    updateRepuesto(index, obj);
    closeModal(); renderAdmin(); showToast('Repuesto actualizado');
  });
}

/* Edit Mecanico modal */
function openEditMecanicoModal(index){
  const mecanicos = getMecanicos();
  const data = mecanicos[index] || {nombre:'', contacto:'', photo:''};
  const form = document.createElement('div');
  form.innerHTML = `
    <h3>Editar mecánico</h3>
    <div class="form-row">
      <div class="col">
        <div class="form-field"><label>Nombre</label><input id="mec-nombre" type="text" value="${escapeHtml(data.nombre)}"></div>
        <div class="form-field"><label>Contacto</label><input id="mec-contacto" type="text" value="${escapeHtml(data.contacto || '')}"></div>
      </div>
      <div class="col">
        <div class="form-field"><label>Foto (opcional)</label><input id="mec-photo" type="file" accept="image/*"></div>
        <div style="margin-top:8px"><img id="mec-preview" src="${data.photo || '../images/mecanico.jpg'}" style="width:100%;height:160px;object-fit:cover;border-radius:6px"></div>
      </div>
    </div>
    <div class="form-actions"><button id="mec-save" class="btn-primary">Guardar</button><button id="mec-cancel" class="btn-secondary">Cancelar</button></div>
  `;
  openModal(form);

  const fileInput = document.getElementById('mec-photo');
  const preview = document.getElementById('mec-preview');
  fileInput.addEventListener('change', async (e)=>{ if(e.target.files && e.target.files[0]){ const url = await fileToDataURL(e.target.files[0]); preview.src = url; }});

  document.getElementById('mec-cancel').addEventListener('click', ()=>{ closeModal(); });
  document.getElementById('mec-save').addEventListener('click', async ()=>{
    const nombre = document.getElementById('mec-nombre').value.trim();
    const contacto = document.getElementById('mec-contacto').value.trim();
    const photo = preview.src;
    if(!nombre) return alert('Nombre requerido');
    const obj = {nombre, contacto, photo};
    updateMecanico(index, obj);
    closeModal(); renderAdmin(); showToast('Mecánico actualizado');
  });
}

function escapeHtml(str){ return (str+'').replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

