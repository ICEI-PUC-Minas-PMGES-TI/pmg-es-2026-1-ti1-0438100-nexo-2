const denuncias = [
  {
    id: 1,
    titulo: "Buracos na Avenida Firmo de Matos",
    endereco: "Contagem",
    status: "andamento",
    imagem: "https://picsum.photos/100?1",
    coords: [-19.92, -43.94]
  },
  {
    id: 2,
    titulo: "Falta de canalização de esgoto",
    endereco: "Contagem",
    status: "resolvida",
    imagem: "https://picsum.photos/100?2",
    coords: [-19.91, -43.93]
  },
  {
    id: 3,
    titulo: "Buracos na Rua Silvino Santos",
    endereco: "Belo Horizonte",
    status: "resolvida",
    imagem: "https://picsum.photos/100?3",
    coords: [-19.93, -43.95]
  }
];

// MAPA
const mapa = L.map('mapa').setView([-19.9167, -43.9345], 12);

L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  attribution: 'Google Maps'
}).addTo(mapa);

let marcadores = [];

// FUNÇÃO MARCADORES
function renderizarMarcadores(lista) {
  marcadores.forEach(m => mapa.removeLayer(m));
  marcadores = [];

  lista.forEach(d => {
    const marker = L.marker(d.coords)
      .addTo(mapa)
      .bindPopup(`<strong>${d.titulo}</strong><br>${d.endereco}`);

    marcadores.push({ id: d.id, marker });
  });
}

// LISTA (SIDEBAR)
const listaContainer = document.getElementById("lista-denuncias");

function renderizarLista(lista) {
  listaContainer.innerHTML = "";

  lista.forEach(d => {
    const card = document.createElement("div");

    card.innerHTML = `
      <img src="${d.imagem}" />
      <div>
        <p>${d.endereco}</p>
        <h3>${d.titulo}</h3>
        <span class="${d.status}">
          ${d.status === "andamento" ? "Em andamento" : "Resolvida"}
        </span>
        <a href="#">Ver detalhes</a>
      </div>
    `;

    card.addEventListener("click", () => {
      mapa.setView(d.coords, 15);

      const marcador = marcadores.find(m => m.id === d.id);
      if (marcador) {
        marcador.marker.openPopup();
      }
    });
    listaContainer.appendChild(card);
  });
}

// FILTROS
const botoes = document.querySelectorAll("#filtros button");
botoes.forEach(btn => {
  btn.addEventListener("click", () => {
    const filtro = btn.dataset.filtro;
    let filtradas;
    if (filtro === "todas") {
      filtradas = denuncias;
    } else if (filtro === "abertas") {
      filtradas = denuncias.filter(d => d.status === "andamento");
    } else {
      filtradas = denuncias.filter(d => d.status === filtro);
    }
    atualizarTela(filtradas);
  });
});

// BUSCA
const inputBusca = document.getElementById("busca");
inputBusca.addEventListener("input", () => {
  const valor = inputBusca.value.toLowerCase();
  const filtradas = denuncias.filter(d =>
    d.titulo.toLowerCase().includes(valor) ||
    d.endereco.toLowerCase().includes(valor)
  );
  atualizarTela(filtradas);
});

// ATUALIZAÇÃO GERAL
function atualizarTela(lista) {
  renderizarLista(lista);
  renderizarMarcadores(lista);
}

// INICIALIZAÇÃO
atualizarTela(denuncias);