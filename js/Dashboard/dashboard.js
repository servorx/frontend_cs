// Normalize role strings (accept variants and return one of: admin, mecanico, cliente, proveedor)
function normalizeRole(r){
  if(!r) return 'cliente';
  const s = String(r).toLowerCase();
  if(s.includes('admin') || s === 'administrador') return 'admin';
  if(s.includes('mecan') || s === 'mecanico') return 'mecanico';
  if(s.includes('prove') || s === 'proveedor' || s === 'provedor') return 'proveedor';
  return 'cliente';
}
// Initialize dashboard UI when DOM is ready
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    // determine and expose the current role globally for the rest of the script
    window.currentRole = normalizeRole(detectRole());

    // wire core UI helpers
    if(typeof setupModal === 'function') setupModal();
    if(typeof initNav === 'function') initNav();
    if(typeof setupGlobalHandlers === 'function') setupGlobalHandlers();
    if(typeof setupNavLinks === 'function') setupNavLinks();
    if(typeof setupSearchAndCart === 'function') setupSearchAndCart();

    // render the user menu according to role
    if(typeof renderRoleMenu === 'function') renderRoleMenu();

    // initial navigation based on role
    if(window.currentRole === 'admin') navigateTo('admin');
    else if(window.currentRole === 'mecanico') navigateTo('vehiculos');
    else navigateTo('home');
  }catch(err){ console.error('Dashboard init error', err); }
});
// Determina el rol: primero desde query param ?role=, luego localStorage, sino por defecto 'cliente'
function detectRole(){
  try{
    const params = new URLSearchParams(window.location.search);
    const r = params.get('role');
    if(r) return normalizeRole(r);
    const stored = localStorage.getItem('demoRole');
    if(stored) return normalizeRole(stored);
    return 'cliente';
  }catch(e){ console.warn('detectRole error', e); return 'cliente'; }
}

