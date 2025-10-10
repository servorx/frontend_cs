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

	// Role selection buttons: when clicked, hide selection and show form
	roleButtons.forEach(btn=>{
		btn.addEventListener('click', ()=>{
			const r = btn.getAttribute('data-role');
			roleInput.value = r;
			selectedRoleName.textContent = r;
			roleSelection.classList.add('hidden');
			form.classList.remove('hidden');
			// show register link only for cliente
			if(registerLink){
				if(r === 'cliente') registerLink.classList.remove('hidden');
				else registerLink.classList.add('hidden');
			}
			// focus on username
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

	// Show register form when clicking register (only visible for cliente)
	if(registerLink && registerForm){
		registerLink.addEventListener('click', ()=>{
			// show register form
			form.classList.add('hidden');
			registerForm.classList.remove('hidden');
			// ensure role is cliente
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

	if(registerForm){
		registerForm.addEventListener('submit', function(e){
			e.preventDefault();
			const fd = new FormData(registerForm);
			const nombre = fd.get('nombre') || '';
			const email = fd.get('email') || '';
			const telefono = fd.get('telefono') || '';
			const direccion = fd.get('direccion') || '';
			if(regMsg) regMsg.textContent = `Registrando ${nombre}...`;
			setTimeout(()=>{
				console.log('registro_simulado:', {nombre,email,telefono,direccion});
				if(regMsg) regMsg.textContent = 'Registro exitoso (simulado). Redirigiendo...';
				// redirect to dashboard as cliente (restore client pages)
				location.href = 'Html/dashboard.html?role=cliente';
			},700);
		});
	}

	form.addEventListener('submit', async function(e){
		e.preventDefault();
		const formData = new FormData(form);
		const username = formData.get('username') || '';
		const role = (formData.get('role') || '').toString();

		// Simple client-side feedback — integrate real auth later
		msg.textContent = `Entrando como ${role} — ${username ? username : 'usuario'}`;
		setTimeout(async ()=>{
			console.log('login:', {username, role});
				if(role === 'mecanico'){
				// validate mecanico credentials against empleadosDemo (employees have username/password)
				try{
					const empleados = JSON.parse(localStorage.getItem('empleadosDemo')||'[]');
					const found = empleados.find(m=> m.username && m.username === username && m.password && m.password === (formData.get('password')||''));
					if(found && found.username === username){
						// set current user for mechanic session
						try{ localStorage.setItem('user', username); localStorage.setItem('demoRole', 'mecanico'); }catch(e){}
						location.href = `Html/mecanico_dashboard.html?role=${encodeURIComponent(role)}&user=${encodeURIComponent(username)}`;
					} else {
						msg.textContent = 'No estás registrado en la empresa';
					}
				}catch(err){ console.error(err); msg.textContent = 'Error validando usuario'; }
			} else if(role === 'proveedor' || role === 'provedor'){
				// validate proveedor credentials
				try{
					const provs = JSON.parse(localStorage.getItem('proveedoresDemo')||'[]');
					const found = provs.find(p=> (p.username && p.username === username && p.password));
					if(found && found.username === username){
						location.href = `Html/proveedor_panel.html?role=${encodeURIComponent(role)}&user=${encodeURIComponent(username)}`;
					} else {
						msg.textContent = 'No estás registrado en la empresa';
					}
				}catch(err){ console.error(err); msg.textContent = 'Error validando usuario'; }
			} else if(role === 'admin' || role === 'administrador'){
				// ADMIN: verify hashed password (client-side demo only). Uses Web Crypto Subtle API.
				const adminUser = 'administrad0r_tallertoreto1';
				// SHA-256 of '1003865379' computed locally and embedded (hex)
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
							try{ localStorage.setItem('demoRole', 'admin'); }catch(e){}
							location.href = `Html/dashboard_admin.html?role=admin`;
						} else {
							msg.textContent = 'Credenciales de administrador inválidas.';
						}
					} else {
						msg.textContent = 'Credenciales de administrador inválidas.';
					}
				}catch(err){ console.error('hash err', err); msg.textContent = 'Error validando administrador'; }
			} else {
				// clientes van al dashboard principal
				location.href = `Html/dashboard.html?role=${encodeURIComponent(role)}`;
			}
		}, 700);
	});
});