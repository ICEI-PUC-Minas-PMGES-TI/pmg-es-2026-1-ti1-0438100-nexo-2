let denuncias = [];

/* === MAPA === */
const mapa = L.map("mapa", {
  zoomControl: false
});

let marcadores = [];
let localUsuario = null;

/* === LOCALIZAÇÃO === */
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
    .bindPopup("Você está aqui");
  },

  () => {
    mapa.setView([-19.9167, -43.9345], 12);
  }
);

/* === TIPOS DE MAPA === */
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

mapaPadrao.addTo(mapa);
let mapaAtual = "padrao";

/* === BUSCA DE ENDEREÇO === */
const inputMapa = document.getElementById("mapSearch");
async function buscarEndereco(query) {
  if (!query) return;

  const resposta = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
  );

  const dados = await resposta.json();
  
  if (dados.length > 0) {
    const lat = dados[0].lat;
    const lon = dados[0].lon;
    mapa.setView([lat, lon], 16);

    L.marker([lat, lon])
      .addTo(mapa)
      .bindPopup(dados[0].display_name)
      .openPopup();

  }
}

/* === FUNCIONALIDADE DO ENTER === */
inputMapa.addEventListener("keydown", (e) => {

  if (e.key === "Enter") {
    buscarEndereco(inputMapa.value);
  }
});

/* === CLIQUE NA LUPA === */
inputMapa.addEventListener("click", (e) => {
  const rect = inputMapa.getBoundingClientRect();
  const clickX = e.clientX - rect.left;

  if (clickX > rect.width - 30) {
    buscarEndereco(inputMapa.value);
  }
});

/* === CONTROLES MAPA === */
/* ZOOM */
L.control.zoom({
  position: "bottomright"
}).addTo(mapa);

/* BOTÃO LOCALIZAÇÃO */
const botaoLocalizacao = L.control({
  position: "bottomright"
});

