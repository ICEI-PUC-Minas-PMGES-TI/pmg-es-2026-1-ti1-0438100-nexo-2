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
  },
  {
    id: 4,
    titulo: "Buracos na Rua Silvino Santos",
    endereco: "Belo Horizonte",
    status: "resolvida",
    imagem: "https://picsum.photos/100?3",
    coords: [-19.93, -43.95]
  },
  {
    id: 5,
    titulo: "Buracos na Rua Silvino Santos",
    endereco: "Belo Horizonte",
    status: "resolvida",
    imagem: "https://picsum.photos/100?3",
    coords: [-19.93, -43.95]
  }
];

// MAPA
const mapa = L.map("mapa", {
  zoomControl: false
});

let marcadores = [];
let localUsuario = null;

// LOCALIZAÇÃO
navigator.geolocation.getCurrentPosition(
  (posicao) => {
    const latitude = posicao.coords.latitude;
    const longitude = posicao.coords.longitude;

    localUsuario = [latitude, longitude];
    mapa.setView(localUsuario, 15);

    L.circleMarker(localUsuario, {
      radius: 10,
      fillColor: "#0d6efd",
      color: "#ffffff",
      weight: 3,
      opacity: 1,
      fillOpacity: 1
    })
      .addTo(mapa)
      .bindPopup("Você está aqui")
      .openPopup();
  },

  () => {
    mapa.setView([-19.9167, -43.9345], 12);
  }
);

// MAPAS

const mapaPadrao = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "&copy; OpenStreetMap contributors"
  }
);

const mapaSatelite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Esri"
  }
);

// MAPA INICIAL

mapaPadrao.addTo(mapa);

let mapaAtual = "padrao";

// BARRA DE BUSCA DE ENDEREÇO
const input = document.getElementById("mapSearch");

async function buscarEndereco(query) {
  if (!query) return;
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
  const data = await res.json();

  if (data.length > 0) {
    const lat = data[0].lat;
    const lon = data[0].lon;
    mapa.setView([lat, lon], 16);
    L.marker([lat, lon]).addTo(mapa).bindPopup(data[0].display_name).openPopup();
  }
}

// Enter dispara a busca
input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    buscarEndereco(input.value);
  }
});

// Clique na lupa (lado direito do input)
input.addEventListener("click", e => {
  const rect = input.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  if (clickX > rect.width - 30) {
    buscarEndereco(input.value);
  }
});


// ZOOM
L.control.zoom({
  position: "bottomright"
}).addTo(mapa);

// BOTÃO MAPA DE CALOR
const botaoMapaCalor = L.control({
  position: "bottomright"
});

botaoMapaCalor.onAdd = function () {
  const div = L.DomUtil.create("div", "leaflet-bar");
  div.innerHTML = `
    <a
      href="#"
      title="Mapa de calor"
      style="
        background: white;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: black;
      "
    >
      🔥
    </a>
  `;
  return div;
};
botaoMapaCalor.addTo(mapa);

// BOTÃO LOCALIZAÇÃO
const botaoLocalizacao = L.control({
  position: "bottomright"
});

botaoLocalizacao.onAdd = function () {
  const div = L.DomUtil.create("div", "leaflet-bar");
  div.innerHTML = `
    <a
      href="#"
      title="Minha localização"
      style="
        background: white;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: black;
      "
    >
      📍
    </a>
  `;

  div.onclick = function () {
    if (localUsuario) {
      mapa.setView(localUsuario, 15);
    }
  };

  return div;
};
botaoLocalizacao.addTo(mapa);

// BOTÃO SATÉLITE

const botaoSatelite = L.control({
  position: "bottomright"
});

botaoSatelite.onAdd = function () {

  const div = L.DomUtil.create("div", "leaflet-bar");

  div.innerHTML = `
    <a
      href="#"
      title="Alterar mapa"
      style="
        background: white;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: black;
        font-size: 16px;
      "
    >
      🛰️
    </a>
  `;

  div.onclick = function () {

    if(mapaAtual === "padrao"){

      mapa.removeLayer(mapaPadrao);

      mapaSatelite.addTo(mapa);

      mapaAtual = "satelite";

    }else{

      mapa.removeLayer(mapaSatelite);

      mapaPadrao.addTo(mapa);

      mapaAtual = "padrao";

    }

  };

  return div;

};

botaoSatelite.addTo(mapa);

// MARCADORES
function renderizarMarcadores(lista) {
  marcadores.forEach(m => mapa.removeLayer(m));
  marcadores = [];

  lista.forEach(d => {
    const marker = L.marker(d.coords)
      .addTo(mapa)
      .bindPopup(`
        <strong>${d.titulo}</strong><br>
        ${d.endereco}
      `);

    marcadores.push({
      id: d.id,
      marker
    });
  });
}
// LISTA
const listaContainer = document.getElementById("lista-denuncias");
function renderizarLista(lista) {

  listaContainer.innerHTML = "";

  lista.forEach(d => {

    const card = document.createElement("div");

    card.className = "card-denuncia";

    card.innerHTML = `
      <img src="${d.imagem}">

      <div class="card-info">

        <p>${d.endereco}</p>

        <h3>${d.titulo}</h3>

        <span class="status ${d.status}">
          ${
            d.status === "andamento"
            ? "Em andamento"
            : "Resolvida"
          }
        </span>

        <a href="#">Ver detalhes</a>

      </div>
    `;

    card.addEventListener("click", () => {

      mapa.setView(d.coords, 15);

      const marcador = marcadores.find(
        m => m.id === d.id
      );

      if(marcador){
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
    let filtradas = denuncias;
    if (filtro === "abertas") {
      filtradas = denuncias.filter(
        d => d.status === "andamento"
      );
    }
    else if (filtro !== "todas") {
      filtradas = denuncias.filter(
        d => d.status === filtro
      );
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

// ATUALIZAÇÃO
function atualizarTela(lista) {
  renderizarLista(lista);
  renderizarMarcadores(lista);
}

// INICIALIZAÇÃO
atualizarTela(denuncias);

// FILTROS
const botoesFiltro = document.querySelectorAll(".btn-filtro");

botoesFiltro.forEach(btn => {

  btn.addEventListener("click", () => {

    // REMOVE O ATIVO DE TODOS
    botoesFiltro.forEach(b => {
      b.classList.remove("ativo");
    });

    // ADICIONA NO CLICADO
    btn.classList.add("ativo");

    // FILTRO
    const filtro = btn.dataset.filtro;

    let filtradas = denuncias;

    if (filtro === "abertas") {

      filtradas = denuncias.filter(
        d => d.status === "andamento"
      );

    } else if (filtro !== "todas") {

      filtradas = denuncias.filter(
        d => d.status === filtro
      );

    }

    atualizarTela(filtradas);

  });

});