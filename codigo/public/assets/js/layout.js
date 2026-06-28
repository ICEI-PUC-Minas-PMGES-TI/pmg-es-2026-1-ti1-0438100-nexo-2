
const API_URL = "http://localhost:3000";
const ROTAS = {
  homepage: "/",
  visitante: {
    denuncias: "/modulos/outras_denuncias/outras_denuncias.html",
    cadastro: "/modulos/cadastro_usuarios/cadastroUsuario.html",
    login: "/modulos/login/login.html"
  },
  morador: {
    cadastrarDenuncia: "/modulos/cadastro_denuncia/cadastro_denuncia.html",
    minhasDenuncias: "/modulos/perfis/perfil-usuario.html",
    outrasDenuncias: "/modulos/outras_denuncias/outras_denuncias.html",
    perfil: "/modulos/perfis/perfil-usuario.html"
  },
  empresa: {
    denuncias: "/modulos/outras_denuncias/outras_denuncias.html",
    minhasObras: "/modulos/perfis/perfil-instituicao.html",
    perfil: "/modulos/perfis/perfil-instituicao.html"
  },
  prefeitura: {
    denuncias: "/modulos/outras_denuncias/outras_denuncias.html",
    minhasObras: "/modulos/perfis/perfil-instituicao.html",
    perfil: "/modulos/perfis/perfil-instituicao.html"
  }
};

// ===== Funções auxiliares =====
function normalizarCpf(cpf) {
  return String(cpf || "").replace(/\D/g, "");
}

function ajustarCaminhoImagem(caminho) {
  if (!caminho) return "/assets/images/sem-imagem.png";
  if (caminho.startsWith("http") || caminho.startsWith("data:")) return caminho;
  if (caminho.startsWith("/")) return caminho;
  return `/${caminho}`;
}

async function carregarColecao(endpoint) {
  const res = await fetch(`${API_URL}/${endpoint}`);
  if (!res.ok) throw new Error(`Erro ao carregar ${endpoint}`);
  return res.json();
}

function encontrarUsuarioPorCpf(lista, cpf) {
  const cpfProcurado = normalizarCpf(cpf);
  return lista.find(u => normalizarCpf(u.cpf) === cpfProcurado);
}

