/* ===CONFIGURAÇÕES GERAIS=== */
const API_URL = "http://localhost:3000";

const ROTAS = {
  homepage: "/",

  visitante: {
    denuncias: "/modulos/cidadaos/outras_denuncias/index.html",
    cadastro: "/modulos/cidadaos/cadastro/index.html",
    login: "/modulos/login/index.html"
  },

  morador: {
    cadastrarDenuncia:
      "/modulos/cidadaos/cadastro_denuncias/index.html",

    minhasDenuncias:
      "/modulos/cidadaos/perfil/index.html",

    outrasDenuncias:
      "/modulos/cidadaos/outras_denuncias/index.html",

    perfil:
      "/modulos/cidadaos/perfil/index.html"
  },

  empresa: {
    denuncias:
      "/modulos/empresas/outras_denuncias/index.html",

    minhasObras:
      "/modulos/empresas/perfil/index.html",

    perfil:
      "/modulos/empresas/perfil/index.html"
  },

  prefeitura: {
    denuncias:
      "/modulos/prefeitura/outras_denuncias/index.html",

    minhasObras:
      "/modulos/prefeitura/perfil/index.html",

    perfil:
      "/modulos/prefeitura/perfil/index.html"
  },

  detalhesDenuncia:
    "/modulos/warlley/detalhes.html",

  mapaCalor:
    "/modulos/warlley/homepage-mapacalor.html"
};

/* ===DADOS GLOBAIS=== */
let denuncias = [];
let totalUsuarios = 0;
let marcadores = [];
let localUsuario = null;
let mapaAtual = "padrao";

/* ===ELEMENTOS DA PÁGINA=== */
const elementoMapa =
  document.getElementById("mapa");

const inputMapa =
  document.getElementById("mapSearch");

const sugestoes =
  document.getElementById("sugestoes");

const listaContainer =
  document.getElementById("lista-denuncias");

const inputBusca =
  document.getElementById("busca");

const inputBuscaMobile =
  document.getElementById("busca-mobile");

const botoesFiltro =
  document.querySelectorAll(".btn-filtro");

/* ===MAPA=== */
const mapa = L.map("mapa", {
  zoomControl: false
});

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

/* ===ÍCONES DAS CATEGORIAS=== */
const iconesCategorias = {
  Buraco:
    "/assets/images/icones/buraco.png",

  "Problema de esgoto":
    "/assets/images/icones/esgoto.png",

  Deslizamento:
    "/assets/images/icones/deslizamento.png",

  "Falta de iluminação":
    "/assets/images/icones/falta_de_iluminacao.png",

  "Falta de limpeza":
    "/assets/images/icones/falta_de_limpeza.png",

  default:
    "/assets/images/icones/default.png"
};


/* ===FUNÇÕES AUXILIARES=== */
function normalizarCpf(cpf) {
  return String(cpf || "")
    .replace(/\D/g, "");
}


function ajustarCaminhoImagem(caminho) {
  if (!caminho) {
    return "/assets/images/sem-imagem.png";
  }

  const caminhoLimpo =
    String(caminho).trim();

  if (
    caminhoLimpo.startsWith("http://") ||
    caminhoLimpo.startsWith("https://") ||
    caminhoLimpo.startsWith("data:")
  ) {
    return caminhoLimpo;
  }

  if (caminhoLimpo.startsWith("/")) {
    return caminhoLimpo;
  }

  return `/${caminhoLimpo}`;
}


async function carregarColecao(endpoint) {
  const resposta = await fetch(
    `${API_URL}/${endpoint}`
  );

  if (!resposta.ok) {
    throw new Error(
      `Erro ao carregar ${endpoint}. Status: ${resposta.status}`
    );
  }

  return resposta.json();
}


function encontrarUsuarioPorCpf(lista, cpf) {
  const cpfProcurado =
    normalizarCpf(cpf);

  return lista.find((usuario) => {
    return (
      normalizarCpf(usuario.cpf) ===
      cpfProcurado
    );
  });
}


function encontrarInstituicaoPorId(
  instituicoes,
  instituicaoId
) {
  return instituicoes.find((instituicao) => {
    return (
      Number(instituicao.id) ===
      Number(instituicaoId)
    );
  });
}


function descobrirTipoInstituicao(instituicao) {
  const entidadeId =
    Number(instituicao?.entidade_id);

  if (entidadeId === 2) {
    return "prefeitura";
  }

  if (entidadeId === 3) {
    return "empresa";
  }

  const nome = String(
    instituicao?.nome || ""
  )
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (nome.includes("prefeitura")) {
    return "prefeitura";
  }

  return "empresa";
}

