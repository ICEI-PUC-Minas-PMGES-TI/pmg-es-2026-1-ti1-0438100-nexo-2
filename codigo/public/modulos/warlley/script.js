let denuncias = [];

/* === MAPA === */
const mapa = L.map("mapa", {
  zoomControl: false
});

let marcadores = [];
let localUsuario = null;

/* === ICONES CATEGORIAS === */
const iconesCategorias = {

  Buraco:
    "images/icons/buraco.png",

  "Problema de esgoto":
    "images/icons/esgoto.png",

  "Falta de iluminação":
    "images/icons/luz.png",

  "Falta de limpeza":
    "images/icons/limpeza.png",

  Deslizamento:
    "images/icons/deslizamento.png",

  default:
    "images/icons/default.png"

};

/* === ICONES DENUNCIAS === */
const iconesDenuncia = {

  Buraco: L.icon({
    iconUrl: "images/icons/buraco.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  }),

  "Problema de esgoto": L.icon({
    iconUrl: "images/icons/esgoto.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  }),

  "Falta de iluminação": L.icon({
    iconUrl: "images/icons/luz.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  }),

  "Falta de limpeza": L.icon({
    iconUrl: "images/icons/limpeza.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  }),

  Deslizamento: L.icon({
    iconUrl: "images/icons/deslizamento.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  }),

  default: L.icon({
    iconUrl: "images/icons/default.png",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  })

};

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

    /* CLASSE URGENCIA */
    let classeUrgencia = "urgencia-baixa";

    if (d.urgencia === 2) {
      classeUrgencia = "urgencia-media";
    }

    else if (d.urgencia === 3) {
      classeUrgencia = "urgencia-alta";
    }

    /* ICONE */
    const iconeCategoria =
      iconesCategorias[d.categoria]
      || iconesCategorias.default;

    /* HTML DO MARCADOR */
    const htmlIcon = L.divIcon({

      className: "",

      html: `
        <div class="
          marker-container
          ${classeUrgencia}
        ">
          <img src="${iconeCategoria}">
        </div>
      `,

      iconSize: [44, 44],
      iconAnchor: [22, 22]

    });

    /* MARCADOR */
    const marker = L.marker(
      d.coords,
      {
        icon: htmlIcon
      }
    )
    .addTo(mapa)
    .bindPopup(`
      <strong>${d.titulo}</strong><br>
      ${d.endereco}<br>
      Categoria: ${d.categoria}
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
  <div class="card-topo">

    <img src="${d.imagem}">

    <div class="card-info">
      <p>${d.endereco}</p>

      <h3>${d.titulo}</h3>
    </div>

  </div>

  <div class="card-rodape">

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

      /* STATUS */
      const statusEncontrado = dados.status.find(
        s => s.id === d.status_id
      );

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

      /* CATEGORIA */
      const categoriaEncontrada = dados.categorias.find(
      c => c.id === d.categoria_id
      );

      return {
        id: d.id,
        titulo:
          d.descricaoDenuncia.substring(0, 40) + "...",
        endereco:
          `${d.local.logradouro}, ${d.local.cidade}`,
        status: statusFormatado,
        imagem: d.imagens[0],
        categoria: categoriaEncontrada
          ? categoriaEncontrada.nome
          : "default",
        urgencia: d.urgencia_id,
        coords: [
          d.coords.latitude,
          d.coords.longitude
        ]
      };
    });

    console.log(denuncias);
    atualizarTela(denuncias);
    atualizarEstatisticas(denuncias);
  }

  catch (erro) {
    console.error(
      "Erro ao carregar denúncias:",
      erro
    );
  }

}

/* === ESTATÍSTICAS === */
function atualizarEstatisticas(lista) {
  const abertas = lista.filter(
    d => d.status === "aberta"
  ).length;
  const andamento = lista.filter(
    d => d.status === "andamento"
  ).length;
  const resolvidas = lista.filter(
    d => d.status === "resolvida"
  ).length;
  const total = lista.length;
  document.getElementById("estat-realizadas").textContent =
    total;
  document.getElementById("estat-andamento").textContent =
    andamento;
  document.getElementById("estat-resolvidas").textContent =
    resolvidas;
  document.getElementById("estat-usuarios").textContent =
    "2000";
}

/* === INICIALIZAÇÃO === */
carregarDenuncias();