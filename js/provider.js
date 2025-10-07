// Provider page script
(function(){
  function showToast(msg, timeout=3000){
    const container = document.getElementById('toasts');
    const t = document.createElement('div'); t.className='toast'; t.textContent = msg; container.appendChild(t);
    setTimeout(()=>{ t.style.transform='translateY(10px)'; t.style.opacity='0.1'; setTimeout(()=>t.remove(),300); }, timeout);
  }

  function fileToDataURL(file){
    return new Promise((resolve,reject)=>{
      const r = new FileReader(); r.onload = ()=>resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const photo = document.getElementById('offer-photo');
    const preview = document.getElementById('offer-preview');
    const form = document.getElementById('offerForm');
    const offerDay = document.getElementById('offer-day');
    const wholesaleSection = document.getElementById('wholesaleSection');
    const tiers = document.getElementById('tiers');
    const addTierBtn = document.getElementById('addTier');

    // initialize one default tier example
    function addTierRow(quantity='', percent=''){
      const row = document.createElement('div'); row.className='tier-row'; row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center'; row.style.marginTop='6px';
      row.innerHTML = `<input class="tier-qty" type="number" min="1" placeholder="Cant" value="${quantity}"><input class="tier-pct" type="number" min="0" max="100" placeholder="%" value="${percent}"><button type="button" class="remove-tier btn-secondary">Quitar</button>`;
      tiers.appendChild(row);
      row.querySelector('.remove-tier').addEventListener('click', ()=>{ row.remove(); });
    }
    addTierRow(20,10);

    addTierBtn.addEventListener('click', ()=> addTierRow());

    photo.addEventListener('change', async (e)=>{
      if(e.target.files && e.target.files[0]){
        const url = await fileToDataURL(e.target.files[0]); preview.src = url;
      }
    });

    offerDay.addEventListener('change', ()=>{
      wholesaleSection.style.display = (offerDay.value === 'si') ? '' : 'none';
    });

    function getOffers(){ try{ return JSON.parse(localStorage.getItem('offersDemo')||'[]'); }catch(e){ return []; } }
    function saveOffer(o){ const list = getOffers(); list.unshift(o); localStorage.setItem('offersDemo', JSON.stringify(list)); }

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = document.getElementById('offer-name').value.trim();
      const desc = document.getElementById('offer-desc').value.trim();
      const price = parseFloat(document.getElementById('offer-price').value||0);
      const photoFile = document.getElementById('offer-photo').files[0];

      if(!name) return showToast('Nombre del producto es requerido');
      if(!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$/.test(name)) return showToast('Nombre inválido');
      if(!desc) return showToast('Descripción requerida');
      if(isNaN(price) || price <= 0) return showToast('Precio inválido');

      let photoData = preview.src || '';
      if(photoFile){ photoData = await fileToDataURL(photoFile); }

      const ofertaDia = offerDay.value === 'si';
      const wholesaleBase = parseInt(document.getElementById('wholesale-base').value||'0',10) || 0;
      const tiersArr = [];
      tiers.querySelectorAll('.tier-row').forEach(r=>{
        const q = parseInt(r.querySelector('.tier-qty').value||'0',10);
        const p = parseFloat(r.querySelector('.tier-pct').value||'0');
        if(q>0 && p>0) tiersArr.push({qty:q, pct:p});
      });

      const offer = {id: Date.now(), name, desc, price, photo: photoData, ofertaDia, wholesaleBase, tiers: tiersArr};
      saveOffer(offer);
      showToast('Oferta enviada');
      form.reset(); preview.src = '../images/repuestos.jpg'; tiers.innerHTML = ''; addTierRow(20,10); wholesaleSection.style.display = 'none';
    });
  });
})();
