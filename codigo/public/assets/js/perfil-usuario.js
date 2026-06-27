const API_URL = "http://localhost:3000";

let dadosUsuarioLogado = null;
let dadosPerfilLogado = null;
let denunciasDoUsuario = [];
let novaFotoBase64 = null;
let usuariosMoradores = [];
let usuariosInstituicoes = [];
let infoPerfilMoradores = [];
let infoPerfilInstituicoes = [];
let filtroAtual = "todas"; // Guarda o estado selecionado do filtro

async function carregarDadosPerfil() {
    try {
        const [resLogado, resMoradores, resPerfilMoradores, resInstituicoes, resPerfilInstituicoes, resDenuncias] = await Promise.all([
            fetch(`${API_URL}/usuarioLogado`).then(r => r.json()),
            fetch(`${API_URL}/usuariosMoradores`).then(r => r.json()),
            fetch(`${API_URL}/infoPerfilMoradores`).then(r => r.json()),
            fetch(`${API_URL}/usuariosInstituicoes`).then(r => r.json()),
            fetch(`${API_URL}/infoPerfilInstituicoes`).then(r => r.json()),
            fetch(`${API_URL}/denuncias`).then(r => r.json())
        ]);

        usuariosMoradores = resMoradores;
        usuariosInstituicoes = resInstituicoes;
        infoPerfilMoradores = resPerfilMoradores;
        infoPerfilInstituicoes = resPerfilInstituicoes;

        const cpfLogado = resLogado?.cpf;
        if (!cpfLogado) {
            alert("Nenhum usuário logado encontrado.");
            return;
        }

        const usuario = resMoradores?.find(u => u.cpf === cpfLogado);
        if (!usuario) {
            alert("Erro: Usuário não encontrado na base de moradores.");
            return;
        }

        dadosUsuarioLogado = usuario;
        dadosPerfilLogado = resPerfilMoradores?.find(p => p.usuarioMorador_cpf === cpfLogado);
        
        const deunciasAcompanhadas = usuario.denuncias_acompanhadas || [];
        denunciasDoUsuario = resDenuncias?.filter(d => 
            deunciasAcompanhadas.includes(String(d.id)) || d.denunciante === cpfLogado
        ) || [];

        configurarInterfaceUsuario();

        const rootDinamico = document.getElementById("profile-root");
        if (rootDinamico) {
            renderizarLayoutDinamicoMorador(rootDinamico);
        }
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
    }
}

function configurarInterfaceUsuario() {
    const cpf = dadosUsuarioLogado.cpf;

    const foto = dadosPerfilLogado?.fotoPerfil || "";
    const nome = dadosUsuarioLogado.nome_usuario || dadosUsuarioLogado.nome_completo || "Usuário";

    if (foto) {
        document.querySelectorAll(".avatar").forEach(img => { img.src = foto; });
    }

    const opcoes = [
        { texto: "Início", href: "/" },
        { texto: "Faça sua denúncia", href: "/modulos/cadastro_denuncia/cadastro_denuncia.html" },
        { texto: "Minhas denúncias", href: "/modulos/perfis/index.html" },
        { texto: "Outras denúncias", href: "/modulos/outras_denuncias/outras_denuncias.html" }
    ];

    const menuDesktop = document.querySelector(
        "header .collapse.navbar-collapse .navbar-nav"
    );
    if (menuDesktop) {
        menuDesktop.innerHTML = "";
        opcoes.forEach(({ texto, href }) => {
            const li = document.createElement("li");
            li.className = "nav-item";
            const a = document.createElement("a");
            a.className = "nav-link text-light fw-semibold";
            a.href = href;
            a.textContent = texto;
            li.appendChild(a);
            menuDesktop.appendChild(li);
        });
    }

    const menuMobile = document.getElementById("menuMobile");
    if (menuMobile) {
        menuMobile.querySelectorAll("a").forEach(el => el.remove());
        opcoes.forEach(({ texto, href }) => {
            const a = document.createElement("a");
            a.className = "d-block text-light text-decoration-none py-2";
            a.href = href;
            a.textContent = texto;
            menuMobile.appendChild(a);
        });
    }

    // Foto de perfil no header
    const linkPerfil = "/modulos/perfis/perfil-usuario.html";

    [
        document.querySelector("header .collapse.navbar-collapse .ms-auto.d-flex"),
        document.querySelector("header .d-flex.d-lg-none.align-items-center")
    ].forEach(area => {
        if (!area) return;

        area.querySelectorAll("[data-tipo='acoes-visitante']").forEach(el => el.remove());
        area.querySelectorAll("a[data-tipo='perfil'], a:has(img.rounded-circle)").forEach(el => el.remove());

        const link = document.createElement("a");
        link.href = linkPerfil;
        link.dataset.tipo = "perfil";
        link.title = "Meu perfil";

        const img = document.createElement("img");
        img.src = foto;
        img.alt = `Foto de perfil de ${nome}`;
        img.className = "rounded-circle border border-light";
        img.width = 40;
        img.height = 40;
        img.style.cssText = "width:40px;height:40px;object-fit:cover;display:block;";
        img.onerror = function() { this.onerror = null; this.src = ""; };

        link.appendChild(img);

        const botaoMenu = area.querySelector("button");
        if (botaoMenu) area.insertBefore(link, botaoMenu);
        else area.appendChild(link);
    });
    const footerNav = document.querySelector(".footer-nav");
    if (footerNav) {
        const opcoesFooter = [
            { texto: "Início", href: "/", icone: "bi-house-fill" },
            { texto: "Faça sua denúncia", href: "/modulos/cadastro_denuncia/cadastro_denuncia.html", icone: "bi-megaphone-fill" },
            { texto: "Minhas denúncias", href: "/modulos/perfis/index.html", icone: "bi-clipboard-data-fill" },
            { texto: "Outras denúncias", href: "/modulos/outras_denuncias/outras_denuncias.html", icone: "bi-buildings-fill" }
        ];

        footerNav.innerHTML = "";
        opcoesFooter.forEach(({ texto, href, icone }) => {
            const a = document.createElement("a");
            a.href = href;
            a.className = "footer-link";
            a.innerHTML = `<i class="bi ${icone}"></i><span>${texto}</span>`;
            footerNav.appendChild(a);
        });
    }
}