/* ===ELEMENTOS DO CABEÇALHO E RODAPÉ=== */
function localizarMenuDesktop() {
  return document.querySelector(
    "header .collapse.navbar-collapse .navbar-nav"
  );
}

function localizarMenuMobile() {
  return document.getElementById(
    "menuMobile"
  );
}

function localizarAreaDireitaDesktop() {
  return document.querySelector(
    "header .collapse.navbar-collapse .ms-auto.d-flex"
  );
}

function localizarAreaDireitaMobile() {
  return document.querySelector(
    "header .d-flex.d-lg-none.align-items-center"
  );
}

function localizarNavegacaoRodape() {
  return document.querySelector(
    ".footer-nav"
  );
}

/* ===CRIAÇÃO DOS LINKS=== */
function criarItemMenuDesktop(texto, href) {
  const item =
    document.createElement("li");

  item.className = "nav-item";

  const link =
    document.createElement("a");

  link.className =
    "nav-link text-light fw-semibold";

  link.href = href;
  link.textContent = texto;

  item.appendChild(link);

  return item;
}

function criarLinkMenuMobile(texto, href) {
  const link =
    document.createElement("a");

  link.className =
    "d-block text-light text-decoration-none py-2";

  link.href = href;
  link.textContent = texto;

  return link;
}

function criarLinkRodape(
  texto,
  href,
  icone
) {
  const link =
    document.createElement("a");

  link.href = href;
  link.className = "footer-link";

  link.innerHTML = `
    <i class="bi ${icone}"></i>
    <span>${texto}</span>
  `;

  return link;
}

/* ===CONFIGURAÇÃO DOS MENUS=== */
function configurarMenuDesktop(opcoes) {
  const menuDesktop =
    localizarMenuDesktop();

  if (!menuDesktop) {
    console.warn(
      "Menu desktop não encontrado."
    );

    return;
  }

  menuDesktop.innerHTML = "";

  opcoes.forEach((opcao) => {
    menuDesktop.appendChild(
      criarItemMenuDesktop(
        opcao.texto,
        opcao.href
      )
    );
  });
}

function configurarMenuMobile(
  opcoes,
  incluirVisitante = false
) {
  const menuMobile =
    localizarMenuMobile();

  if (!menuMobile) {
    console.warn(
      "Menu mobile não encontrado."
    );

    return;
  }

  menuMobile
    .querySelectorAll(
      "a, hr[data-tipo='separador-visitante']"
    )
    .forEach((elemento) => {
      elemento.remove();
    });

  opcoes.forEach((opcao) => {
    menuMobile.appendChild(
      criarLinkMenuMobile(
        opcao.texto,
        opcao.href
      )
    );
  });

  if (!incluirVisitante) {
    return;
  }

  const separador =
    document.createElement("hr");

  separador.dataset.tipo =
    "separador-visitante";

  separador.className =
    "border-light opacity-25 my-2";

  menuMobile.appendChild(separador);

  const cadastro =
    criarLinkMenuMobile(
      "Cadastre-se",
      ROTAS.visitante.cadastro
    );

  cadastro.classList.add(
    "fw-semibold"
  );

  const login =
    criarLinkMenuMobile(
      "Login",
      ROTAS.visitante.login
    );

  login.classList.add(
    "fw-semibold"
  );

  menuMobile.appendChild(cadastro);
  menuMobile.appendChild(login);
}

function configurarRodape(opcoes) {
  const navegacao =
    localizarNavegacaoRodape();

  if (!navegacao) {
    console.warn(
      "Navegação do rodapé não encontrada."
    );

    return;
  }

  const icones = [
    "bi-house-fill",
    "bi-megaphone-fill",
    "bi-clipboard-data-fill",
    "bi-buildings-fill"
  ];

  navegacao.innerHTML = "";

  opcoes.forEach((opcao, indice) => {
    navegacao.appendChild(
      criarLinkRodape(
        opcao.texto,
        opcao.href,
        icones[indice] ||
          "bi-circle-fill"
      )
    );
  });
}

/* ===PERFIL=== */
function removerBotoesVisitante() {
  document
    .querySelectorAll(
      "[data-tipo='acoes-visitante']"
    )
    .forEach((elemento) => {
      elemento.remove();
    });
}

function removerTodasFotosPerfil(area) {
  if (!area) {
    return;
  }

  Array.from(
    area.querySelectorAll("a")
  )
    .filter((link) => {
      return (
        link.dataset.tipo === "perfil" ||
        Boolean(
          link.querySelector(
            "img.rounded-circle"
          )
        )
      );
    })
    .forEach((link) => {
      link.remove();
    });
}