// Normalize legacy purchases/invoices shapes stored in localStorage
function normalizeStorage(){
  try{
    const purchases = JSON.parse(localStorage.getItem('purchasesDemo')||'[]');
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
    localStorage.setItem('purchasesDemo', JSON.stringify(normalized));
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

// run a quick normalization on load
normalizeStorage();

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
  const r = normalizeRole(role);
  if(r === 'mecanico'){
    return [
      {label:'Vehículos pendientes', section:'vehiculos'},
      {label:'Agenda de trabajo', section:'home'},
      {label:'Consultar proveedor', section:'home'}
    ];
  }
  if(r === 'cliente'){
    return [
      {label:'Facturas', section:'facturas'},
      {label:'Compras', section:'compras'}
    ];
  }
  if(r === 'admin'){
    return [
      {label:'Editar contenido', section:'admin-editor'},
      {label:'Empleados / Proveedores', section:'empleados-proveedores'},
      {label:'Notificaciones', section:'notificaciones'},
      {label:'Asignar tarea', section:'asignar-tarea'}
    ];
  }
  return [];
}

/* Helpers to show admin-only controls */
function createAdminControls(wrapper, onEdit, onDelete){
  if(currentRole !== 'admin') return;
  const ctr = document.createElement('div'); ctr.style.position='absolute'; ctr.style.right='8px'; ctr.style.top='8px'; ctr.style.display='flex'; ctr.style.gap='6px';
  const edit = document.createElement('button'); edit.innerHTML='✏️'; edit.title='Editar'; edit.className='btn-secondary'; edit.addEventListener('click', onEdit);
  const del = document.createElement('button'); del.innerHTML='➖'; del.title='Eliminar'; del.className='btn-secondary'; del.addEventListener('click', onDelete);
  ctr.appendChild(edit); ctr.appendChild(del); wrapper.style.position='relative'; wrapper.appendChild(ctr);
}

/* Admin: Editor de contenido (editar tarjetas de cliente) */
function renderAdminEditor(){
  const section = document.getElementById('admin'); section.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Editor de contenido'; section.appendChild(title);

  // Social links (demo)
  const socials = JSON.parse(localStorage.getItem('socialsDemo')|| JSON.stringify([
    {id:1, name:'WhatsApp', url:'https://wa.me/123456789', img:'../images/bancos/nequi.jpg'},
    {id:2, name:'Instagram', url:'https://instagram.com/', img:'../images/bancos/bbva.jpg'}
  ]));
  const sWrap = document.createElement('div'); sWrap.innerHTML = '<h3>Redes sociales</h3>'; const sGrid = document.createElement('div'); sGrid.className='cards';
  socials.forEach((s,i)=>{
    const c = document.createElement('article'); c.className='card'; c.style.padding='12px'; c.innerHTML = `<img src="${s.img}" style="height:120px;object-fit:cover"><h4>${escapeHtml(s.name)}</h4><p style="word-break:break-all">${escapeHtml(s.url)}</p>`;
    createAdminControls(c, ()=> openEditSocialModal(i), ()=>{ if(confirm('Eliminar red social?')){ socials.splice(i,1); localStorage.setItem('socialsDemo', JSON.stringify(socials)); renderAdminEditor(); } });
    sGrid.appendChild(c);
  });
  // add new social card
  const addCard = document.createElement('article'); addCard.className='card'; addCard.style.display='flex'; addCard.style.alignItems='center'; addCard.style.justifyContent='center'; addCard.innerHTML = `<button id="addSocial" class="btn-primary">➕ Agregar red social</button>`;
  addCard.querySelector('#addSocial').addEventListener('click', ()=> openAddSocialModal());
  sGrid.appendChild(addCard);
  sWrap.appendChild(sGrid); section.appendChild(sWrap);

  // Repuestos (reuse getRepuestos)
  const repuestos = getRepuestos();
  const rWrap = document.createElement('div'); rWrap.innerHTML = '<h3 style="margin-top:16px">Repuestos</h3>'; const rGrid = document.createElement('div'); rGrid.className='cards';
  repuestos.forEach((r,i)=>{
    const c = document.createElement('article'); c.className='card'; c.style.padding='8px'; c.innerHTML = `<img src="${r.img}" style="height:120px;object-fit:cover"><h4>${escapeHtml(r.nombre)}</h4><p>${escapeHtml(r.descripcion||'')}</p><div style="font-weight:700">$${(r.precio||0).toFixed(2)}</div>`;
    createAdminControls(c, ()=> openEditRepuestoModal(i), ()=>{ if(confirm('Eliminar repuesto?')){ removeRepuesto(i); renderAdminEditor(); } });
    rGrid.appendChild(c);
  });
  const addRep = document.createElement('article'); addRep.className='card'; addRep.style.display='flex'; addRep.style.alignItems='center'; addRep.style.justifyContent='center'; addRep.innerHTML = `<button id="addRepuestoAdmin" class="btn-primary">➕ Agregar repuesto</button>`;
  addRep.querySelector('#addRepuestoAdmin').addEventListener('click', ()=> openAddRepuestoModal()); rGrid.appendChild(addRep);
  rWrap.appendChild(rGrid); section.appendChild(rWrap);

  // Services (mantenimientos)
  const services = getServices();
  const svWrap = document.createElement('div'); svWrap.innerHTML = '<h3 style="margin-top:16px">Servicios / Mantenimientos</h3>'; const svGrid = document.createElement('div'); svGrid.className='cards';
  services.forEach((s,i)=>{
    const c = document.createElement('article'); c.className='card'; c.style.padding='8px'; c.innerHTML = `<img src="${s.img}" style="height:120px;object-fit:cover"><h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(s.desc||'')}</p><div style="font-weight:700">$${(s.price||0).toFixed(2)}</div>`;
    createAdminControls(c, ()=> openEditServiceModal(i), ()=>{ if(confirm('Eliminar servicio?')){ const arr = getServices(); arr.splice(i,1); localStorage.setItem('servicesDemo', JSON.stringify(arr)); renderAdminEditor(); } });
    svGrid.appendChild(c);
  });
  const addSvc = document.createElement('article'); addSvc.className='card'; addSvc.style.display='flex'; addSvc.style.alignItems='center'; addSvc.style.justifyContent='center'; addSvc.innerHTML = `<button id="addServiceAdmin" class="btn-primary">➕ Agregar servicio</button>`;
  addSvc.querySelector('#addServiceAdmin').addEventListener('click', ()=> openAddServiceModal()); svGrid.appendChild(addSvc);
  svWrap.appendChild(svGrid); section.appendChild(svWrap);

  // save current state to localStorage for persistence
  localStorage.setItem('socialsDemo', JSON.stringify(socials));
}

/* Modals for admin add/edit */
function openAddSocialModal(){
  const node = document.createElement('div'); node.innerHTML = `<h3>Agregar red social</h3><form id="addSocialForm"><div class="form-field"><label>Nombre</label><input id="soc-name" type="text" required></div><div class="form-field"><label>URL</label><input id="soc-url" type="text" required></div><div class="form-field"><label>Imagen (ruta)</label><input id="soc-img" type="text"></div><div class="form-actions"><button id="soc-save" class="btn-primary">Agregar</button><button id="soc-cancel" class="btn-secondary" type="button">Cancelar</button></div></form>`;
  openModal(node);
  document.getElementById('soc-cancel').addEventListener('click', closeModal);
  document.getElementById('soc-save').addEventListener('click', ()=>{
    const name = document.getElementById('soc-name').value.trim(); const url = document.getElementById('soc-url').value.trim(); const img = document.getElementById('soc-img').value.trim() || '../images/bancos/nequi.jpg';
    if(!name || !url) return alert('Nombre y URL requeridos');
    const socials = JSON.parse(localStorage.getItem('socialsDemo')||'[]'); socials.push({id:Date.now(), name, url, img}); localStorage.setItem('socialsDemo', JSON.stringify(socials)); closeModal(); renderAdminEditor();
  });
}

function openEditSocialModal(index){
  const socials = JSON.parse(localStorage.getItem('socialsDemo')||'[]'); const data = socials[index];
  const node = document.createElement('div'); node.innerHTML = `<h3>Editar red social</h3><form id="editSocialForm"><div class="form-field"><label>Nombre</label><input id="soc-name" type="text" value="${escapeHtml(data.name)}" required></div><div class="form-field"><label>URL</label><input id="soc-url" type="text" value="${escapeHtml(data.url)}" required></div><div class="form-field"><label>Imagen (ruta)</label><input id="soc-img" type="text" value="${escapeHtml(data.img||'')}"></div><div class="form-actions"><button id="soc-save" class="btn-primary">Guardar</button><button id="soc-cancel" class="btn-secondary" type="button">Cancelar</button></div></form>`;
  openModal(node); document.getElementById('soc-cancel').addEventListener('click', closeModal);
  document.getElementById('soc-save').addEventListener('click', ()=>{
    data.name = document.getElementById('soc-name').value.trim(); data.url = document.getElementById('soc-url').value.trim(); data.img = document.getElementById('soc-img').value.trim() || data.img; socials[index] = data; localStorage.setItem('socialsDemo', JSON.stringify(socials)); closeModal(); renderAdminEditor();
  });
}

function openAddRepuestoModal(){
  // reuse edit modal structure but treat as add
  const node = document.createElement('div'); node.innerHTML = `<h3>Agregar repuesto</h3><form id="addRepForm">
    <div class="form-field"><label>Nombre</label><input id="rep-nombre" type="text" required></div>
    <div class="form-field"><label>Precio</label><input id="rep-precio" type="number" value="0" required></div>
    <div class="form-field"><label>Descripción</label><textarea id="rep-desc"></textarea></div>
    <div class="form-field"><label>Imagen (ruta)</label><input id="rep-img" type="text"></div>
    <div class="form-actions"><button id="rep-save" class="btn-primary">Agregar</button><button id="rep-cancel" class="btn-secondary" type="button">Cancelar</button></div>
  </form>`;
  openModal(node); document.getElementById('rep-cancel').addEventListener('click', closeModal);
  document.getElementById('rep-save').addEventListener('click', ()=>{
    const nombre = document.getElementById('rep-nombre').value.trim(); const precio = Number(document.getElementById('rep-precio').value||0); const desc = document.getElementById('rep-desc').value.trim(); const img = document.getElementById('rep-img').value.trim() || '../images/repuestos/repuestos.jpg';
    const list = getRepuestos(); list.push({nombre, precio, descripcion:desc, img}); localStorage.setItem('repuestosDemo', JSON.stringify(list)); closeModal(); renderAdminEditor();
  });
}

function openAddServiceModal(){
  const node = document.createElement('div'); node.innerHTML = `<h3>Agregar servicio</h3><form id="addSvcForm"><div class="form-field"><label>Título</label><input id="svc-title" type="text" required></div><div class="form-field"><label>Descripción</label><textarea id="svc-desc"></textarea></div><div class="form-field"><label>Precio</label><input id="svc-price" type="number" value="0"></div><div class="form-field"><label>Imagen (ruta)</label><input id="svc-img" type="text"></div><div class="form-actions"><button id="svc-save" class="btn-primary">Agregar</button><button id="svc-cancel" class="btn-secondary" type="button">Cancelar</button></div></form>`;
  openModal(node); document.getElementById('svc-cancel').addEventListener('click', closeModal);
  document.getElementById('svc-save').addEventListener('click', ()=>{
    const title = document.getElementById('svc-title').value.trim(); const desc = document.getElementById('svc-desc').value.trim(); const price = Number(document.getElementById('svc-price').value||0); const img = document.getElementById('svc-img').value.trim() || '../images/servicios/mantenimiento.jpg';
    const list = getServices(); list.push({title, desc, price, img}); localStorage.setItem('servicesDemo', JSON.stringify(list)); closeModal(); renderAdminEditor();
  });
}

function openEditServiceModal(index){
  const list = getServices(); const data = list[index];
  const node = document.createElement('div'); node.innerHTML = `<h3>Editar servicio</h3><form id="editSvcForm"><div class="form-field"><label>Título</label><input id="svc-title" type="text" value="${escapeHtml(data.title)}"></div><div class="form-field"><label>Descripción</label><textarea id="svc-desc">${escapeHtml(data.desc||'')}</textarea></div><div class="form-field"><label>Precio</label><input id="svc-price" type="number" value="${data.price||0}"></div><div class="form-field"><label>Imagen (ruta)</label><input id="svc-img" type="text" value="${escapeHtml(data.img||'')}"></div><div class="form-actions"><button id="svc-save" class="btn-primary">Guardar</button><button id="svc-cancel" class="btn-secondary" type="button">Cancelar</button></div></form>`;
  openModal(node); document.getElementById('svc-cancel').addEventListener('click', closeModal);
  document.getElementById('svc-save').addEventListener('click', ()=>{ data.title = document.getElementById('svc-title').value.trim(); data.desc = document.getElementById('svc-desc').value.trim(); data.price = Number(document.getElementById('svc-price').value||0); data.img = document.getElementById('svc-img').value.trim() || data.img; list[index] = data; localStorage.setItem('servicesDemo', JSON.stringify(list)); closeModal(); renderAdminEditor(); });
}

/* Empleados / Proveedores management */
function renderEmpleadosProveedores(){
  const section = document.getElementById('admin'); section.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Empleados / Proveedores'; section.appendChild(title);
  const tabs = document.createElement('div'); tabs.style.display='flex'; tabs.style.gap='12px';
  const btnE = document.createElement('button'); btnE.textContent='Empleados'; const btnP = document.createElement('button'); btnP.textContent='Proveedores';
  tabs.appendChild(btnE); tabs.appendChild(btnP); section.appendChild(tabs);
  const content = document.createElement('div'); content.style.marginTop='12px'; section.appendChild(content);
  btnE.addEventListener('click', ()=> renderEmpleados(content));
  btnP.addEventListener('click', ()=> renderProveedores(content));
  // show empleados by default
  renderEmpleados(content);
}

function renderEmpleados(containerEl){
  containerEl.innerHTML = '';
  const empleados = JSON.parse(localStorage.getItem('empleadosDemo')||'[]');
  const grid = document.createElement('div'); grid.className='cards';
  empleados.forEach((emp,i)=>{
    const c = document.createElement('article'); c.className='card'; c.style.padding='8px'; c.innerHTML = `<img src="${emp.photo||'../images/mecanico.jpg'}" style="height:120px;object-fit:cover"><h4>${escapeHtml(emp.nombre)}</h4><p>${escapeHtml(emp.contacto||'')}</p>`;
    createAdminControls(c, ()=> openEditEmpleadoModal(i), ()=>{ if(confirm('Eliminar empleado?')){ empleados.splice(i,1); localStorage.setItem('empleadosDemo', JSON.stringify(empleados)); renderEmpleados(containerEl); } });
    grid.appendChild(c);
  });
  const addCard = document.createElement('article'); addCard.className='card'; addCard.style.display='flex'; addCard.style.alignItems='center'; addCard.style.justifyContent='center'; addCard.innerHTML = `<button id="addEmpleado" class="btn-primary">➕ Agregar empleado</button>`;
  addCard.querySelector('#addEmpleado').addEventListener('click', ()=> openAddEmpleadoModal(containerEl)); grid.appendChild(addCard);
  containerEl.appendChild(grid);
}

function renderProveedores(containerEl){
  containerEl.innerHTML = '';
  const provs = JSON.parse(localStorage.getItem('proveedoresDemo')||'[]');
  const grid = document.createElement('div'); grid.className='cards';
  provs.forEach((p,i)=>{
    const c = document.createElement('article'); c.className='card'; c.style.padding='8px'; c.innerHTML = `<img src="${p.photo||'../images/repuestos.jpg'}" style="height:120px;object-fit:cover"><h4>${escapeHtml(p.nombre)}</h4><p>${escapeHtml(p.empresa||'')}</p><p>${escapeHtml(p.contacto||'')}</p>`;
    createAdminControls(c, ()=> openEditProveedorModal(i), ()=>{ if(confirm('Eliminar proveedor?')){ provs.splice(i,1); localStorage.setItem('proveedoresDemo', JSON.stringify(provs)); renderProveedores(containerEl); } });
    grid.appendChild(c);
  });
  const addCard = document.createElement('article'); addCard.className='card'; addCard.style.display='flex'; addCard.style.alignItems='center'; addCard.style.justifyContent='center'; addCard.innerHTML = `<button id="addProveedor" class="btn-primary">➕ Agregar proveedor</button>`;
  addCard.querySelector('#addProveedor').addEventListener('click', ()=> openAddProveedorModal(containerEl)); grid.appendChild(addCard);
  containerEl.appendChild(grid);
}

function openAddEmpleadoModal(containerEl){
  const node = document.createElement('div'); node.innerHTML = `<h3>Agregar empleado</h3><form id="addEmpForm"><div class="form-field"><label>Nombre</label><input id="emp-nombre" type="text" required></div><div class="form-field"><label>Teléfono</label><input id="emp-tel" type="text"></div><div class="form-field"><label>Correo</label><input id="emp-mail" type="email"></div><div class="form-field"><label>Usuario</label><input id="emp-username" type="text" required></div><div class="form-field"><label>Contraseña</label><input id="emp-pass" type="password" required></div><div class="form-field"><label>Foto (archivo)</label><input id="emp-photo-file" type="file" accept="image/*"></div><div class="form-field"><label>Documento (PDF)</label><input id="emp-doc-file" type="file" accept="application/pdf"></div><div class="form-field"><label>O usar ruta (opcional)</label><input id="emp-photo" type="text" placeholder="ruta o DataURL"></div><div class="form-actions"><button id="emp-save" class="btn-primary">Agregar</button><button id="emp-cancel" class="btn-secondary" type="button">Cancelar</button></div></form>`;
  openModal(node); document.getElementById('emp-cancel').addEventListener('click', closeModal);
  // helper to read file as DataURL
  function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const fr = new FileReader(); fr.onload = ()=> res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
  document.getElementById('emp-save').addEventListener('click', async (e)=>{
    e.preventDefault();
    const nombre = document.getElementById('emp-nombre').value.trim(); const tel = document.getElementById('emp-tel').value.trim(); const mail = document.getElementById('emp-mail').value.trim(); const username = document.getElementById('emp-username').value.trim(); const pass = document.getElementById('emp-pass').value.trim();
    const photoInput = document.getElementById('emp-photo-file'); const docInput = document.getElementById('emp-doc-file');
    let photo = document.getElementById('emp-photo').value.trim() || '';
    let doc = '';
    if(photoInput && photoInput.files && photoInput.files[0]){ try{ photo = await readFileAsDataURL(photoInput.files[0]); }catch(e){ console.warn('photo read err', e); } }
    if(docInput && docInput.files && docInput.files[0]){ try{ doc = await readFileAsDataURL(docInput.files[0]); }catch(e){ console.warn('doc read err', e); } }
    if(!photo) photo = '../images/mecanico.jpg';
    if(!nombre||!username||!pass) return alert('Nombre, usuario y contraseña requeridos');
    const list = JSON.parse(localStorage.getItem('empleadosDemo')||'[]'); list.push({nombre, contacto:mail||tel, username, password:pass, photo, doc}); localStorage.setItem('empleadosDemo', JSON.stringify(list)); closeModal(); renderEmpleados(containerEl);
  });
}

function openEditEmpleadoModal(index){
  const list = JSON.parse(localStorage.getItem('empleadosDemo')||'[]'); const data = list[index] || {};
  const node = document.createElement('div'); node.innerHTML = `<h3>Editar empleado</h3><form id="editEmpForm"><div class="form-field"><label>Nombre</label><input id="emp-nombre" type="text" value="${escapeHtml(data.nombre||'')}"></div><div class="form-field"><label>Teléfono / Correo</label><input id="emp-contact" type="text" value="${escapeHtml(data.contacto||'')}"></div><div class="form-field"><label>Usuario</label><input id="emp-username" type="text" value="${escapeHtml(data.username||'')}"></div><div class="form-field"><label>Contraseña</label><input id="emp-pass" type="password" value="${escapeHtml(data.password||'')}"></div><div class="form-field"><label>Foto (archivo)</label><input id="emp-photo-file" type="file" accept="image/*"></div><div class="form-field"><label>Documento (PDF)</label><input id="emp-doc-file" type="file" accept="application/pdf"></div><div class="form-field"><label>O usar ruta / DataURL</label><input id="emp-photo" type="text" value="${escapeHtml(data.photo||'')}"></div><div class="form-actions"><button id="emp-save" class="btn-primary">Guardar</button><button id="emp-cancel" class="btn-secondary" type="button">Cancelar</button></div></form>`;
  openModal(node); document.getElementById('emp-cancel').addEventListener('click', closeModal);
  function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const fr = new FileReader(); fr.onload = ()=> res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
  document.getElementById('emp-save').addEventListener('click', async (e)=>{ e.preventDefault(); data.nombre = document.getElementById('emp-nombre').value.trim(); data.contacto = document.getElementById('emp-contact').value.trim(); data.username = document.getElementById('emp-username').value.trim(); data.password = document.getElementById('emp-pass').value.trim();
    const photoInput = document.getElementById('emp-photo-file'); const docInput = document.getElementById('emp-doc-file');
    let photoVal = document.getElementById('emp-photo').value.trim() || '';
    if(photoInput && photoInput.files && photoInput.files[0]){ try{ photoVal = await readFileAsDataURL(photoInput.files[0]); }catch(e){ console.warn('photo read err', e); } }
    let docVal = data.doc || '';
    if(docInput && docInput.files && docInput.files[0]){ try{ docVal = await readFileAsDataURL(docInput.files[0]); }catch(e){ console.warn('doc read err', e); } }
    data.photo = photoVal || data.photo || '../images/mecanico.jpg'; data.doc = docVal || data.doc || '';
    list[index] = data; localStorage.setItem('empleadosDemo', JSON.stringify(list)); closeModal(); renderEmpleados(document.querySelector('#admin .cards'));
  });
}

function openAddProveedorModal(containerEl){
  const node = document.createElement('div'); node.innerHTML = `<h3>Agregar proveedor</h3><form id="addProvForm"><div class="form-field"><label>Nombre</label><input id="prov-nombre" type="text" required></div><div class="form-field"><label>Empresa</label><input id="prov-empresa" type="text"></div><div class="form-field"><label>Teléfono</label><input id="prov-tel" type="text"></div><div class="form-field"><label>Correo</label><input id="prov-mail" type="email"></div><div class="form-field"><label>Usuario</label><input id="prov-username" type="text" required></div><div class="form-field"><label>Contraseña</label><input id="prov-pass" type="password" required></div><div class="form-field"><label>Foto (archivo)</label><input id="prov-photo-file" type="file" accept="image/*"></div><div class="form-field"><label>Documento (PDF)</label><input id="prov-doc-file" type="file" accept="application/pdf"></div><div class="form-field"><label>O usar ruta (opcional)</label><input id="prov-photo" type="text" placeholder="ruta o DataURL"></div><div class="form-actions"><button id="prov-save" class="btn-primary">Agregar</button><button id="prov-cancel" class="btn-secondary" type="button">Cancelar</button></div></form>`;
  openModal(node); document.getElementById('prov-cancel').addEventListener('click', closeModal);
  function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const fr = new FileReader(); fr.onload = ()=> res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
  document.getElementById('prov-save').addEventListener('click', async (e)=>{
    e.preventDefault();
    const nombre = document.getElementById('prov-nombre').value.trim(); const empresa = document.getElementById('prov-empresa').value.trim(); const tel = document.getElementById('prov-tel').value.trim(); const mail = document.getElementById('prov-mail').value.trim(); const username = document.getElementById('prov-username').value.trim(); const pass = document.getElementById('prov-pass').value.trim();
    const photoInput = document.getElementById('prov-photo-file'); const docInput = document.getElementById('prov-doc-file');
    let photo = document.getElementById('prov-photo').value.trim() || '';
    let doc = '';
    if(photoInput && photoInput.files && photoInput.files[0]){ try{ photo = await readFileAsDataURL(photoInput.files[0]); }catch(e){ console.warn('photo read err', e); } }
    if(docInput && docInput.files && docInput.files[0]){ try{ doc = await readFileAsDataURL(docInput.files[0]); }catch(e){ console.warn('doc read err', e); } }
    if(!photo) photo = '../images/repuestos.jpg';
    if(!nombre||!username||!pass) return alert('Nombre, usuario y contraseña requeridos');
    const list = JSON.parse(localStorage.getItem('proveedoresDemo')||'[]'); list.push({nombre, empresa, contacto:mail||tel, username, password:pass, photo, doc}); localStorage.setItem('proveedoresDemo', JSON.stringify(list)); closeModal(); renderProveedores(containerEl);
  });
}

function openEditProveedorModal(index){
  const list = JSON.parse(localStorage.getItem('proveedoresDemo')||'[]'); const data = list[index] || {};
  const node = document.createElement('div'); node.innerHTML = `<h3>Editar proveedor</h3><form id="editProvForm"><div class="form-field"><label>Nombre</label><input id="prov-nombre" type="text" value="${escapeHtml(data.nombre||'')}"></div><div class="form-field"><label>Empresa</label><input id="prov-empresa" type="text" value="${escapeHtml(data.empresa||'')}"></div><div class="form-field"><label>Teléfono</label><input id="prov-tel" type="text" value="${escapeHtml(data.contacto||'')}"></div><div class="form-field"><label>Usuario</label><input id="prov-username" type="text" value="${escapeHtml(data.username||'')}"></div><div class="form-field"><label>Contraseña</label><input id="prov-pass" type="password" value="${escapeHtml(data.password||'')}"></div><div class="form-field"><label>Foto (archivo)</label><input id="prov-photo-file" type="file" accept="image/*"></div><div class="form-field"><label>Documento (PDF)</label><input id="prov-doc-file" type="file" accept="application/pdf"></div><div class="form-field"><label>O usar ruta / DataURL</label><input id="prov-photo" type="text" value="${escapeHtml(data.photo||'')}"></div><div class="form-actions"><button id="prov-save" class="btn-primary">Guardar</button><button id="prov-cancel" class="btn-secondary" type="button">Cancelar</button></div></form>`;
  openModal(node); document.getElementById('prov-cancel').addEventListener('click', closeModal);
  function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const fr = new FileReader(); fr.onload = ()=> res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
  document.getElementById('prov-save').addEventListener('click', async (e)=>{ e.preventDefault(); data.nombre = document.getElementById('prov-nombre').value.trim(); data.empresa = document.getElementById('prov-empresa').value.trim(); data.contacto = document.getElementById('prov-tel').value.trim(); data.username = document.getElementById('prov-username').value.trim(); data.password = document.getElementById('prov-pass').value.trim();
    const photoInput = document.getElementById('prov-photo-file'); const docInput = document.getElementById('prov-doc-file');
    let photoVal = document.getElementById('prov-photo').value.trim() || '';
    if(photoInput && photoInput.files && photoInput.files[0]){ try{ photoVal = await readFileAsDataURL(photoInput.files[0]); }catch(e){ console.warn('photo read err', e); } }
    let docVal = data.doc || '';
    if(docInput && docInput.files && docInput.files[0]){ try{ docVal = await readFileAsDataURL(docInput.files[0]); }catch(e){ console.warn('doc read err', e); } }
    data.photo = photoVal || data.photo || '../images/repuestos.jpg'; data.doc = docVal || data.doc || '';
    list[index] = data; localStorage.setItem('proveedoresDemo', JSON.stringify(list)); closeModal(); renderProveedores(document.querySelector('#admin .cards'));
  });
}

/* Notificaciones (mostrar solicitudes de clientes) */
function renderNotificaciones(){
  const section = document.getElementById('admin'); section.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Notificaciones'; section.appendChild(title);
  // collect from localStorage possible events: alquileres, citas, compras
  const alquileres = JSON.parse(localStorage.getItem('alquileresDemo')||'[]');
  const citas = JSON.parse(localStorage.getItem('citasDemo')||'[]');
  const compras = JSON.parse(localStorage.getItem('purchasesDemo')||'[]');
  const wrap = document.createElement('div'); wrap.className='cards';

  function makeCard(titleHtml, bodyHtml, meta, idx, type){
    const c = document.createElement('article'); c.className='card'; c.style.padding='10px';
    c.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h4>${escapeHtml(titleHtml)}</h4><div style="opacity:0.9;margin-top:6px">${bodyHtml}</div></div><div style="display:flex;flex-direction:column;gap:6px"><button class="btn-primary btn-detail" data-type="${type}" data-idx="${idx}">Detalle</button><button class="btn-secondary btn-assign" data-type="${type}" data-idx="${idx}">Asignar</button><button class="btn-secondary btn-mark" data-type="${type}" data-idx="${idx}">Marcar</button></div></div>`;
    return c;
  }

  alquileres.forEach((a,i)=>{
    const body = `<div>Tel: ${escapeHtml(a.telefono||'')}</div><div>Dirección: ${escapeHtml(a.direccion||'')}</div><div>Servicio: ${escapeHtml(a.servicio||'')}</div><div>Fecha: ${escapeHtml(a.fecha||'')}</div>`;
    wrap.appendChild(makeCard(`Alquiler: ${a.nombre||''}`, body, {}, i, 'alquiler'));
  });
  citas.forEach((cita,i)=>{
    const body = `<div>Placa: ${escapeHtml(cita.placa||'')}</div><div>Modelo: ${escapeHtml(cita.modelo||'')}</div><div>Fecha: ${escapeHtml(cita.fecha||'')} ${escapeHtml(cita.hora||'')}</div>`;
    wrap.appendChild(makeCard(`Cita: ${cita.nombre||''}`, body, {}, i, 'cita'));
  });
  compras.forEach((comp,i)=>{
    const itemsHtml = (comp.items||[]).map(it=>`<div style="margin-top:6px;">${escapeHtml(it.name)} x ${escapeHtml(String(it.qty||1))} — $${Number(it.price||0).toFixed(2)}</div>`).join('');
    const body = `<div>Cliente: ${escapeHtml(comp.buyer||'')}</div><div>Total: $${(comp.total||0).toFixed(2)}</div>${itemsHtml}`;
    wrap.appendChild(makeCard(`Compra: #${comp.id||''}`, body, {}, i, 'compra'));
  });

  if(wrap.children.length === 0){ const p = document.createElement('p'); p.textContent = 'No hay notificaciones.'; section.appendChild(p); return; }
  section.appendChild(wrap);

  // attach handlers for detail/assign/mark
  wrap.querySelectorAll('.btn-detail').forEach(b=> b.addEventListener('click', (ev)=>{
    const t = ev.currentTarget.dataset.type; const idx = Number(ev.currentTarget.dataset.idx);
    let data = null;
    if(t === 'alquiler') data = JSON.parse(localStorage.getItem('alquileresDemo')||'[]')[idx];
    if(t === 'cita') data = JSON.parse(localStorage.getItem('citasDemo')||'[]')[idx];
    if(t === 'compra') data = JSON.parse(localStorage.getItem('purchasesDemo')||'[]')[idx];
    const node = document.createElement('div'); node.innerHTML = `<h3>Detalle</h3><pre style="white-space:pre-wrap">${escapeHtml(JSON.stringify(data, null, 2))}</pre><div style="margin-top:12px"><button id="det-close" class="btn-secondary">Cerrar</button></div>`;
    openModal(node); document.getElementById('det-close').addEventListener('click', closeModal);
  }));

  wrap.querySelectorAll('.btn-assign').forEach(b=> b.addEventListener('click', (ev)=>{
    const t = ev.currentTarget.dataset.type; const idx = Number(ev.currentTarget.dataset.idx);
    // open assign modal preselecting this solicitud
    closeModal(); // ensure no modal stuck
    renderAsignarTarea(null, {type:t, idx});
  }));

  wrap.querySelectorAll('.btn-mark').forEach(b=> b.addEventListener('click', (ev)=>{
    const t = ev.currentTarget.dataset.type; const idx = Number(ev.currentTarget.dataset.idx);
    // mark as read/handled by stamping a flag in the stored array
    if(t === 'alquiler'){
      const arr = JSON.parse(localStorage.getItem('alquileresDemo')||'[]'); if(arr[idx]) arr[idx].handled = true; localStorage.setItem('alquileresDemo', JSON.stringify(arr));
    }
    if(t === 'cita'){
      const arr = JSON.parse(localStorage.getItem('citasDemo')||'[]'); if(arr[idx]) arr[idx].handled = true; localStorage.setItem('citasDemo', JSON.stringify(arr));
    }
    if(t === 'compra'){
      const arr = JSON.parse(localStorage.getItem('purchasesDemo')||'[]'); if(arr[idx]) arr[idx].handled = true; localStorage.setItem('purchasesDemo', JSON.stringify(arr));
    }
    showToast('Notificación marcada'); renderNotificaciones();
  }));
}

