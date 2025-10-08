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

	form.addEventListener('submit', function(e){
		e.preventDefault();
		const formData = new FormData(form);
		const username = formData.get('username') || '';
		const role = formData.get('role') || '';

		// Simple client-side feedback — integrate real auth later
		msg.textContent = `Entrando como ${role} — ${username ? username : 'usuario'}`;
		setTimeout(()=>{
			console.log('login:', {username, role});
			// save role for dashboard and redirect appropriately
			try{ localStorage.setItem('demoRole', role); }catch(e){ console.warn('localStorage unavailable', e); }
			if(role === 'mecanico'){
				location.href = `Html/mecanico_dashboard.html?role=${encodeURIComponent(role)}`;
			} else if(role === 'proveedor' || role === 'provedor'){
				location.href = `Html/proveedor_panel.html?role=${encodeURIComponent(role)}`;
			} else {
				// clientes y administradores van al dashboard principal
				location.href = `Html/dashboard.html?role=${encodeURIComponent(role)}`;
			}
		}, 700);
	});
});