function renderizarLayoutDinamicoMorador(root) {
    root.innerHTML = "";

    // Painel Lateral Esquerdo - Usando as classes exatas do seu CSS
    const aside = document.createElement("aside");
    aside.className = "col-12 col-md-4 col-xl-3 text-center d-flex flex-column align-items-center";
    aside.innerHTML = `
        <div class="card card-perfil-zella border-0 shadow-sm px-4 pb-4 pt-5 position-relative w-100">
            <input type="file" id="input-foto-perfil" accept="image/*" style="display: none;">
            
            <div class="avatar-perfil-container position-absolute start-50 translate-middle-x" style="cursor: pointer;" title="Mudar foto">
                <img id="fotoPerfil" src="${dadosPerfilLogado?.fotoPerfil || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}" class="rounded-circle border border-4 border-white shadow" alt="Avatar">
            </div>
            
            <div class="card-body p-0 mt-5 pt-3">
                <h4 id="nome_usuario" class="fw-bold text-dark mb-4 text-center">${dadosUsuarioLogado.nome_usuario || dadosUsuarioLogado.nome_completo}</h4>
                
                <ul class="list-unstyled text-start list-status-zella mb-4 ps-2">
                    <li class="mb-2 d-flex align-items-center">
                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                        <span>Cidadão Ativo</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                        <i class="bi bi-clipboard-check me-2"></i>
                        <span>Demandas atendidas:</span>
                        <strong class="text-dark ms-auto">${dadosPerfilLogado?.estatisticas?.solucionadas || 0}</strong>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                        <i class="bi bi-clipboard-data me-2"></i>
                        <span>Demandas em aberto:</span>
                        <strong class="text-dark ms-auto">${dadosPerfilLogado?.estatisticas?.denuncias_feitas || 0}</strong>
                    </li>
                </ul>
                
                <button type="button" id="btn-nova-denuncia" class="btn btn-nova-denuncia-zella w-100 fw-bold shadow-sm">
                    Nova denúncia +
                </button>
            </div>
        </div>
    `;

    // Painel Conteúdo Principal (Dados Cadastrais + Histórico de Denúncias com Filtros)
    const containerPrincipal = document.createElement("div");
    containerPrincipal.className = "col-12 col-md-8 col-xl-9 ps-md-4 ps-lg-5 divider-lateral-zella";
    containerPrincipal.innerHTML = `
        <section class="card-avaliacoes-zella border-0 shadow-sm p-4 mb-5 bg-white">
            <h3 class="fw-bold text-dark mb-3 title-secao-zella">Os Meus Dados Cadastrais</h3>
            <hr class="mb-4 text-muted opacity-25">
            <form id="form-perfil">
                <div class="row g-3">
                    <div class="col-12 col-md-6">
                        <label class="form-label text-muted small fw-semibold">Nome Completo</label>
                        <input type="text" id="crud-nome" class="form-control" value="${dadosUsuarioLogado.nome_completo || ''}" required>
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="form-label text-muted small fw-semibold">E-mail</label>
                        <input type="email" id="crud-email" class="form-control" value="${dadosUsuarioLogado.email || ''}" required>
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="form-label text-muted small fw-semibold">Telefone</label>
                        <input type="text" id="crud-telefone" class="form-control" value="${dadosUsuarioLogado.telefone || ''}">
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="form-label text-muted small fw-semibold">Senha</label>
                        <input type="password" id="crud-senha" class="form-control" value="${dadosUsuarioLogado.senha || ''}" required>
                    </div>
                </div>
                <div class="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" id="btn-deletar" class="btn btn-outline-danger px-4 rounded-pill small fw-semibold" style="background-color: transparent; color: #dc3545; border: 1px solid #dc3545;">Excluir Conta</button>
                    <button type="submit" id="btn-salvar" class="btn btn-dark px-4 rounded-pill small fw-semibold">Salvar Alterações</button>
                </div>
            </form>
        </section>
        
        <section class="main-content p-0">
            <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between mb-4 gap-3">
                <h2 class="fw-bold text-dark mb-0 title-secao-zella">Histórico de denúncias</h2>
                
                <div class="d-flex gap-1 flex-wrap filter-group-zella">
                    <button type="button" data-filter="todas" class="btn btn-filter-zella ${filtroAtual === 'todas' ? 'active' : ''}">TODAS</button>
                    <button type="button" data-filter="abertas" class="btn btn-filter-zella ${filtroAtual === 'abertas' ? 'active' : ''}">ABERTAS</button>
                    <button type="button" data-filter="em andamento" class="btn btn-filter-zella ${filtroAtual === 'em andamento' ? 'active' : ''}">EM ANDAMENTO</button>
                    <button type="button" data-filter="resolvida" class="btn btn-filter-zella ${filtroAtual === 'resolvida' ? 'active' : ''}">REALIZADAS</button>
                </div>
            </div>
            
            <div id="container-denuncias" class="row row-cols-1 row-cols-lg-2 g-4 overflow-container-zella"></div>
        </section>
    `;

    root.appendChild(aside);
    root.appendChild(containerPrincipal);

    configurarRedirecionamento();
    configurarEventosInteracao();
    configurarEventosFiltro();
    renderizarCardsHistorico();
}

