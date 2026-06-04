/* === VARIÁVEIS GLOBAIS === */
/* Dados */
let denuncias = [];

/* Mapa */
const mapa = L.map("mapa", {
  zoomControl: false
});

let mapaAtual = "padrao";
let localUsuario = null;
let marcadores = [];

/* Busca de endereço */
const inputMapa = document.getElementById("mapSearch");
const sugestoes = document.getElementById("sugestoes");

/* Lista de denúncias */
const listaContainer =
  document.getElementById("lista-denuncias");

/* Busca da sidebar */
const inputBusca =
  document.getElementById("busca");

/* Botões de filtro */
const botoesFiltro =
  document.querySelectorAll(".btn-filtro");

/* ÍCONES DAS CATEGORIAS  */
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

/* === CONFIGURAÇÃO DO MAPA === */
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

/* === GEOLOCALIZAÇÃO === */
navigator.geolocation.getCurrentPosition(

  (posicao) => {

    const latitude =
      posicao.coords.latitude;

    const longitude =
      posicao.coords.longitude;

    localUsuario = [
      latitude,
      longitude
    ];

    mapa.setView(
      localUsuario,
      15
    );

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

    mapa.setView(
      [-19.9167, -43.9345],
      12
    );
  }
);

/* === BUSCA DE ENDEREÇO === */
async function buscarEndereco(query) {

  if (!query) return;

  try {

    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&addressdetails=1&limit=5`
    );

    const dados = await resposta.json();

    if (dados.length > 0) {

      const lat = parseFloat(dados[0].lat);
      const lon = parseFloat(dados[0].lon);

      mapa.setView(
        [lat, lon],
        16
      );

      L.marker([lat, lon])
        .addTo(mapa)
        .bindPopup(dados[0].display_name)
        .openPopup();
    }

  } catch (erro) {

    console.error(
      "Erro ao buscar endereço:",
      erro
    );
  }
}

/* AUTOCOMPLETE */
inputMapa.addEventListener(
  "input",
  async () => {

    const texto =
      inputMapa.value.trim();

    if (texto.length < 3) {

      sugestoes.innerHTML = "";
      return;

    }

    try {

      const resposta = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}&countrycodes=br&addressdetails=1&limit=5`
      );

      const dados =
        await resposta.json();

      sugestoes.innerHTML = "";

      dados.forEach(local => {

        const item =
          document.createElement("div");

        item.className =
          "sugestao";

        const endereco =
          local.address?.road ||
          local.address?.suburb ||
          local.address?.city ||
          "";

        const cidade =
          local.address?.city ||
          local.address?.town ||
          local.address?.village ||
          "";

        const estado =
          local.address?.state ||
          "";

        item.textContent =
          `${endereco} - ${cidade}/${estado}`;

        item.onclick = () => {

          inputMapa.value =
            item.textContent;

          mapa.setView(
            [
              parseFloat(local.lat),
              parseFloat(local.lon)
            ],
            16
          );

          sugestoes.innerHTML = "";

        };

        sugestoes.appendChild(item);

      });

    } catch (erro) {

      console.error(
        "Erro ao carregar sugestões:",
        erro
      );

    }

  }
);

/* ENTER */
inputMapa.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Enter") {

      buscarEndereco(
        inputMapa.value
      );

    }

  }
);

/* CLIQUE NA LUPA */
inputMapa.addEventListener(
  "click",
  (e) => {

    const rect =
      inputMapa.getBoundingClientRect();

    const clickX =
      e.clientX - rect.left;

    if (clickX > rect.width - 30) {

      buscarEndereco(
        inputMapa.value
      );

    }

  }
);

/* FECHAR SUGESTÕES */
document.addEventListener(
  "click",
  (e) => {

    if (
      !e.target.closest(".map-search")
    ) {

      sugestoes.innerHTML = "";

    }

  }
);

//* === CONTROLES DO MAPA === */
/* ZOOM */
L.control({
  position: "bottomright"
});

L.control.zoom({
  position: "bottomright"
}).addTo(mapa);

/* LOCALIZAÇÃO */
const botaoLocalizacao = L.control({
  position: "bottomright"
});