function criarLinkPerfil(
  usuario,
  linkPerfil
) {
  const link =
    document.createElement("a");

  link.href = linkPerfil;
  link.dataset.tipo = "perfil";
  link.title = "Meu perfil";

  const imagem =
    document.createElement("img");

  const nomeUsuario =
    usuario.nomeUsuario ||
    usuario.nome ||
    "usuário";

  const fotoPerfil =
    usuario.fotoPerfil ||
    usuario.foto ||
    usuario.avatar ||
    usuario.imagemPerfil ||
    usuario.imagem ||
    "/assets/images/foto_perfil_padrao.png";

  imagem.src =
    ajustarCaminhoImagem(fotoPerfil);

  imagem.alt =
    `Foto de perfil de ${nomeUsuario}`;

  imagem.className =
    "rounded-circle border border-light";

  imagem.width = 40;
  imagem.height = 40;

  imagem.style.width = "40px";
  imagem.style.height = "40px";
  imagem.style.objectFit = "cover";
  imagem.style.display = "block";

  imagem.onerror = function () {
    imagem.onerror = null;

    imagem.src =
      "/assets/images/foto_perfil_padrao.png";
  };

  link.appendChild(imagem);

  return link;
}

function configurarFotoPerfil(
  usuario,
  linkPerfil
) {
  removerBotoesVisitante();

  const nomeUsuario =
    usuario.nomeUsuario ||
    usuario.nome ||
    "usuário";

  const fotoPerfil =
    usuario.fotoPerfil ||
    usuario.foto ||
    usuario.avatar ||
    usuario.imagemPerfil ||
    usuario.imagem ||
    "/assets/images/foto_perfil_padrao.png";

  const caminhoFoto =
    ajustarCaminhoImagem(fotoPerfil);

  const areas = [
    localizarAreaDireitaDesktop(),
    localizarAreaDireitaMobile()
  ];

  areas.forEach((area) => {
    if (!area) {
      return;
    }

    const linksPerfil = Array.from(
      area.querySelectorAll("a")
    ).filter((link) => {
      return (
        link.dataset.tipo === "perfil" ||
        Boolean(
          link.querySelector(
            "img.rounded-circle"
          )
        )
      );
    });

    let linkPrincipal =
      linksPerfil[0] || null;

    linksPerfil
      .slice(1)
      .forEach((linkDuplicado) => {
        linkDuplicado.remove();
      });

    if (!linkPrincipal) {
      linkPrincipal =
        criarLinkPerfil(
          usuario,
          linkPerfil
        );

      const botaoMenu =
        area.querySelector("button");

      if (botaoMenu) {
        area.insertBefore(
          linkPrincipal,
          botaoMenu
        );
      } else {
        area.appendChild(
          linkPrincipal
        );
      }
    }

    linkPrincipal.href =
      linkPerfil;

    linkPrincipal.dataset.tipo =
      "perfil";

    linkPrincipal.title =
      "Meu perfil";

    linkPrincipal.setAttribute(
      "aria-label",
      `Abrir perfil de ${nomeUsuario}`
    );

    let imagem =
      linkPrincipal.querySelector("img");

    if (!imagem) {
      imagem =
        document.createElement("img");

      linkPrincipal.appendChild(
        imagem
      );
    }

    imagem.src =
      caminhoFoto;

    imagem.alt =
      `Foto de perfil de ${nomeUsuario}`;

    imagem.className =
      "rounded-circle border border-light";

    imagem.width = 40;
    imagem.height = 40;

    imagem.style.width = "40px";
    imagem.style.height = "40px";
    imagem.style.objectFit = "cover";
    imagem.style.display = "block";

    imagem.onerror = function () {
      imagem.onerror = null;

      imagem.src =
        "/assets/images/foto_perfil_padrao.png";
    };
  });
}

/* ===BOTÕES DO VISITANTE=== */
function criarBotoesVisitante(
  mobile = false
) {
  const container =
    document.createElement("div");

  container.dataset.tipo =
    "acoes-visitante";

  container.className =
    "d-flex align-items-center gap-2";

  const cadastro =
    document.createElement("a");

  cadastro.href =
    ROTAS.visitante.cadastro;

  cadastro.className = mobile
    ? "btn btn-sm btn-outline-light fw-semibold"
    : "btn btn-outline-light fw-semibold";

  cadastro.textContent =
    "Cadastre-se";

  const login =
    document.createElement("a");

  login.href =
    ROTAS.visitante.login;

  login.className = mobile
    ? "btn btn-sm fw-semibold text-white"
    : "btn fw-semibold text-white";

  login.style.background =
    "linear-gradient(135deg, #f97316, #f59e0b)";

  login.style.border =
    "none";

  login.textContent =
    "Login";

  container.appendChild(cadastro);
  container.appendChild(login);

  return container;
}

