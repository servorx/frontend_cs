document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const label = card.querySelector("span").textContent.trim();

      // Redirigir según la tarjeta
      switch(label){
        case "Editar":
          window.location.href = "editar_admin.html";
          break;
        default:
          alert("Funcionalidad en desarrollo para: " + label);
      }
    });
  });
});