botaoLocalizacao.onAdd = function () {
  const div = L.DomUtil.create(
    "div",
    "leaflet-bar"
  );

  div.innerHTML = `
    <a
      href="#"
      class="map-btn"
      title="Minha localização"
    >
      📍
    </a>
  `;

  div.onclick = function () {

    if (localUsuario) {

      mapa.setView(
        localUsuario,
        15
      );
    }
  };

  return div;
};
botaoLocalizacao.addTo(mapa);

/* MAPA DE CALOR */
const botaoMapaCalor = L.control({
  position: "bottomright"
});

botaoMapaCalor.onAdd = function () {
  const div = L.DomUtil.create(
    "div",
    "leaflet-bar"
  );

  div.innerHTML = `
    <a
      href="homepage-mapacalor.html"
      class="map-btn"
      title="Mapa de calor"
    >
      🔥
    </a>
  `;
  return div;
};

botaoMapaCalor.addTo(mapa);

/* SATÉLITE */
const botaoSatelite = L.control({
  position: "bottomright"
});

botaoSatelite.onAdd = function () {
  const div = L.DomUtil.create(
    "div",
    "leaflet-bar"
  );

  div.innerHTML = `
    <a
      href="#"
      class="map-btn"
      title="Alterar mapa"
    >
      🛰️
    </a>
  `;

  div.onclick = function () {
    if (mapaAtual === "padrao") {

      mapa.removeLayer(
        mapaPadrao
      );

      mapaSatelite.addTo(
        mapa
      );

      mapaAtual =
        "satelite";

    } else {
      mapa.removeLayer(
        mapaSatelite
      );

      mapaPadrao.addTo(
        mapa
      );

      mapaAtual =
        "padrao";
    }
  };
  return div;
};
botaoSatelite.addTo(mapa);


/* === MARCADORES === */
function renderizarMarcadores(lista) {

  /* REMOVE MARCADORES ANTIGOS DO MAPA */
  marcadores.forEach((m) => {
    mapa.removeLayer(m);
  });

  marcadores = [];

  /* FILTRA APENAS DENÚNCIAS ATIVAS */
  lista
    .filter((d) => d.status !== "resolvida")
    .forEach((d) => {

      /* CLASSE DE URGÊNCIA */
      let classeUrgencia = "urgencia-baixa";

      if (d.urgencia === 2) {
        classeUrgencia = "urgencia-media";
      } 
      
      else if (d.urgencia === 3) {
        classeUrgencia = "urgencia-alta";
      }

      /* ÍCONE DA CATEGORIA */
      const iconeCategoria =
        iconesCategorias[d.categoria] ||
        iconesCategorias.default;

      /* MARCADOR PERSONALIZADO */
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

      /* CRIAÇÃO DO MARKER */
      const marker = L.marker(d.coords, {
        icon: htmlIcon
      })
      .addTo(mapa)
      .bindPopup(`
        <strong>${d.titulo}</strong><br>
        ${d.endereco}<br>
        Categoria: ${d.categoria}
      `);

      /* ARMAZENAMENTO PARA CONTROLE FUTURO */
      marcadores.push({
        id: d.id,
        marker
      });

    });
}

/* VER DENÚNCIA NO MAPA */
function verNoMapa(id) {

  const denuncia = denuncias.find(
    (d) => d.id === id
  );

  if (!denuncia) return;

  /* CENTRALIZA NO MAPA */
  mapa.setView(denuncia.coords, 17);

  /* ABRE POPUP DO MARCADOR CORRESPONDENTE */
  const marcador = marcadores.find(
    (m) => m.id === id
  );

  if (marcador) {
    marcador.marker.openPopup();
  }
}