function configurarBotoesVisitante() {
  removerBotoesVisitante();

  const areaDesktop =
    localizarAreaDireitaDesktop();

  const areaMobile =
    localizarAreaDireitaMobile();

  removerTodasFotosPerfil(
    areaDesktop
  );

  removerTodasFotosPerfil(
    areaMobile
  );

  if (areaDesktop) {
    areaDesktop.appendChild(
      criarBotoesVisitante(false)
    );
  }

  if (areaMobile) {
    const botoes =
      criarBotoesVisitante(true);

    const botaoMenu =
      areaMobile.querySelector("button");

    if (botaoMenu) {
      areaMobile.insertBefore(
        botoes,
        botaoMenu
      );
    } else {
      areaMobile.appendChild(
        botoes
      );
    }
  }
}

/* ===LAYOUT DO VISITANTE=== */
function aplicarLayoutVisitante() {
  const opcoes = [
    {
      texto: "Início",
      href: ROTAS.homepage
    },
    {
      texto: "Denúncias",
      href: ROTAS.visitante.denuncias
    }
  ];

  configurarMenuDesktop(opcoes);

  configurarMenuMobile(
    opcoes,
    true
  );

  configurarRodape(opcoes);

  configurarBotoesVisitante();

  console.log(
    "Layout carregado: visitante"
  );
}

/* ===LAYOUT DO MORADOR=== */
function aplicarLayoutMorador(usuario) {
  const opcoes = [
    {
      texto: "Início",
      href: ROTAS.homepage
    },
    {
      texto: "Faça sua denúncia",
      href:
        ROTAS.morador.cadastrarDenuncia
    },
    {
      texto: "Minhas denúncias",
      href:
        ROTAS.morador.minhasDenuncias
    },
    {
      texto: "Outras denúncias",
      href:
        ROTAS.morador.outrasDenuncias
    }
  ];

  configurarMenuDesktop(opcoes);

  configurarMenuMobile(
    opcoes,
    false
  );

  configurarRodape(opcoes);

  configurarFotoPerfil(
    usuario,
    ROTAS.morador.perfil
  );

  console.log(
    "Layout carregado: morador",
    usuario
  );
}

/* ===LAYOUT DA EMPRESA=== */
function aplicarLayoutEmpresa(usuario) {
  const opcoes = [
    {
      texto: "Início",
      href: ROTAS.homepage
    },
    {
      texto: "Denúncias",
      href: ROTAS.empresa.denuncias
    },
    {
      texto: "Minhas obras",
      href: ROTAS.empresa.minhasObras
    }
  ];

  configurarMenuDesktop(opcoes);

  configurarMenuMobile(
    opcoes,
    false
  );

  configurarRodape(opcoes);

  configurarFotoPerfil(
    usuario,
    ROTAS.empresa.perfil
  );

  console.log(
    "Layout carregado: empresa",
    usuario
  );
}

/* ===LAYOUT DA PREFEITURA=== */
function aplicarLayoutPrefeitura(usuario) {
  const opcoes = [
    {
      texto: "Início",
      href: ROTAS.homepage
    },
    {
      texto: "Denúncias",
      href:
        ROTAS.prefeitura.denuncias
    },
    {
      texto: "Minhas obras",
      href:
        ROTAS.prefeitura.minhasObras
    }
  ];

  configurarMenuDesktop(opcoes);

  configurarMenuMobile(
    opcoes,
    false
  );

  configurarRodape(opcoes);

  configurarFotoPerfil(
    usuario,
    ROTAS.prefeitura.perfil
  );

  console.log(
    "Layout carregado: prefeitura",
    usuario
  );
}

/* ===CARREGAMENTO DO LAYOUT=== */
async function carregarLayoutUsuario() {
  try {
    const resposta =
      await fetch(
        `${API_URL}/usuarioLogado`
      );

    if (!resposta.ok) {
      aplicarLayoutVisitante();
      return;
    }

    const usuarioLogado =
      await resposta.json();

    const objetoVazio =
      !usuarioLogado ||
      typeof usuarioLogado !==
        "object" ||
      Object.keys(
        usuarioLogado
      ).length === 0;

    const cpf =
      normalizarCpf(
        usuarioLogado?.cpf
      );

    if (
      objetoVazio ||
      usuarioLogado?.logado === false ||
      !cpf
    ) {
      aplicarLayoutVisitante();
      return;
    }

    const [
      moradores,
      usuariosInstituicoes,
      instituicoes
    ] = await Promise.all([
      carregarColecao(
        "usuariosMoradores"
      ),

      carregarColecao(
        "usuariosInstituicoes"
      ),

      carregarColecao(
        "instituicoes"
      )
    ]);

    const morador =
      encontrarUsuarioPorCpf(
        moradores,
        cpf
      );

    if (morador) {
      aplicarLayoutMorador(
        morador
      );

      return;
    }

    const usuarioInstituicao =
      encontrarUsuarioPorCpf(
        usuariosInstituicoes,
        cpf
      );

    if (usuarioInstituicao) {
      const instituicao =
        encontrarInstituicaoPorId(
          instituicoes,
          usuarioInstituicao
            .instituicao_id
        );

      if (!instituicao) {
        throw new Error(
          `Instituição ${usuarioInstituicao.instituicao_id} não encontrada.`
        );
      }

      const tipoInstituicao =
        descobrirTipoInstituicao(
          instituicao
        );

      if (
        tipoInstituicao ===
        "prefeitura"
      ) {
        aplicarLayoutPrefeitura(
          usuarioInstituicao
        );
      } else {
        aplicarLayoutEmpresa(
          usuarioInstituicao
        );
      }

      return;
    }

    console.warn(
      `Nenhum usuário encontrado com o CPF ${cpf}.`
    );

    aplicarLayoutVisitante();

  } catch (erro) {
    console.error(
      "Erro ao configurar o layout:",
      erro
    );

    aplicarLayoutVisitante();
  }
}