botaoLocalizacao.onAdd = function () {
  const div = L.DomUtil.create("div", "leaflet-bar");
  div.innerHTML = `
    <a href="#"
      title="Minha localização"
      class="map-btn">
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

/* BOTÃO MAPA DE CALOR */
const botaoMapaCalor = L.control({
  position: "bottomright"
});
botaoMapaCalor.onAdd = function () {
  const div = L.DomUtil.create("div", "leaflet-bar");
  div.innerHTML = `
    <a href="homepage-mapacalor.html"
      title="Mapa de calor"
      class="map-btn">
      🔥
    </a>
  `;
  return div;
};

botaoMapaCalor.addTo(mapa);

/* BOTÃO SATÉLITE */
const botaoSatelite = L.control({
  position: "bottomright"
});

botaoSatelite.onAdd = function () {
  const div = L.DomUtil.create("div", "leaflet-bar");
  div.innerHTML = `
    <a href="#"
      title="Alterar mapa"
      class="map-btn">
      🛰️
    </a>
  `;

  div.onclick = function () {
    if (mapaAtual === "padrao") {
      mapa.removeLayer(mapaPadrao);
      mapaSatelite.addTo(mapa);
      mapaAtual = "satelite";
    } else {
      mapa.removeLayer(mapaSatelite);
      mapaPadrao.addTo(mapa);
      mapaAtual = "padrao";
    }
  };
  return div;
};

botaoSatelite.addTo(mapa);

/* === MARCADORES === */
function renderizarMarcadores(lista) {
  marcadores.forEach((m) => {
    mapa.removeLayer(m);
  });
  
  marcadores = [];

  lista.forEach((d) => {

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

/* === VER NO MAPA === */
function verNoMapa(id) {
  const denuncia = denuncias.find(
    (d) => d.id === id
  );

  if (!denuncia) return;

  mapa.setView(denuncia.coords, 17);

  const marcador = marcadores.find(
    (m) => m.id === id
  );

  if (marcador) {
    marcador.marker.openPopup();
  }
}

/* === LISTA CARDS === */
const listaContainer = document.getElementById(
  "lista-denuncias"
);

function renderizarLista(lista) {
  listaContainer.innerHTML = "";
  lista.forEach((d) => {
    const card = document.createElement("div");
    card.className = "card-denuncia";
    card.innerHTML = `
      <img src="${d.imagem}">
      <div class="card-info">
        <p>${d.endereco}</p>
        <h3>${d.titulo}</h3>
        <div class="card-footer-acoes">
          <span class="status ${d.status}">
            ${
              d.status === "aberta"
              ? "Aberta"
              : d.status === "andamento"
              ? "Em andamento"
              : "Resolvida"
            }
          </span>
          <div class="acoes-card">
            <!-- AQUI VAI LINK PARA DETALHES -->
            <a
              href="detalhes.html?id=${d.id}"
              class="btn-detalhes"
            >
              Detalhes
            </a>
            <button
              class="btn-mapa"
              onclick="verNoMapa(${d.id})"
            >
              Mapa
            </button>
          </div>
        </div>
      </div>
    `;

    listaContainer.appendChild(card);

  });
}

/* === FILTROS === */
const botoesFiltro = document.querySelectorAll(
  ".btn-filtro"
);

botoesFiltro.forEach((btn) => {
  btn.addEventListener("click", () => {

    /* REMOVE ATIVO */
    botoesFiltro.forEach(b => {
    b.classList.remove(
    "ativo",
    "bg-gradient-custom"
    );
    });

    btn.classList.add(
    "ativo",
    "bg-gradient-custom"
    );

    /* ADICIONA ATIVO */
    btn.classList.add("ativo");
    const filtro = btn.dataset.filtro;
    let filtradas = denuncias;

    /* ABERTAS */
    if (filtro === "abertas") {
      filtradas = denuncias.filter(
        (d) => d.status === "aberta"
      );
    }

    /* OUTROS STATUS */
    else if (filtro !== "todas") {
      filtradas = denuncias.filter(
        (d) => d.status === filtro
      );
    }
    atualizarTela(filtradas);
  });
});

/* === BUSCA === */
const inputBusca = document.getElementById("busca");
inputBusca.addEventListener("input", () => {
  const valor = inputBusca.value.toLowerCase();
  const filtradas = denuncias.filter((d) =>
    d.titulo.toLowerCase().includes(valor) ||
    d.endereco.toLowerCase().includes(valor)
  );
  atualizarTela(filtradas);
});

/* === ATUALIZAR TELA === */
function atualizarTela(lista) {
  renderizarLista(lista);
  renderizarMarcadores(lista);
}

/* === CARREGAR JSON === */
async function carregarDenuncias() {

  try {

    const resposta = await fetch("detalhes.json");

    const dados = await resposta.json();

    denuncias = dados.denuncias.map(d => {

      /* BUSCA STATUS */
      const statusEncontrado = dados.status.find(
        s => s.id === d.status_id
      );

      /* DEFINE STATUS PARA O SISTEMA */
      let statusFormatado = "andamento";

      if (statusEncontrado) {

        if (statusEncontrado.status === "Em aberto") {
          statusFormatado = "aberta";
        }

        else if (
          statusEncontrado.status === "Concluída"
        ) {
          statusFormatado = "resolvida";
        }

      }

      return {

        id: d.id,

        titulo: d.descricaoDenuncia.substring(0, 40) + "...",

        endereco:
          `${d.local.logradouro}, ${d.local.cidade}`,

        status: statusFormatado,

        imagem: d.imagens[0],

        coords: [
          d.latitude,
          d.longitude
        ]

      };

    });

    atualizarTela(denuncias);

  } catch (erro) {

    console.error(
      "Erro ao carregar denúncias:",
      erro
    );

  }

}

/* === INICIALIZAÇÃO === */
carregarDenuncias();