/* Asignar tarea: seleccionar empleado, seleccionar notificación, agregar al calendario del empleado */
function renderAsignarTarea(){
  const section = document.getElementById('admin'); section.innerHTML = '';
  const title = document.createElement('h2'); title.textContent = 'Asignar tarea'; section.appendChild(title);
  const empleados = JSON.parse(localStorage.getItem('empleadosDemo')||'[]');
  const notis = [].concat(JSON.parse(localStorage.getItem('alquileresDemo')||'[]'), JSON.parse(localStorage.getItem('citasDemo')||'[]'), JSON.parse(localStorage.getItem('purchasesDemo')||'[]'));
  if(empleados.length === 0){ const p = document.createElement('p'); p.textContent = 'No hay empleados registrados.'; section.appendChild(p); return; }
  const empGrid = document.createElement('div'); empGrid.className='cards';
  empleados.forEach((emp,i)=>{ const c = document.createElement('article'); c.className='card'; c.style.padding='8px'; c.innerHTML = `<img src="${emp.photo||'../images/mecanico.jpg'}" style="height:120px;object-fit:cover"><h4>${escapeHtml(emp.nombre)}</h4><p>${escapeHtml(emp.contacto||'')}</p>`; c.addEventListener('click', ()=> openAssignFlow(i)); empGrid.appendChild(c); });
  section.appendChild(empGrid);

  function openAssignFlow(empIndex, preselect){
    const emp = empleados[empIndex];
    const node = document.createElement('div');
    node.innerHTML = `<h3>Asignar tarea a ${escapeHtml(emp.nombre)}</h3><div id="assignList"></div><div style="margin-top:12px"><button id="assign-cancel" class="btn-secondary">Cancelar</button></div>`;
    openModal(node); document.getElementById('assign-cancel').addEventListener('click', closeModal);
    const listWrap = document.getElementById('assignList'); if(notis.length === 0) listWrap.innerHTML = '<p>No hay solicitudes para asignar</p>';
    notis.forEach((n, idx)=>{
      const title = n.servicio || n.title || (n.items?('Compra #' + (n.id||'')):'Solicitud');
      const when = n.fecha||n.date||n.fecha || '';
      const el = document.createElement('div'); el.style.padding='8px'; el.style.borderBottom='1px solid #eee';
      el.innerHTML = `<div style="font-weight:700">${escapeHtml(title)}</div><div style="font-size:13px">${escapeHtml(n.nombre||n.buyer||'')} — ${escapeHtml(when)}</div><div style="margin-top:6px"><button class="btn-primary assign-btn" data-idx="${idx}">Asignar</button></div>`;
      listWrap.appendChild(el);
    });

    // assign button handlers -- open a scheduler for selected solicitud
    listWrap.querySelectorAll('.assign-btn').forEach(b=> b.addEventListener('click', (ev)=>{
      const idx = Number(ev.currentTarget.dataset.idx);
      const solicitud = notis[idx];
      // show scheduler modal
      const sched = document.createElement('div');
      sched.innerHTML = `<h3>Programar tarea para ${escapeHtml(emp.nombre)}</h3>
        <div style="margin-top:8px">Solicitud: <strong>${escapeHtml(solicitud.servicio||solicitud.title|| (solicitud.items?('Compra #'+(solicitud.id||'')):'Solicitud'))}</strong></div>
        <div class="form-field"><label>Fecha</label><input id="assign-date" type="date"></div>
        <div class="form-field"><label>Hora</label><input id="assign-time" type="time"></div>
        <div style="margin-top:12px" class="form-actions"><button id="assign-save" class="btn-primary">Guardar en calendario</button> <button id="assign-cancel2" class="btn-secondary">Cancelar</button></div>`;
      openModal(sched);
      document.getElementById('assign-cancel2').addEventListener('click', closeModal);
      document.getElementById('assign-save').addEventListener('click', ()=>{
        const dateVal = document.getElementById('assign-date').value || '';
        const timeVal = document.getElementById('assign-time').value || '';
        emp.calendar = emp.calendar || [];
        const evObj = {id: Date.now(), solicitud, read:false, date: dateVal, time: timeVal, assignedBy: 'admin'};
        emp.calendar.push(evObj);
        const all = JSON.parse(localStorage.getItem('empleadosDemo')||'[]'); all[empIndex] = emp; localStorage.setItem('empleadosDemo', JSON.stringify(all));
        showToast('Tarea asignada y programada'); closeModal();
      });
    }));
  }
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
  // admin targeted sections
  if(sectionId === 'admin-editor') renderAdminEditor();
  if(sectionId === 'empleados-proveedores') renderEmpleadosProveedores();
  if(sectionId === 'notificaciones') renderNotificaciones();
  if(sectionId === 'asignar-tarea') renderAsignarTarea();
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

  repuestos.forEach((r,i)=>{
    const card = document.createElement('article'); card.className='card';
    const img = document.createElement('img'); img.src = r.img||'../images/repuestos.jpg';
    const body = document.createElement('div'); body.style.padding='12px';
    const h = document.createElement('h3'); h.textContent = r.nombre;
    const p = document.createElement('p'); p.textContent = r.descripcion||'';
    const badges = document.createElement('div'); badges.className='badges'; badges.innerHTML = `<span class="badge brand">${escapeHtml(r.brand||'—')}</span> <span class="badge tipo">${escapeHtml(r.type === 'moto' ? 'Moto' : 'Auto')}</span>`;
    const foot = document.createElement('div'); foot.style.marginTop='10px'; foot.style.display='flex'; foot.style.justifyContent='space-between'; foot.style.alignItems='center';
    const price = document.createElement('div'); price.style.fontWeight='700'; price.textContent = `$${(r.precio||0).toFixed(2)}`;
    const actions = document.createElement('div');
    const addBtn = document.createElement('button'); addBtn.className='add-to-cart-item btn-primary'; addBtn.textContent='Añadir'; addBtn.dataset.name = r.nombre;
    const buyBtn = document.createElement('button'); buyBtn.className='buy-now btn-secondary'; buyBtn.textContent='Comprar'; buyBtn.dataset.name = r.nombre;
    actions.appendChild(addBtn); actions.appendChild(buyBtn);
    foot.appendChild(price); foot.appendChild(actions);
    body.appendChild(h); body.appendChild(p); body.appendChild(badges); body.appendChild(foot);
    card.appendChild(img); card.appendChild(body);
    // attach admin controls if admin
    createAdminControls(card, ()=> openEditRepuestoModal(i), ()=>{ if(confirm('Eliminar repuesto?')){ removeRepuesto(i); renderRepuestosPage(); } });
    grid.appendChild(card);
  });

  // add card for creating new repuesto (admin only)
  if(currentRole === 'admin'){
    const addCard = document.createElement('article'); addCard.className='card'; addCard.style.display='flex'; addCard.style.alignItems='center'; addCard.style.justifyContent='center';
    const addBtn = document.createElement('button'); addBtn.className='btn-primary'; addBtn.textContent='➕ Agregar repuesto';
    addBtn.addEventListener('click', ()=> openAddRepuestoModal()); addCard.appendChild(addBtn); grid.appendChild(addCard);
  }

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
  const sec = document.getElementById('mantenimiento-list');
  sec.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = 'Servicios de mantenimiento';
  sec.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'cards';

  const services = getServices();
  services.forEach((s, i) => {
    const card = document.createElement('article');
    card.className = 'card';

    const defaultImages = [
  '../images/mantenimientos/cambio-aceite.jpg',
  '../images/mantenimientos/alineacion.webp',
  '../images/mantenimientos/alineacion.webp',
  '../images/mantenimientos/reviciong.jpg',
  '../images/mantenimientos/cambio-pastillas.webp',
  '../images/mantenimientos/cambio-disco.jpg',
  '../images/mantenimientos/lavado.jpg',
  '../images/mantenimientos/revision-suspension.jpg',
  '../images/mantenimientos/electrico.png',
  '../images/mantenimientos/revision-frenos.jpg',
];
const img = document.createElement('img');
img.src = s.img || defaultImages[i % defaultImages.length];


    const h = document.createElement('h3');
    h.textContent = s.title;

    const p = document.createElement('p');
    p.textContent = s.desc || '';

    const foot = document.createElement('div');
    foot.style.padding = '12px';
    foot.style.display = 'flex';
    foot.style.gap = '8px';
    foot.style.justifyContent = 'space-between';
    foot.style.alignItems = 'center';

    const price = document.createElement('div');
    price.style.fontWeight = '700';
    price.textContent = `$${(s.price || 0).toFixed(2)}`;

    const btnWrap = document.createElement('div');
    const solicitar = document.createElement('button');
    solicitar.className = 'solicitar-cita btn-primary';
    solicitar.textContent = 'Solicitar cita';
    solicitar.dataset.s = i;
    btnWrap.appendChild(solicitar);

    foot.appendChild(price);
    foot.appendChild(btnWrap);
    card.appendChild(img);
    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(foot);

    // ✅ Solo mostrar controles si el rol es administrador
    if (currentRole === 'admin') {
      createAdminControls(
        card,
        () => openEditServiceModal(i),
        () => {
          if (confirm('¿Eliminar servicio?')) {
            const arr = getServices();
            arr.splice(i, 1);
            localStorage.setItem('servicesDemo', JSON.stringify(arr));
            renderMantenimientoPage();
          }
        }
      );
    }

    grid.appendChild(card);
  });

  // ✅ Solo agregar la tarjeta de “Agregar servicio” si el usuario es admin
  if (currentRole === 'admin') {
    const addCard = document.createElement('article');
    addCard.className = 'card';
    addCard.style.display = 'flex';
    addCard.style.alignItems = 'center';
    addCard.style.justifyContent = 'center';

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-primary';
    addBtn.textContent = '➕ Agregar servicio';
    addBtn.addEventListener('click', () => openAddServiceModal());

    addCard.appendChild(addBtn);
    grid.appendChild(addCard);
  }

  sec.appendChild(grid);

  // Eventos de los botones “Solicitar cita”
  sec.querySelectorAll('.solicitar-cita').forEach((b) =>
    b.addEventListener('click', () => openSolicitarCitaModal())
  );
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

  // simple guest-facing cards for vehicle-related services
  const container = document.createElement('div');
  const cards = document.createElement('div'); cards.className = 'cards';
  const card1 = document.createElement('article'); card1.className='card'; card1.innerHTML = `<img src="../images/servicios/mecanico.jpg" alt="Alquiler de mecánico"><h3>Alquiler de mecánico</h3><p>Solicita un mecánico a domicilio</p><div class="card-actions"><button id="goAlquiler" class="btn-primary">Solicitar alquiler</button></div>`;
  const card2 = document.createElement('article'); card2.className='card'; card2.innerHTML = `<img src="../images/servicios/repuestos.jpg" alt="Repuestos"><h3>Repuestos</h3><p>Repuestos originales y alternativas económicas.</p><div class="card-actions"><button id="goRepuestos" class="btn-primary">Ver repuestos</button></div>`;
  const card3 = document.createElement('article'); card3.className='card'; card3.innerHTML = `<img src="../images/servicios/mantenimiento.jpg" alt="Mantenimiento"><h3>Mantenimientos</h3><p>Planes de mantenimiento preventivo y correctivo.</p><div class="card-actions"><button id="goMantenimiento" class="btn-primary">Ver servicios</button></div>`;

  // attach admin controls to these guest-facing cards if current role is admin
  if(currentRole === 'admin'){
    createAdminControls(card1, ()=> openEditServiceModal(0), ()=>{ const arr = getServices(); arr.splice(0,1); localStorage.setItem('servicesDemo', JSON.stringify(arr)); renderServices(); });
    createAdminControls(card2, ()=> navigateTo('repuestos-list'), ()=>{});
    createAdminControls(card3, ()=> navigateTo('mantenimiento-list'), ()=>{});
  }

  cards.appendChild(card1); cards.appendChild(card2); cards.appendChild(card3);
  container.appendChild(cards); section.appendChild(container);
  document.getElementById('goAlquiler').addEventListener('click', ()=>navigateTo('alquiler'));
  document.getElementById('goRepuestos').addEventListener('click', ()=>navigateTo('repuestos-list'));
  document.getElementById('goMantenimiento').addEventListener('click', ()=>navigateTo('mantenimiento-list'));
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

function openCheckoutModal(cart, singleItem = false) {
  const total = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const node = document.createElement('div');

  node.innerHTML = `
    <h3>Selecciona método de pago</h3>
    <form id="checkoutForm" class="modal-form">
      <div class="form-field">
        <label>Método de pago</label>
        <select id="pay-method" required>
          <option value="">Selecciona</option>
          <option value="nequi">Nequi</option>
          <option value="daviplata">Daviplata</option>
        </select>
      </div>

      <div id="qr-section" style="display:none; text-align:center; margin-top:10px;">
        <img id="qr-img" src="" alt="QR de pago" style="width:180px; height:180px; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.2);">
      </div>

      <div id="upload-section" style="display:none; margin-top:10px;">
        <label>Adjunta el comprobante de pago (captura)</label>
        <input id="pay-proof" type="file" accept="image/*" required>
      </div>

      <div style="margin-top:15px;">
        <strong>Total a pagar:</strong> $${total.toFixed(2)}
      </div>

      <div class="form-actions" style="margin-top:15px;">
        <button id="pay-confirm" class="btn-primary" type="submit" disabled>Pagar</button>
        <button id="pay-cancel" class="btn-secondary" type="button">Cancelar</button>
      </div>
    </form>
  `;

  openModal(node);

  // Referencias
  const methodSelect = document.getElementById('pay-method');
  const qrSection = document.getElementById('qr-section');
  const qrImg = document.getElementById('qr-img');
  const uploadSection = document.getElementById('upload-section');
  const fileInput = document.getElementById('pay-proof');
  const payBtn = document.getElementById('pay-confirm');
  const cancelBtn = document.getElementById('pay-cancel');

  // Mostrar QR según método
  methodSelect.addEventListener('change', () => {
    const val = methodSelect.value;
    if (val === 'nequi') {
      qrImg.src = '../images/QR/qrnequi.jpg'; // ← aquí pones tu imagen QR
      qrSection.style.display = 'block';
      uploadSection.style.display = 'block';
    } else if (val === 'daviplata') {
      qrImg.src = '../images/QR/qrdaviplata.jpg'; // ← aquí pones tu imagen QR
      qrSection.style.display = 'block';
      uploadSection.style.display = 'block';
    } else {
      qrSection.style.display = 'none';
      uploadSection.style.display = 'none';
    }
  });

  // Habilitar botón pagar solo si hay archivo
  fileInput.addEventListener('change', () => {
    payBtn.disabled = !fileInput.files.length;
  });

  cancelBtn.addEventListener('click', closeModal);

  // Evento de pago
  document.getElementById('checkoutForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    closeModal();

    // Crear tarjeta de confirmación
    const successCard = document.createElement('div');
    successCard.style.textAlign = 'center';
    successCard.style.padding = '40px';
    successCard.style.animation = 'fadeIn 0.5s ease';

    successCard.innerHTML = `
      <div style="font-size:80px; color:#28a745; animation: pop 0.6s ease;">✅</div>
      <h3 style="margin-top:10px;">Compra realizada</h3>
    `;

    openModal(successCard);

    // Animación del check
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pop {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Limpiar carrito (simulación)
    (async () => {
      const buyer = 'Cliente (pago externo)';
      const normalized = (cart || []).map(i => ({
        name: i.name,
        price: Number(i.price || 0),
        qty: Number(i.qty || 1),
        img: i.img || '../images/repuestos.jpg'
      }));
      const total = normalized.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
      const invoiceRecord = { id: Date.now(), date: new Date().toISOString(), buyer, items: normalized, total };
      saveInvoice(invoiceRecord);
      savePurchase(invoiceRecord);
      if (!singleItem) { saveCart([]); renderCartCount(); renderCartPanel(); }
      setTimeout(() => { closeModal(); navigateTo('facturas'); renderFacturas(true, invoiceRecord); }, 1500);
    })();
  });
}



function renderFacturas(){
  const createFromCart = arguments[0] === true;
  const cartArg = arguments[1];
  const section = document.getElementById('facturas'); 
  section.innerHTML = '';

  // 🔹 Título
  const titleWrap = document.createElement('div');
  titleWrap.style.display = 'flex';
  titleWrap.style.justifyContent = 'space-between';
  titleWrap.style.alignItems = 'center';

  const title = document.createElement('h2'); 
  title.textContent = 'Facturas'; 
  titleWrap.appendChild(title);

  // 🔹 Botón limpiar historial
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn-secondary';
  clearBtn.textContent = '➖ Limpiar historial';
  clearBtn.addEventListener('click', ()=>{
    if(!confirm('¿Borrar todas las facturas guardadas?')) return;
    localStorage.removeItem('invoicesDemo');
    showToast('Historial de facturas eliminado');
    renderFacturas();
  });
  titleWrap.appendChild(clearBtn);

  section.appendChild(titleWrap);

  // 🔹 Mostrar facturas
  if(createFromCart){
    const invoiceRec = cartArg || getCart();
    const invoice = buildInvoiceDocument(invoiceRec.items || invoiceRec, invoiceRec);
    section.appendChild(invoice);
  } else {
    const facturas = getInvoices();
    if(!facturas || facturas.length === 0){
      const msg = document.createElement('p');
      msg.textContent = 'No tienes facturas aún.';
      section.appendChild(msg);
      return;
    }
    facturas.forEach(f=>{
      const invoice = buildInvoiceDocument(f.items, f);
      section.appendChild(invoice);
    });
  }
}


/* Persist invoices and purchases */
function getInvoices(){ try{ return JSON.parse(localStorage.getItem('invoicesDemo')||'[]'); }catch(e){ return []; } }
function saveInvoice(inv){ const list = getInvoices(); list.unshift(inv); localStorage.setItem('invoicesDemo', JSON.stringify(list)); }

function getPurchases(){ try{ return JSON.parse(localStorage.getItem('purchasesDemo')||'[]'); }catch(e){ return []; } }
function savePurchase(rec){ const list = getPurchases(); list.unshift(rec); localStorage.setItem('purchasesDemo', JSON.stringify(list)); }

function buildInvoiceDocument(items, invoiceRec){
  const container = document.createElement('div');
  container.style.background = 'rgba(255,255,255,0.03)';
  container.style.padding = '16px';
  container.style.borderRadius = '10px';
  container.style.marginBottom = '20px';

  const h = document.createElement('h3');
  h.textContent = `Factura #${invoiceRec?.id || '—'}`;
  container.appendChild(h);

  const date = document.createElement('div');
  date.style.opacity = 0.9;
  date.textContent = `Fecha: ${new Date(invoiceRec?.date || Date.now()).toLocaleString()}`;
  container.appendChild(date);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '10px';
  table.style.borderCollapse = 'collapse';
  table.innerHTML = `
    <thead>
      <tr style="text-align:left;border-bottom:1px solid rgba(255,255,255,0.1)">
        <th>Producto</th>
        <th>Precio</th>
        <th>Cantidad</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(it => `
        <tr>
          <td>${escapeHtml(it.name||'')}</td>
          <td>$${(it.price||0).toFixed(2)}</td>
          <td>${it.qty||1}</td>
          <td>$${((it.price||0)*(it.qty||1)).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  container.appendChild(table);

  const total = (items||[]).reduce((s,it)=> s + (it.price||0)*(it.qty||1), 0);
  const totalEl = document.createElement('div');
  totalEl.style.fontWeight = '700';
  totalEl.style.marginTop = '12px';
  totalEl.textContent = `Total: $${total.toFixed(2)}`;
  container.appendChild(totalEl);

  // Botones
  const actions = document.createElement('div');
  actions.style.marginTop = '16px';
  actions.style.display = 'flex';
  actions.style.gap = '10px';

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'btn-primary';
  downloadBtn.textContent = '⬇️ Descargar PDF';
  downloadBtn.addEventListener('click', async ()=>{
    await generateInvoicePDF(items);
  });

  const printBtn = document.createElement('button');
  printBtn.className = 'btn-secondary';
  printBtn.textContent = '🖨️ Imprimir';
  printBtn.addEventListener('click', ()=>{
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head><title>Factura</title></head>
      <body>${container.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  });

  actions.appendChild(downloadBtn);
  actions.appendChild(printBtn);
  container.appendChild(actions);

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
// removed window.__setDemoRole to avoid exposing a simple role changer in DevTools

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