function configurarRedirecionamento() {
    const btnNovaDenuncia = document.getElementById("btn-nova-denuncia");
    if (btnNovaDenuncia) {
        btnNovaDenuncia.onclick = function() {
            window.location.href = "faca-sua-denuncia.html"; 
        };
    }
}

function configurarEventosFiltro() {
    const botoes = document.querySelectorAll(".btn-filter-zella");
    botoes.forEach(botao => {
        botao.onclick = function() {
            botoes.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            filtroAtual = this.getAttribute("data-filter");
            renderizarCardsHistorico();
        };
    });
}

function configurarEventosInteracao() {
    const containerAvatar = document.querySelector(".avatar-perfil-container");
    const inputFoto = document.getElementById("input-foto-perfil");
    const imgFotoPerfil = document.getElementById("fotoPerfil");
    const formPerfil = document.getElementById("form-perfil");
    const btnDeletar = document.getElementById("btn-deletar");

    if (btnDeletar) {
        btnDeletar.onclick = async function() {
            if (confirm("Tem certeza que deseja excluir sua conta permanentemente?")) {
                try {
                    await fetch(`${API_URL}/usuariosMoradores/${dadosUsuarioLogado.id}`, { method: "DELETE" });
                    await fetch(`${API_URL}/usuarioLogado`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({})
                    });
                    alert("Conta removida com sucesso.");
                    window.location.href = "index.html";
                } catch (e) { alert("Erro ao deletar conta."); }
            }
        };
    }

    if (containerAvatar && inputFoto) containerAvatar.onclick = () => inputFoto.click();

    if (inputFoto) {
        inputFoto.onchange = function(e) {
            const arquivo = e.target.files[0];
            if (arquivo) {
                const leitor = new FileReader();
                leitor.onload = function(ev) {
                    novaFotoBase64 = ev.target.result;
                    if (imgFotoPerfil) imgFotoPerfil.src = novaFotoBase64;
                };
                leitor.readAsDataURL(arquivo);
            }
        };
    }

    if (formPerfil) {
        formPerfil.onsubmit = async function(e) {
            e.preventDefault();
            const atualizados = {
                nome_completo: document.getElementById("crud-nome").value.trim(),
                email: document.getElementById("crud-email").value.trim(),
                telefone: document.getElementById("crud-telefone").value.trim(),
                senha: document.getElementById("crud-senha").value
            };

            try {
                await fetch(`${API_URL}/usuariosMoradores/${dadosUsuarioLogado.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(atualizados)
                });

                if (novaFotoBase64 && dadosPerfilLogado) {
                    await fetch(`${API_URL}/infoPerfilMoradores/${dadosPerfilLogado.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fotoPerfil: novaFotoBase64 })
                    });
                }
                alert("Alterações salvas com sucesso!");
                carregarDadosPerfil();
            } catch (err) { alert("Erro ao salvar dados."); }
        };
    }
}