/* ===GEOLOCALIZAÇÃO=== */
navigator.geolocation.getCurrentPosition(
  (posicao) => {
    localUsuario = [
      posicao.coords.latitude,
      posicao.coords.longitude
    ];

    mapa.setView(
      localUsuario,
      15
    );

    L.circleMarker(
      localUsuario,
      {
        radius: 10,
        fillColor: "#0d6efd",
        color: "#ffffff",
        weight: 3,
        opacity: 1,
        fillOpacity: 1
      }
    )
      .addTo(mapa)
      .bindPopup(
        "Você está aqui"
      );
  },

  () => {
    mapa.setView(
      [-19.9167, -43.9345],
      12
    );
  }
);

/* ===BUSCA DE ENDEREÇO=== */
async function buscarEndereco(query) {
  const texto =
    String(query || "").trim();

  if (!texto) {
    return;
  }

  try {
    const resposta = await fetch(
      "https://nominatim.openstreetmap.org/search" +
      `?format=json&q=${encodeURIComponent(texto)}` +
      "&countrycodes=br&addressdetails=1&limit=5"
    );

    if (!resposta.ok) {
      throw new Error(
        `Erro na busca. Status: ${resposta.status}`
      );
    }

    const dados =
      await resposta.json();

    if (dados.length === 0) {
      return;
    }

    const latitude =
      Number(dados[0].lat);

    const longitude =
      Number(dados[0].lon);

    mapa.setView(
      [latitude, longitude],
      16
    );

    L.marker(
      [latitude, longitude]
    )
      .addTo(mapa)
      .bindPopup(
        dados[0].display_name
      )
      .openPopup();

  } catch (erro) {
    console.error(
      "Erro ao buscar endereço:",
      erro
    );
  }
}

if (inputMapa) {
  inputMapa.addEventListener(
    "input",
    async () => {
      const texto =
        inputMapa.value.trim();

      if (!sugestoes) {
        return;
      }

      if (texto.length < 3) {
        sugestoes.innerHTML = "";
        return;
      }

      try {
        const resposta =
          await fetch(
            "https://nominatim.openstreetmap.org/search" +
            `?format=json&q=${encodeURIComponent(texto)}` +
            "&countrycodes=br&addressdetails=1&limit=5"
          );

        const dados =
          await resposta.json();

        sugestoes.innerHTML = "";

        dados.forEach((local) => {
          const item =
            document.createElement("div");

          item.className =
            "sugestao";

          const endereco =
            local.address?.road ||
            local.address?.suburb ||
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

          item.addEventListener(
            "click",
            () => {
              inputMapa.value =
                item.textContent;

              mapa.setView(
                [
                  Number(local.lat),
                  Number(local.lon)
                ],
                16
              );

              sugestoes.innerHTML =
                "";
            }
          );

          sugestoes.appendChild(
            item
          );
        });

      } catch (erro) {
        console.error(
          "Erro ao carregar sugestões:",
          erro
        );
      }
    }
  );

  inputMapa.addEventListener(
    "keydown",
    (evento) => {
      if (evento.key === "Enter") {
        buscarEndereco(
          inputMapa.value
        );
      }
    }
  );
}

document.addEventListener(
  "click",
  (evento) => {
    if (
      sugestoes &&
      !evento.target.closest(
        ".map-search"
      )
    ) {
      sugestoes.innerHTML = "";
    }
  }
);

/* ===CONTROLES DO MAPA=== */
L.control.zoom({
  position: "bottomright"
}).addTo(mapa);


const botaoLocalizacao =
  L.control({
    position: "bottomright"
  });