function descobrirTipoInstituicao(instituicao) {
  const entidadeId = Number(instituicao?.entidade_id);
  if (entidadeId === 2) return "prefeitura";
  if (entidadeId === 3) return "empresa";
  const nome = String(instituicao?.nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return nome.includes("prefeitura") ? "prefeitura" : "empresa";
}

// ===== Criadores de elementos =====
function criarItemMenuDesktop(texto, href) {
  const li = document.createElement("li");
  li.className = "nav-item";
  const a = document.createElement("a");
  a.className = "nav-link text-light fw-semibold";
  a.href = href;
  a.textContent = texto;
  li.appendChild(a);
  return li;
}

function criarLinkMenuMobile(texto, href) {
  const a = document.createElement("a");
  a.className = "d-block text-light text-decoration-none py-2";
  a.href = href;
  a.textContent = texto;
  return a;
}

function criarLinkRodape(texto, href, icone) {
  const a = document.createElement("a");
  a.href = href;
  a.className = "footer-link";
  a.innerHTML = `<i class="bi ${icone}"></i><span>${texto}</span>`;
  return a;
}

function criarBotaoLogout() {
  const btn = document.createElement("button");
  btn.className = "btn btn-outline-light fw-semibold";
  btn.textContent = "Logout";
  btn.addEventListener("click", async () => {
    try {
      sessionStorage.clear();
      await fetch(`${API_URL}/usuarioLogado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: "" })
      });
      window.location.reload();
    } catch (err) { console.error("Erro no logout:", err); }
  });
  return btn;
}

function criarBotoesVisitante(mobile = false) {
  const container = document.createElement("div");
  container.dataset.tipo = "acoes-visitante";
  container.className = "d-flex align-items-center gap-2";

  const cadastro = document.createElement("a");
  cadastro.href = ROTAS.visitante.cadastro;
  cadastro.className = mobile ? "btn btn-sm btn-outline-light fw-semibold" : "btn btn-outline-light fw-semibold";
  cadastro.textContent = "Cadastre-se";

  const login = document.createElement("a");
  login.href = ROTAS.visitante.login;
  login.className = mobile ? "btn btn-sm fw-semibold text-white" : "btn fw-semibold text-white";
  login.style.background = "linear-gradient(135deg, #f97316, #f59e0b)";
  login.style.border = "none";
  login.textContent = "Login";

  container.appendChild(cadastro);
  container.appendChild(login);
  return container;
}

function criarLinkPerfil(usuario, linkPerfil) {
  const link = document.createElement("a");
  link.href = linkPerfil;
  link.dataset.tipo = "perfil";
  link.title = "Meu perfil";

  const img = document.createElement("img");
  const nomeUsuario = usuario.nome_usuario || usuario.nome_completo || "Usuário";
  const foto = usuario.fotoPerfil || usuario.foto || usuario.avatar || "";
  img.src = ajustarCaminhoImagem(foto);
  img.alt = `Foto de ${nomeUsuario}`;
  img.className = "rounded-circle border border-light";
  img.width = 40;
  img.height = 40;
  img.style.cssText = "width:40px;height:40px;object-fit:cover;display:block;";
  img.onerror = function() { this.onerror = null; this.src = ""; };
  link.appendChild(img);
  return link;
}

// ===== Funções de configuração dos menus =====
function configurarMenuDesktop(opcoes) {
  const menu = document.querySelector("header .collapse.navbar-collapse .navbar-nav");
  if (!menu) return;
  menu.innerHTML = "";
  opcoes.forEach(op => menu.appendChild(criarItemMenuDesktop(op.texto, op.href)));
}

function configurarMenuMobile(opcoes, incluirVisitante = false) {
  const menu = document.getElementById("menuMobile");
  if (!menu) return;
  menu.querySelectorAll("a, hr[data-tipo='separador-visitante']").forEach(el => el.remove());
  opcoes.forEach(op => menu.appendChild(criarLinkMenuMobile(op.texto, op.href)));
  if (incluirVisitante) {
    const hr = document.createElement("hr");
    hr.dataset.tipo = "separador-visitante";
    hr.className = "border-light opacity-25 my-2";
    menu.appendChild(hr);
    const cadastro = criarLinkMenuMobile("Cadastre-se", ROTAS.visitante.cadastro);
    cadastro.classList.add("fw-semibold");
    const login = criarLinkMenuMobile("Login", ROTAS.visitante.login);
    login.classList.add("fw-semibold");
    menu.appendChild(cadastro);
    menu.appendChild(login);
  }
}

function configurarRodape(opcoes) {
  const nav = document.querySelector(".footer-nav");
  if (!nav) return;
  const icones = ["bi-house-fill", "bi-megaphone-fill", "bi-clipboard-data-fill", "bi-buildings-fill"];
  nav.innerHTML = "";
  opcoes.forEach((op, idx) => {
    nav.appendChild(criarLinkRodape(op.texto, op.href, icones[idx] || "bi-circle-fill"));
  });
}

function configurarFotoPerfil(usuario, linkPerfil) {
  // Remove botões de visitante (se houver) e fotos antigas
  document.querySelectorAll("[data-tipo='acoes-visitante']").forEach(el => el.remove());
  const areas = [
    document.querySelector("header .collapse.navbar-collapse .ms-auto.d-flex"),
    document.querySelector("header .d-flex.d-lg-none.align-items-center")
  ];
  areas.forEach(area => {
    if (!area) return;
    // Remove links de perfil existentes (para evitar duplicação)
    area.querySelectorAll("a[data-tipo='perfil'], a:has(img.rounded-circle)").forEach(el => el.remove());
    // Insere o novo link
    const link = criarLinkPerfil(usuario, linkPerfil);
    const botaoMenu = area.querySelector("button");
    if (botaoMenu) area.insertBefore(link, botaoMenu);
    else area.appendChild(link);
  });
}

function configurarAcoesHeader(usuario) {
  const areaDesktop = document.querySelector("header .collapse.navbar-collapse .ms-auto.d-flex");
  const areaMobile = document.querySelector("header .d-flex.d-lg-none.align-items-center");
  // Remove ações antigas
  document.querySelectorAll("[data-tipo='acoes-visitante']").forEach(el => el.remove());
  document.querySelectorAll("button.btn-outline-light.fw-semibold").forEach(el => el.remove());

  if (!usuario) {
    if (areaDesktop) areaDesktop.appendChild(criarBotoesVisitante(false));
    if (areaMobile) {
      const botoes = criarBotoesVisitante(true);
      const btnMenu = areaMobile.querySelector("button");
      if (btnMenu) areaMobile.insertBefore(botoes, btnMenu);
      else areaMobile.appendChild(botoes);
    }
    return;
  }
  // Usuário logado: adiciona botão logout
  const logoutDesktop = criarBotaoLogout();
  const logoutMobile = criarBotaoLogout();
  if (areaDesktop) areaDesktop.appendChild(logoutDesktop);
  if (areaMobile) {
    const btnMenu = areaMobile.querySelector("button");
    if (btnMenu) areaMobile.insertBefore(logoutMobile, btnMenu);
    else areaMobile.appendChild(logoutMobile);
  }
}

// ===== Aplicação dos layouts =====
function aplicarLayoutVisitante() {
  const opcoes = [
    { texto: "Início", href: ROTAS.homepage },
    { texto: "Denúncias", href: ROTAS.visitante.denuncias }
  ];
  configurarMenuDesktop(opcoes);
  configurarMenuMobile(opcoes, true);
  configurarRodape(opcoes);
  configurarAcoesHeader(null);
  // Remove foto de perfil
  document.querySelectorAll("a[data-tipo='perfil'], a:has(img.rounded-circle)").forEach(el => el.remove());
}

function aplicarLayoutMorador(usuario) {
  const opcoes = [
    { texto: "Início", href: ROTAS.homepage },
    { texto: "Faça sua denúncia", href: ROTAS.morador.cadastrarDenuncia },
    { texto: "Minhas denúncias", href: ROTAS.morador.minhasDenuncias },
    { texto: "Outras denúncias", href: ROTAS.morador.outrasDenuncias }
  ];
  configurarMenuDesktop(opcoes);
  configurarMenuMobile(opcoes, false);
  configurarRodape(opcoes);
  configurarFotoPerfil(usuario, ROTAS.morador.perfil);
  configurarAcoesHeader(usuario);
}

function aplicarLayoutEmpresa(usuario) {
  const opcoes = [
    { texto: "Início", href: ROTAS.homepage },
    { texto: "Denúncias", href: ROTAS.empresa.denuncias },
    { texto: "Minhas obras", href: ROTAS.empresa.minhasObras }
  ];
  configurarMenuDesktop(opcoes);
  configurarMenuMobile(opcoes, false);
  configurarRodape(opcoes);
  configurarFotoPerfil(usuario, ROTAS.empresa.perfil);
  configurarAcoesHeader(usuario);
}

function aplicarLayoutPrefeitura(usuario) {
  const opcoes = [
    { texto: "Início", href: ROTAS.homepage },
    { texto: "Denúncias", href: ROTAS.prefeitura.denuncias },
    { texto: "Minhas obras", href: ROTAS.prefeitura.minhasObras }
  ];
  configurarMenuDesktop(opcoes);
  configurarMenuMobile(opcoes, false);
  configurarRodape(opcoes);
  configurarFotoPerfil(usuario, ROTAS.prefeitura.perfil);
  configurarAcoesHeader(usuario);
}

// ===== Função principal de inicialização =====
async function inicializarLayout() {
  try {
    const resLogado = await fetch(`${API_URL}/usuarioLogado`);
    if (!resLogado.ok) { aplicarLayoutVisitante(); return; }
    const usuarioLogado = await resLogado.json();
    const cpf = normalizarCpf(usuarioLogado?.cpf);
    if (!cpf) { aplicarLayoutVisitante(); return; }

    const [moradores, usuariosInst, instituicoes, infoPerfilMor, infoPerfilInst] = await Promise.all([
      carregarColecao("usuariosMoradores"),
      carregarColecao("usuariosInstituicoes"),
      carregarColecao("instituicoes"),
      carregarColecao("infoPerfilMoradores"),
      carregarColecao("infoPerfilInstituicoes")
    ]);

    const morador = encontrarUsuarioPorCpf(moradores, cpf);
    if (morador) {
      const perfil = infoPerfilMor.find(p => normalizarCpf(p.usuarioMorador_cpf) === cpf);
      const usuario = { ...morador, fotoPerfil: perfil?.fotoPerfil };
      aplicarLayoutMorador(usuario);
      return;
    }

    const usuarioInst = encontrarUsuarioPorCpf(usuariosInst, cpf);
    if (usuarioInst) {
      const perfil = infoPerfilInst.find(p => normalizarCpf(p.usuarioInstituicao_cpf) === cpf);
      const usuario = { ...usuarioInst, ...perfil };
      const instituicao = instituicoes.find(inst => String(inst.id) === String(usuarioInst.instituicao_id));
      if (!instituicao) { aplicarLayoutVisitante(); return; }
      const tipo = descobrirTipoInstituicao(instituicao);
      if (tipo === "prefeitura") aplicarLayoutPrefeitura(usuario);
      else aplicarLayoutEmpresa(usuario);
      return;
    }

    aplicarLayoutVisitante();
  } catch (err) {
    console.error("Erro ao inicializar layout:", err);
    aplicarLayoutVisitante();
  }
}