/* === LISTA DE DENÚNCIAS === */
function renderizarLista(lista) {
  listaContainer.innerHTML = "";
  lista.forEach((d) => {

    /* TEMPO */
    let textoTempo;

    if (d.status === "resolvida" && d.dataResolucao) {
      textoTempo = `Resolvida ${tempoDecorrido(d.dataResolucao)}`;
    } else {
      textoTempo = `Publicada ${tempoDecorrido(d.dataPublicacao)}`;
    }

    /* URGÊNCIA TEXTO */
    let textoUrgencia = "Baixa";
    let classeUrgencia = "urgencia-texto-baixa";

    if (d.urgencia === 2) {
      textoUrgencia = "Média";
      classeUrgencia = "urgencia-texto-media";
    }

    if (d.urgencia === 3) {
      textoUrgencia = "Alta";
      classeUrgencia = "urgencia-texto-alta";
    }

    /* CARD */
    const card = document.createElement("div");
    card.className = "card-denuncia";
    card.innerHTML = `
      <div class="card-topo">
        <img src="${d.imagem}">
        <div class="card-info">

          <p>${d.endereco}</p>

          <span class="urgencia-texto ${classeUrgencia}">
            Urgência ${textoUrgencia}
          </span>

          <h3>${d.titulo}</h3>

          <p class="tempo-denuncia">
            ${textoTempo}
          </p>
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

          ${
            d.status !== "resolvida"
              ? `<button
                  class="btn-mapa"
                  onclick="verNoMapa(${d.id})"
                >
                  Mapa
                </button>`
              : `<button class="btn-mapa desativado" disabled>
                  Concluída
                </button>`
          }
        </div>
      </div>
    `;

    listaContainer.appendChild(card);
  });
}

function tempoDecorrido(dataString) {

  const agora = new Date();
  const data = new Date(dataString);

  const diferenca =
    Math.floor((agora - data) / 1000);

  const minutos = Math.floor(diferenca / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  const meses = Math.floor(dias / 30);

  if (minutos < 60) {
    return `há ${minutos} min`;
  }

  if (horas < 24) {
    return `há ${horas} h`;
  }

  if (dias < 30) {
    return `há ${dias} dias`;
  }

  return `há ${meses} meses`;
}

//* === FILTROS === */
function atualizarTela(lista) {
  renderizarLista(lista);
  renderizarMarcadores(lista);
}

botoesFiltro.forEach((btn) => {

  btn.addEventListener("click", () => {

    /* REMOVE ESTADO ATIVO */
    botoesFiltro.forEach(b => {
      b.classList.remove("ativo", "bg-gradient-custom");
    });

    /* ATIVA BOTÃO CLICADO */
    btn.classList.add("ativo", "bg-gradient-custom");

    const filtro = btn.dataset.filtro;
    let filtradas = denuncias;

    /* FILTRO: ABERTAS */
    if (filtro === "abertas") {
      filtradas = denuncias.filter(
        (d) => d.status === "aberta"
      );
    }

    /* FILTRO: OUTROS STATUS */
    else if (filtro !== "todas") {
      filtradas = denuncias.filter(
        (d) => d.status === filtro
      );
    }

    atualizarTela(filtradas);
  });

});

inputBusca.addEventListener("input", () => {

  const valor = inputBusca.value.toLowerCase();

  const filtradas = denuncias.filter((d) =>
    d.titulo.toLowerCase().includes(valor) ||
    d.endereco.toLowerCase().includes(valor)
  );

  atualizarTela(filtradas);
});

/* === BUSCA DE DENÚNCIAS === */

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

/* === CARREGAMENTO DOS DADOS === */
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
        else if (statusEncontrado.status === "Concluída") {
          statusFormatado = "resolvida";
        }
      }

      /* CATEGORIA */
      const categoriaEncontrada = dados.categorias.find(
        c => c.id === d.categoria_id
      );

      /* OBJETO FINAL DA DENÚNCIA */
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
        dataPublicacao: d.data,
        dataResolucao: d.dataResolucao || null,
        coords: [
          d.coords.latitude,
          d.coords.longitude
        ]
      };
    });
    console.log(denuncias);

    /* PRIMEIRA RENDERIZAÇÃO */
    atualizarTela(denuncias);

    /* ESTATÍSTICAS */
    atualizarEstatisticas(denuncias);

  } catch (erro) {
    console.error(
      "Erro ao carregar denúncias:",
      erro
    );
  }
}

//* === INICIALIZAÇÃO === */
function inicializarSistema() {

  /* CARREGA DADOS PRINCIPAIS */
  carregarDenuncias();

}

carregarDenuncias();