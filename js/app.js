console.log("Hello world");

document.addEventListener('DOMContentLoaded', function(){
	const form = document.getElementById('loginForm');
	const msg = document.getElementById('msg');

	const roleSelection = document.getElementById('roleSelection');
	const roleButtons = document.querySelectorAll('.role-button');
	const roleInput = document.getElementById('roleInput');
	const selectedRoleName = document.getElementById('selectedRoleName');
	const changeRoleBtn = document.getElementById('changeRole');
	const registerLink = document.getElementById('registerLink');
	const registerForm = document.getElementById('registerForm');
	const registerRoleInput = document.getElementById('registerRoleInput');
	const registerRoleName = document.getElementById('registerRoleName');
	const cancelRegister = document.getElementById('cancelRegister');
	const regMsg = document.getElementById('regMsg');

	if(!form) return;

	// === SELECCIÓN DE ROL ===
	roleButtons.forEach(btn=>{
		btn.addEventListener('click', ()=>{
			const r = btn.getAttribute('data-role');
			roleInput.value = r;
			selectedRoleName.textContent = r;
			roleSelection.classList.add('hidden');
			form.classList.remove('hidden');
			if(registerLink){
				if(r === 'cliente') registerLink.classList.remove('hidden');
				else registerLink.classList.add('hidden');
			}
			const u = document.getElementById('username');
			if(u) u.focus();
		});
	});

	changeRoleBtn.addEventListener('click', ()=>{
		form.classList.add('hidden');
		roleSelection.classList.remove('hidden');
		msg.textContent = '';
		if(registerLink) registerLink.classList.add('hidden');
	});

	// === MOSTRAR FORMULARIO DE REGISTRO (solo cliente) ===
	if(registerLink && registerForm){
		registerLink.addEventListener('click', ()=>{
			form.classList.add('hidden');
			registerForm.classList.remove('hidden');
			registerRoleInput.value = 'cliente';
			registerRoleName.textContent = 'cliente';
			if(regMsg) regMsg.textContent = '';
			const n = document.getElementById('nombre');
			if(n) n.focus();
		});
	}

	if(cancelRegister){
		cancelRegister.addEventListener('click', ()=>{
			registerForm.classList.add('hidden');
			roleSelection.classList.remove('hidden');
			if(registerLink) registerLink.classList.add('hidden');
		});
	}

	// === REGISTRO DEL CLIENTE ===
	if(registerForm){
		registerForm.addEventListener('submit', function(e){
			e.preventDefault();
			const fd = new FormData(registerForm);
			const nombre = fd.get('nombre') || '';
			const email = fd.get('email') || '';
			const telefono = fd.get('telefono') || '';
			const direccion = fd.get('direccion') || '';
			const password = fd.get('password') || '';

			if(!nombre || !email || !telefono || !direccion || !password){
				regMsg.textContent = 'Por favor completa todos los campos.';
				return;
			}

			let clientes = [];
			try{ clientes = JSON.parse(localStorage.getItem('clientesDemo') || '[]'); }catch(e){}
			const existe = clientes.some(c => c.email === email);
			if(existe){
				regMsg.textContent = 'Ya existe un cliente registrado con este correo.';
				return;
			}

			clientes.push({ nombre, email, telefono, direccion, password });
			localStorage.setItem('clientesDemo', JSON.stringify(clientes));

			regMsg.textContent = 'Registro exitoso ✅ Ahora puedes iniciar sesión.';
			setTimeout(()=>{
				registerForm.classList.add('hidden');
				roleSelection.classList.remove('hidden');
				if(registerLink) registerLink.classList.add('hidden');
			}, 1200);
		});
	}

	// === INICIO DE SESIÓN ===
	form.addEventListener('submit', async function(e){
		e.preventDefault();
		const formData = new FormData(form);
		const username = formData.get('username') || '';
		const password = formData.get('password') || '';
		const role = (formData.get('role') || '').toString();

		msg.textContent = `Entrando como ${role} — ${username ? username : 'usuario'}`;
		setTimeout(async ()=>{
			console.log('login:', {username, role});

			if(role === 'mecanico'){
				try{
					const empleados = JSON.parse(localStorage.getItem('empleadosDemo')||'[]');
					const found = empleados.find(m=> m.username && m.username === username && m.password && m.password === password);
					if(found){
						localStorage.setItem('user', username);
						localStorage.setItem('demoRole', 'mecanico');
						location.href = `Html/mecanico_dashboard.html?role=${encodeURIComponent(role)}&user=${encodeURIComponent(username)}`;
					} else msg.textContent = 'No estás registrado en la empresa';
				}catch(err){ console.error(err); msg.textContent = 'Error validando usuario'; }
			}
			else if(role === 'proveedor' || role === 'provedor'){
				try{
					const provs = JSON.parse(localStorage.getItem('proveedoresDemo')||'[]');
					const found = provs.find(p=> p.username && p.username === username && p.password === password);
					if(found){
						localStorage.setItem('user', username);
						localStorage.setItem('demoRole', 'proveedor');
						location.href = `Html/proveedor_panel.html?role=${encodeURIComponent(role)}&user=${encodeURIComponent(username)}`;
					} else msg.textContent = 'No estás registrado en la empresa';
				}catch(err){ console.error(err); msg.textContent = 'Error validando usuario'; }
			}
			else if(role === 'admin' || role === 'administrador'){
				const adminUser = 'administrad0r_tallertoreto1';
				const adminHash = '03d3350fc099ca6a2aae344f7b6d8f2ae066ca0e25055eb1eaa9e22dd6f41be2';
				const provided = (formData.get('password') || '').toString();
				try{
					if(username === adminUser){
						const enc = new TextEncoder();
						const data = enc.encode(provided);
						const digest = await crypto.subtle.digest('SHA-256', data);
						const hashArray = Array.from(new Uint8Array(digest));
						const hashHex = hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
						if(hashHex === adminHash){
							localStorage.setItem('demoRole', 'admin');
							location.href = `Html/dashboard_admin.html?role=admin`;
						} else msg.textContent = 'Credenciales de administrador inválidas.';
					} else msg.textContent = 'Credenciales de administrador inválidas.';
				}catch(err){ console.error('hash err', err); msg.textContent = 'Error validando administrador'; }
			}
			else if(role === 'cliente'){
				try{
					const clientes = JSON.parse(localStorage.getItem('clientesDemo') || '[]');
					const found = clientes.find(c => c.email === username && c.password === password);
					if(found){
						localStorage.setItem('user', JSON.stringify(found));
						localStorage.setItem('demoRole', 'cliente');
						location.href = `Html/dashboard.html?role=cliente`;
					}else{
						msg.textContent = 'Debes registrarte antes de iniciar sesión.';
					}
				}catch(err){ msg.textContent = 'Error validando cliente.'; }
			}
			else {
				location.href = `Html/dashboard.html?role=${encodeURIComponent(role)}`;
			}
		}, 700);
	});
});