botaoLocalizacao.onAdd =
  function () {
    const div =
      L.DomUtil.create(
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

    div.addEventListener(
      "click",
      (evento) => {
        evento.preventDefault();

        if (localUsuario) {
          mapa.setView(
            localUsuario,
            15
          );
        }
      }
    );

    return div;
  };

botaoLocalizacao.addTo(mapa);

const botaoMapaCalor =
  L.control({
    position: "bottomright"
  });

botaoMapaCalor.onAdd =
  function () {
    const div =
      L.DomUtil.create(
        "div",
        "leaflet-bar"
      );

    div.innerHTML = `
      <a
        href="${ROTAS.mapaCalor}"
        class="map-btn"
        title="Mapa de calor"
      >
        🔥
      </a>
    `;

    return div;
  };

botaoMapaCalor.addTo(mapa);

const botaoSatelite =
  L.control({
    position: "bottomright"
  });

botaoSatelite.onAdd =
  function () {
    const div =
      L.DomUtil.create(
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

    div.addEventListener(
      "click",
      (evento) => {
        evento.preventDefault();

        if (
          mapaAtual === "padrao"
        ) {
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
      }
    );

    return div;
  };

botaoSatelite.addTo(mapa);

/* ===MARCADORES=== */
function renderizarMarcadores(lista) {
  marcadores.forEach((item) => {
    mapa.removeLayer(
      item.marker
    );
  });

  marcadores = [];

  lista
    .filter((denuncia) => {
      return (
        denuncia.status !==
        "resolvida"
      );
    })
    .forEach((denuncia) => {
      let classeUrgencia =
        "urgencia-baixa";

      if (
        denuncia.urgencia === 2
      ) {
        classeUrgencia =
          "urgencia-media";
      }

      if (
        denuncia.urgencia === 3
      ) {
        classeUrgencia =
          "urgencia-alta";
      }

      const icone =
        iconesCategorias[
          denuncia.categoria
        ] ||
        iconesCategorias.default;

      const iconeMapa =
        L.divIcon({
          className: "",

          html: `
            <div class="marker-container ${classeUrgencia}">
              <img
                src="${icone}"
                alt="${denuncia.categoria}"
              >
            </div>
          `,

          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

      const marker =
        L.marker(
          denuncia.coords,
          {
            icon: iconeMapa
          }
        )
          .addTo(mapa)
          .bindPopup(`
            <strong>
              ${denuncia.titulo}
            </strong>

            <br>

            ${denuncia.endereco}

            <br>

            Categoria:
            ${denuncia.categoria}
          `);

      marcadores.push({
        id: denuncia.id,
        marker
      });
    });
}

function verNoMapa(id) {
  const denuncia =
    denuncias.find((item) => {
      return (
        item.id === Number(id)
      );
    });

  if (!denuncia) {
    return;
  }

  mapa.setView(
    denuncia.coords,
    17
  );

  const marcador =
    marcadores.find((item) => {
      return (
        item.id === Number(id)
      );
    });

  if (marcador) {
    marcador.marker.openPopup();
  }
}

window.verNoMapa = verNoMapa;

/* ===TEMPO DECORRIDO=== */
function tempoDecorrido(dataString) {
  if (!dataString) {
    return "";
  }

  const data =
    new Date(
      `${dataString}T00:00:00`
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "";
  }

  const agora =
    new Date();

  const segundos =
    Math.floor(
      (agora - data) / 1000
    );

  if (segundos < 0) {
    return "recentemente";
  }

  const minutos =
    Math.floor(
      segundos / 60
    );

  const horas =
    Math.floor(
      minutos / 60
    );

  const dias =
    Math.floor(
      horas / 24
    );

  const meses =
    Math.floor(
      dias / 30
    );

  const anos =
    Math.floor(
      dias / 365
    );

  if (minutos < 1) {
    return "agora";
  }

  if (minutos < 60) {
    return `há ${minutos} min`;
  }

  if (horas < 24) {
    return `há ${horas} h`;
  }

  if (dias < 30) {
    return `há ${dias} dias`;
  }

  if (dias < 365) {
    return `há ${meses} meses`;
  }

  return `há ${anos} anos`;
}

/* ===LISTA DE DENÚNCIAS=== */
function renderizarLista(lista) {
  if (!listaContainer) {
    return;
  }

  listaContainer.innerHTML = "";

  if (lista.length === 0) {
    listaContainer.innerHTML = `
      <p class="sem-resultados">
        Nenhuma denúncia encontrada.
      </p>
    `;

    return;
  }

  lista.forEach((denuncia) => {
    const resolvida =
      denuncia.status ===
      "resolvida";

    const textoTempo =
      resolvida &&
      denuncia.dataResolucao
        ? `Resolvida ${tempoDecorrido(
            denuncia.dataResolucao
          )}`
        : `Publicada ${tempoDecorrido(
            denuncia.dataPublicacao
          )}`;

    let textoUrgencia =
      "Baixa";

    let classeUrgencia =
      "urgencia-texto-baixa";

    if (
      denuncia.urgencia === 2
    ) {
      textoUrgencia =
        "Média";

      classeUrgencia =
        "urgencia-texto-media";
    }

    if (
      denuncia.urgencia === 3
    ) {
      textoUrgencia =
        "Alta";

      classeUrgencia =
        "urgencia-texto-alta";
    }

    let textoStatus =
      "Em andamento";

    if (
      denuncia.status === "aberta"
    ) {
      textoStatus = "Aberta";
    }

    if (resolvida) {
      textoStatus = "Resolvida";
    }

    const card =
      document.createElement("div");

    card.className =
      "card-denuncia";

    card.innerHTML = `
      <div class="card-topo">
        <img
          src="${denuncia.imagem}"
          alt="${denuncia.titulo}"
          onerror="this.onerror=null; this.src='/assets/images/sem-imagem.png';"
        >

        <div class="card-info">
          <p>
            ${denuncia.endereco}
          </p>

          <span class="urgencia-texto ${classeUrgencia}">
            Urgência ${textoUrgencia}
          </span>

          <h3>
            ${denuncia.titulo}
          </h3>

          <p class="tempo-denuncia">
            ${textoTempo}
          </p>
        </div>
      </div>

      <div class="card-rodape">
        <span class="status ${denuncia.status}">
          ${textoStatus}
        </span>

        <div class="acoes-card">
          <a
            href="${ROTAS.detalhesDenuncia}?id=${denuncia.id}"
            class="btn-detalhes"
          >
            Detalhes
          </a>

          ${
            !resolvida
              ? `
                <button
                  type="button"
                  class="btn-mapa"
                  onclick="verNoMapa(${denuncia.id})"
                >
                  Mapa
                </button>
              `
              : `
                <button
                  type="button"
                  class="btn-mapa desativado"
                  disabled
                >
                  Concluída
                </button>
              `
          }
        </div>
      </div>
    `;

    listaContainer.appendChild(
      card
    );
  });
}

/* ===ATUALIZAÇÃO DA TELA=== */
function atualizarTela(lista) {
  renderizarLista(lista);
  renderizarMarcadores(lista);
}

  /* ===FILTROS=== */
  botoesFiltro.forEach((botao) => {
  botao.addEventListener(
    "click",
    () => {
      botoesFiltro.forEach(
        (item) => {
          item.classList.remove(
            "ativo",
            "bg-gradient-custom"
          );
        }
      );

      botao.classList.add(
        "ativo",
        "bg-gradient-custom"
      );

      const filtro =
        botao.dataset.filtro;

      let resultado =
        denuncias;

      if (filtro === "abertas") {
        resultado =
          denuncias.filter(
            (denuncia) => {
              return (
                denuncia.status ===
                "aberta"
              );
            }
          );
      } else if (
        filtro !== "todas"
      ) {
        resultado =
          denuncias.filter(
            (denuncia) => {
              return (
                denuncia.status ===
                filtro
              );
            }
          );
      }

      atualizarTela(resultado);
    }
  );
  });

/* ===BUSCA DE DENÚNCIAS=== */
function filtrarDenunciasPorTexto(
  texto
) {
  const valor =
    String(texto || "")
      .trim()
      .toLowerCase();

  return denuncias.filter(
    (denuncia) => {
      return (
        denuncia.titulo
          .toLowerCase()
          .includes(valor) ||

        denuncia.endereco
          .toLowerCase()
          .includes(valor) ||

        denuncia.categoria
          .toLowerCase()
          .includes(valor)
      );
    }
  );
}

function configurarBuscaDenuncias(
  input
) {
  if (!input) {
    return;
  }

  input.addEventListener(
    "input",
    () => {
      atualizarTela(
        filtrarDenunciasPorTexto(
          input.value
        )
      );
    }
  );
}

configurarBuscaDenuncias(
  inputBusca
);

configurarBuscaDenuncias(
  inputBuscaMobile
);

/* ===ESTATÍSTICAS=== */

function atualizarEstatisticas(lista) {
  const total =
    lista.length;

  const andamento =
    lista.filter((denuncia) => {
      return (
        denuncia.status ===
        "andamento"
      );
    }).length;

  const resolvidas =
    lista.filter((denuncia) => {
      return (
        denuncia.status ===
        "resolvida"
      );
    }).length;

  const porcentagem =
    total > 0
      ? Math.round(
          (resolvidas / total) *
            100
        )
      : 0;

  const estatRealizadas =
    document.getElementById(
      "estat-realizadas"
    );

  const estatPorcentagem =
    document.getElementById(
      "estat-porcentagem-realizadas"
    );

  const estatAndamento =
    document.getElementById(
      "estat-andamento"
    );

  const estatResolvidas =
    document.getElementById(
      "estat-resolvidas"
    );

  const estatUsuarios =
    document.getElementById(
      "estat-usuarios"
    );

  if (estatRealizadas) {
    estatRealizadas.textContent =
      total;
  }

  if (estatPorcentagem) {
    estatPorcentagem.textContent =
      `${porcentagem}% resolvidas`;
  }

  if (estatAndamento) {
    estatAndamento.textContent =
      andamento;
  }

  if (estatResolvidas) {
    estatResolvidas.textContent =
      resolvidas;
  }

  if (estatUsuarios) {
    estatUsuarios.textContent =
      totalUsuarios;
  }
}

  /* ===CONVERSÃO DOS DADOS DAS DENÚNCIAS=== */
function converterDenuncia(
  denuncia,
  listaStatus,
  listaCategorias
) {
  const statusEncontrado =
    listaStatus.find((status) => {
      return (
        Number(status.id) ===
        Number(denuncia.status_id)
      );
    });

  const nomeStatus =
    String(
      statusEncontrado?.nome || ""
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase();

  let statusFormatado =
    "andamento";

  if (
    nomeStatus.includes("aberto") ||
    Number(denuncia.status_id) === 3
  ) {
    statusFormatado =
      "aberta";
  }

  if (
    nomeStatus.includes("conclu") ||
    nomeStatus.includes("finalizada") ||
    Number(denuncia.status_id) === 1 ||
    Number(denuncia.status_id) === 4
  ) {
    statusFormatado =
      "resolvida";
  }

  const categoriaEncontrada =
    listaCategorias.find(
      (categoria) => {
        return (
          Number(categoria.id) ===
          Number(
            denuncia.categoria_id
          )
        );
      }
    );

  const partesEndereco = [
    denuncia.local?.logradouro,
    denuncia.local?.numero,
    denuncia.local?.bairro,
    denuncia.local?.cidade,
    denuncia.local?.estado
  ].filter((parte) => {
    return (
      parte !== undefined &&
      parte !== null &&
      String(parte).trim() !== ""
    );
  });

  const latitude =
    Number(
      denuncia.local?.latitude
    );

  const longitude =
    Number(
      denuncia.local?.longitude
    );

  const titulo =
    denuncia.titulo ||
    denuncia.descricaoDenuncia
      ?.substring(0, 40) ||
    "Denúncia";

  return {
    id:
      Number(denuncia.id),

    titulo,

    endereco:
      partesEndereco.join(", "),

    status:
      statusFormatado,

    imagem:
      ajustarCaminhoImagem(
        denuncia.imagens?.[0] ||
        "/assets/images/sem-imagem.png"
      ),

    categoria:
      categoriaEncontrada?.nome ||
      "default",

    urgencia:
      Number(
        denuncia.urgencia_id
      ),

    dataPublicacao:
      denuncia.dataPublicacao,

    dataResolucao:
      denuncia.dataResolucao ||
      null,

    coords: [
      latitude,
      longitude
    ]
  };
}

/* ===CARREGAMENTO DAS DENÚNCIAS=== */
async function carregarDenuncias() {
  try {
    const [
      denunciasBanco,
      listaStatus,
      listaCategorias,
      usuariosMoradores,
      usuariosInstituicoes
    ] = await Promise.all([
      carregarColecao("denuncias"),
      carregarColecao("status"),
      carregarColecao("categorias"),
      carregarColecao(
        "usuariosMoradores"
      ),
      carregarColecao(
        "usuariosInstituicoes"
      )
    ]);

    totalUsuarios =
      usuariosMoradores.length +
      usuariosInstituicoes.length;

    denuncias =
      denunciasBanco
        .map((denuncia) => {
          return converterDenuncia(
            denuncia,
            listaStatus,
            listaCategorias
          );
        })
        .filter((denuncia) => {
          return (
            Number.isFinite(
              denuncia.coords[0]
            ) &&
            Number.isFinite(
              denuncia.coords[1]
            )
          );
        });

    atualizarTela(denuncias);

    atualizarEstatisticas(
      denuncias
    );

  } catch (erro) {
    console.error(
      "Erro ao carregar denúncias:",
      erro
    );

    if (listaContainer) {
      listaContainer.innerHTML = `
        <p class="erro-carregamento">
          Não foi possível carregar as denúncias.
        </p>
      `;
    }
  }
}

/* ===INICIALIZAÇÃO=== */
async function inicializarSistema() {
  await carregarLayoutUsuario();
  await carregarDenuncias();
}

inicializarSistema();