function renderizarCardsHistorico() {
    const container = document.getElementById("container-denuncias");
    if (!container) return;

    // Filtragem lógica baseada nas abas
    const denunciasFiltradas = denunciasDoUsuario.filter(item => {
        if (filtroAtual === "todas") return true;
        const statusItem = (item.status || "abertas").toLowerCase();
        if (filtroAtual === "resolvida") {
            return statusItem === "resolvida" || statusItem === "realizadas";
        }
        return statusItem === filtroAtual;
    });

    if (denunciasFiltradas.length === 0) {
        container.innerHTML = `<div class="col-12 py-3"><p class="text-muted small ps-2">Nenhuma ocorrência encontrada para este filtro.</p></div>`;
        return;
    }

    let html = "";
    denunciasFiltradas.forEach(item => {
        // Puxa a imagem do campo 'imagens' do JSON, se falhar usa o fallback estruturado
        const capa = (item.imagens && item.imagens.length > 0 && item.imagens[0] !== "") 
            ? item.imagens[0] 
            : "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=400";

        // Determinação das classes de Status do seu CSS (.status-andamento ou .status-resolvida)
        const statusStr = item.status || "Abertas";
        let statusClass = "bg-secondary"; 
        
        if (statusStr.toLowerCase() === "resolvida" || statusStr.toLowerCase() === "realizadas") {
            statusClass = "status-resolvida";
        } else if (statusStr.toLowerCase() === "em andamento") {
            statusClass = "status-andamento";
        }

        // Determinação da gravidade (.badge-urgencia-alta, .badge-urgencia-media, etc.)
        const urgenciaStr = (item.urgencia || "Média urgência").toLowerCase();
        let urgenciaClass = "badge-urgencia-media";
        if (urgenciaStr.includes("alta")) urgenciaClass = "badge-urgencia-alta";
        if (urgenciaStr.includes("baixa")) urgenciaClass = "badge-urgencia-baixa";

        html += `
            <div class="col">
                <div class="card card-denuncia-zella border-0 shadow-sm p-3 h-100 position-relative">
                    <div class="row g-3 align-items-start h-100">
                        <div class="col-4 d-flex align-self-stretch">
                            <img src="${capa}" class="img-fluid img-denuncia-cover-zella my-auto" alt="Ocorrência">
                        </div>
                        
                        <div class="col-8 d-flex flex-column h-100 justify-content-between">
                            <div>
                                <div class="d-flex align-items-center justify-content-between mb-1">
                                    <span class="badge-local-zella text-truncate pe-2">
                                        <i class="bi bi-geo-alt-fill me-1"></i>${item.local?.logradouro || 'Local não informado'}
                                    </span>
                                    <span class="badge badge-status-zella ${statusClass}">
                                        ${statusStr}
                                    </span>
                                </div>
                                
                                <h5 class="fw-bold text-dark mb-1 card-title-zella text-truncate-2" title="${item.descricaoDenuncia}">
                                    ${item.descricaoDenuncia}
                                </h5>
                                
                                <div class="d-flex gap-1 mb-2 flex-wrap">
                                    <span class="badge badge-meta-zella"><i class="bi bi-clock me-1"></i>HÁ 2 MESES</span>
                                    <span class="badge badge-meta-zella ${urgenciaClass}">${urgenciaStr.toUpperCase()}</span>
                                </div>
                            </div>
                            
                            <div class="d-flex justify-content-end mt-auto">
                                <a href="detalhes-denuncia.html?id=${item.id}" class="text-decoration-none fw-bold link-details link-detalhes-zella">
                                    Ver detalhes
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", carregarDadosPerfil);