/**
 * Zella - Sistema Operacional do Perfil Remoto
 */
const API_URL = "http://localhost:3000";

let dadosUsuarioLogado = null;
let dadosPerfilLogado = null;
let novaFotoBase64 = null;
let filtroAtual = "TODAS";
let listaObrasGeral = [];

async function carregarDadosInstituicao() {
    try {
        const [resLogado, resInstituicoes, resPerfilInstituicoes, resDenuncias, resMoradores, resPerfilMoradores] = await Promise.all([
            fetch(`${API_URL}/usuarioLogado`).then(r => r.json()),
            fetch(`${API_URL}/usuariosInstituicoes`).then(r => r.json()),
            fetch(`${API_URL}/infoPerfilInstituicoes`).then(r => r.json()),
            fetch(`${API_URL}/denuncias`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/usuariosMoradores`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/infoPerfilMoradores`).then(r => r.json()).catch(() => [])
        ]);

        const cpfLogado = resLogado?.cpf;
        if (!cpfLogado) {
            console.warn("Nenhum registro de CPF ativo em /usuarioLogado");
            return;
        }

        const usuario = resInstituicoes?.find(u => {
            const idItem = String(u.identificador || u.cnpj || u.cpf || u.cpf_responsavel || '').replace(/\D/g, '');
            const loginLimpo = String(cpfLogado).replace(/\D/g, '');
            return idItem === loginLimpo;
        });

        if (!usuario) {
            document.getElementById("nome_usuario").innerText = "Conta não vinculada";
            return;
        }

        dadosUsuarioLogado = usuario;
        dadosPerfilLogado = resPerfilInstituicoes?.find(p => {
            const relacaoLimpa = String(p.usuarioInstituicao_cpf || '').replace(/\D/g, '');
            const loginLimpo = String(cpfLogado).replace(/\D/g, '');
            return relacaoLimpa === loginLimpo;
        });

        listaObrasGeral = resDenuncias.length ? resDenuncias : gerarObrasDemonstracao();

        preencherHTMLFixo();
        configurarInterfaceUsuario();
        renderizarAvaliacoesDinamicas(dadosPerfilLogado?.avaliacoes || [], resMoradores, resPerfilMoradores);
        renderizarMuralObras();
        configurarFiltrosAbas();
        configurarEfeitosInterface();
    } catch (e) { 
        console.error("Erro geral na carga do painel institucional:", e); 
    }
}

function preencherHTMLFixo() {
    if (dadosPerfilLogado?.fotoPerfil) {
        document.getElementById("fotoPerfil").src = dadosPerfilLogado.fotoPerfil;
    }
    
    document.getElementById("nome_usuario").innerText = dadosUsuarioLogado.nome_usuario || dadosUsuarioLogado.nome || dadosUsuarioLogado.nome_completo;

    const txtTipo = document.getElementById("txt-tipo-instituicao");
    const titulo = document.getElementById("titulo-dados-perfil");
    const nomeLower = (dadosUsuarioLogado.nome || dadosUsuarioLogado.nome_completo || "").toLowerCase();

    if (nomeLower.includes("prefeitura") || dadosUsuarioLogado.instituicao_id === 2) {
        if(txtTipo) txtTipo.innerText = "Prefeitura Oficial";
        if(titulo) titulo.innerText = "Dados Municipais";
    } else {
        if(txtTipo) txtTipo.innerText = "Parceiro Corporativo";
        if(titulo) titulo.innerText = "Dados da Empresa";
    }

    if (document.getElementById("stat-solucionadas")) {
        document.getElementById("stat-solucionadas").innerText = dadosPerfilLogado?.estatisticas?.solucionadas || "67";
    }
    if (document.getElementById("stat-obras")) {
        document.getElementById("stat-obras").innerText = dadosPerfilLogado?.estatisticas?.obras || "12";
    }

    document.getElementById("crud-nome").value = dadosUsuarioLogado.nome_usuario || dadosUsuarioLogado.nome || dadosUsuarioLogado.nome_completo || "";
    document.getElementById("crud-email").value = dadosUsuarioLogado.email || "";
    document.getElementById("crud-telefone").value = dadosUsuarioLogado.telefone || "(31) 3333-4444";
    document.getElementById("crud-senha").value = dadosUsuarioLogado.senha || "";

    configurarEventosSalvar();
}

function configurarInterfaceUsuario() {
    if (dadosPerfilLogado?.fotoPerfil) {
        document.querySelectorAll(".avatar").forEach(img => {
            img.src = dadosPerfilLogado.fotoPerfil;
        });
        const fotoPerfil = document.getElementById("fotoPerfil");
        if (fotoPerfil) fotoPerfil.src = dadosPerfilLogado.fotoPerfil;
    }
    document.querySelectorAll(".nomeUsuario").forEach(el => {
        el.textContent =
            dadosUsuarioLogado.nome_usuario ||
            dadosUsuarioLogado.nome ||
            dadosUsuarioLogado.nome_completo;
    });
    const ehPrefeitura = dadosUsuarioLogado.entidade_id === 2;
    const menuDesktop = document.querySelector(
        "header .collapse.navbar-collapse .navbar-nav"
    );
    if (menuDesktop) {
        menuDesktop.innerHTML = "";
        const opcoes = ehPrefeitura
            ? [
                { texto: "Início", href: "/" },
                { texto: "Denúncias", href: "/modulos/prefeitura/outras_denuncias/index.html" },
                { texto: "Minhas obras", href: "/modulos/prefeitura/perfil/index.html" }
              ]
            : [
                { texto: "Início", href: "/" },
                { texto: "Denúncias", href: "/modulos/empresas/outras_denuncias/index.html" },
                { texto: "Minhas obras", href: "/modulos/empresas/perfil/index.html" }
              ];

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

    // Links do menu mobile
    const menuMobile = document.getElementById("menuMobile");
    if (menuMobile) {
        menuMobile.querySelectorAll("a").forEach(el => el.remove());
        const opcoes = ehPrefeitura
            ? [
                { texto: "Início", href: "/" },
                { texto: "Denúncias", href: "/modulos/prefeitura/outras_denuncias/index.html" },
                { texto: "Minhas obras", href: "/modulos/prefeitura/perfil/index.html" }
              ]
            : [
                { texto: "Início", href: "/" },
                { texto: "Denúncias", href: "/modulos/empresas/outras_denuncias/index.html" },
                { texto: "Minhas obras", href: "/modulos/empresas/perfil/index.html" }
              ];

        opcoes.forEach(({ texto, href }) => {
            const a = document.createElement("a");
            a.className = "d-block text-light text-decoration-none py-2";
            a.href = href;
            a.textContent = texto;
            menuMobile.appendChild(a);
        });
    }
    const linkPerfil = ehPrefeitura
        ? "/modulos/prefeitura/perfil/index.html"
        : "/modulos/empresas/perfil/index.html";

    const foto = dadosPerfilLogado?.fotoPerfil || "";
    const nome = dadosUsuarioLogado.nome_usuario || dadosUsuarioLogado.nome_completo || "Usuário";

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
        const opcoesFooter = ehPrefeitura
            ? [
                { texto: "Início", href: "/", icone: "bi-house-fill" },
                { texto: "Denúncias", href: "/modulos/prefeitura/outras_denuncias/index.html", icone: "bi-megaphone-fill" },
                { texto: "Minhas obras", href: "/modulos/prefeitura/perfil/index.html", icone: "bi-buildings-fill" }
            ]
            : [
                { texto: "Início", href: "/", icone: "bi-house-fill" },
                { texto: "Denúncias", href: "/modulos/empresas/outras_denuncias/index.html", icone: "bi-megaphone-fill" },
                { texto: "Minhas obras", href: "/modulos/empresas/perfil/index.html", icone: "bi-buildings-fill" }
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

/**
 * GERAÇÃO DINÂMICA DAS AVALIAÇÕES DO SERVIDOR
 */
function renderizarAvaliacoesDinamicas(avaliacoes, moradores, perfisMoradores) {
    const container = document.getElementById("container-comentarios-dinamicos");
    const titulo = document.getElementById("titulo-container-avaliacoes");
    if (!container) return;

    if (!avaliacoes.length) {
        container.innerHTML = `<p class="text-muted text-center py-3">Nenhuma avaliação ainda.</p>`;
        if (titulo) titulo.innerText = "Avaliações ( 0 )";
        return;
    }

    if (titulo) titulo.innerText = `Avaliações ( ${avaliacoes.length} )`;
    container.innerHTML = "";

    avaliacoes.forEach(avaliacao => {
        const cpfAvaliador = String(avaliacao.avaliador).replace(/\D/g, '');

        const morador = moradores.find(m =>
            String(m.cpf).replace(/\D/g, '') === cpfAvaliador
        );

        const perfilMorador = perfisMoradores.find(p =>
            String(p.usuarioMorador_cpf).replace(/\D/g, '') === cpfAvaliador
        );

        const nome = morador?.nome_usuario || morador?.nome_completo || "Usuário";
        const foto = perfilMorador?.fotoPerfil || "";
        const nota = Number(avaliacao.nota) || 0;
        const estrelas = "★".repeat(nota) + "☆".repeat(5 - nota);

        const divBox = document.createElement("div");
        divBox.className = "d-flex align-items-start gap-3 item-comentario-zella p-3 rounded-3";

        divBox.innerHTML = `
            <img 
                src="${foto}" 
                class="rounded-circle avatar-comentario-zella" 
                alt="${nome}"
                onerror="this.onerror=null; this.src='';"
            >
            <div class="flex-grow-1">
                <div class="d-flex align-items-center justify-content-between mb-1">
                    <div class="d-flex align-items-center gap-2">
                        <strong class="text-dark small">${nome}</strong>
                        <span class="text-muted data-comentario-zella">${avaliacao.data || "Recentemente"}</span>
                    </div>
                    <span class="text-warning small" title="${nota} de 5 estrelas">${estrelas}</span>
                </div>
                <p class="text-secondary mb-0 texto-comentario-zella">${avaliacao.descricao || ""}</p>
            </div>
        `;

        container.appendChild(divBox);
    });
}

function renderizarMuralObras() {
    const mural = document.getElementById("container-denuncias");
    if (!mural) return;

    mural.innerHTML = "";

    const listaFiltrada = listaObrasGeral.filter(obra => {
        if (filtroAtual === "TODAS") return true;
        
        const statusItem = String(obra.status || '').toUpperCase();
        if (filtroAtual === "RESOLVIDAS") {
            return statusItem === "RESOLVIDAS" || statusItem === "RESOLVIDO" || statusItem === "REALIZADAS";
        }
        return statusItem === filtroAtual;
    });

    if (listaFiltrada.length === 0) {
        mural.innerHTML = `<div class="col-12 text-center text-muted py-4">Nenhuma obra encontrada para esse filtro.</div>`;
        return;
    }

    listaFiltrada.forEach(obra => {
        const tituloTexto = typeof obra.titulo === 'object' ? (obra.titulo.titulo || "Sem título") : (obra.titulo || "Sem título");
        const localTexto = typeof obra.local === 'object' ? (obra.local.nome || "Não informado") : (obra.local || "Não informado");
        
        const statusTexto = obra.status || "Pendente";
        const tempoTexto = obra.tempo || "Recente";
        const urgenciaTexto = obra.urgencia || "Média Urgência";
        const imagemUrl = obra.imagem || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=300";

        const statusLower = statusTexto.toLowerCase();
        let statusClass = "status-andamento";
        if (statusLower === "resolvido" || statusLower === "realizadas" || statusLower === "resolvidas") {
            statusClass = "status-resolvida";
        }

        let urgenciaClass = "badge-urgencia-media";
        const urgenciaLower = urgenciaTexto.toLowerCase();
        if (urgenciaLower.includes("alta")) urgenciaClass = "badge-urgencia-alta";
        if (urgenciaLower.includes("baixa")) urgenciaClass = "badge-urgencia-baixa";
        
        const cardCol = document.createElement("div");
        cardCol.className = "col";
        
        cardCol.innerHTML = `
            <div class="card card-denuncia-zella border-0 shadow-sm p-3 h-100">
                <div class="row g-3 h-100 align-items-center">
                    <div class="col-4 position-relative h-100 d-flex">
                        <img src="${imagemUrl}" class="img-fluid rounded-3 img-denuncia-cover-zella my-auto" alt="Capa">
                    </div>
                    <div class="col-8 d-flex flex-column justify-content-between h-100 py-1 ps-2">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2 gap-2">
                                <span class="badge-local-zella text-truncate">${localTexto}</span>
                                <span class="badge-status-zella ${statusClass} flex-shrink-0">${statusTexto}</span>
                            </div>
                            <h5 class="fw-bold text-dark card-title-zella mb-2 text-truncate-2">${tituloTexto}</h5>
                            <div class="d-flex gap-1 flex-wrap mb-2">
                                <span class="badge-meta-zella">${tempoTexto}</span>
                                <span class="badge-meta-zella ${urgenciaClass}">${urgenciaTexto}</span>
                            </div>
                        </div>
                        <div class="text-end mt-auto">
                            <a href="#" class="link-detalhes-zella fw-bold text-muted small text-decoration-none">Ver detalhes</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        mural.appendChild(cardCol);
    });
}

function configurarFiltrosAbas() {
    const botoesFiltro = document.querySelectorAll(".btn-filter-zella");
    botoesFiltro.forEach(btn => {
        btn.onclick = function() {
            botoesFiltro.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            filtroAtual = this.getAttribute("data-filtro") || this.innerText;
            renderizarMuralObras();
        };
    });
}

function configurarEfeitosInterface() {
    const containerFoto = document.getElementById("container-foto-click");
    const inputFoto = document.getElementById("input-foto-perfil");
    if (containerFoto && inputFoto) {
        containerFoto.onclick = () => inputFoto.click();
    }
}

function configurarEventosSalvar() {
    const inputFoto = document.getElementById("input-foto-perfil");
    const imgFotoPerfil = document.getElementById("fotoPerfil");
    const formPerfil = document.getElementById("form-perfil");
    const btnDeletar = document.getElementById("btn-deletar");

    if (btnDeletar) {
        btnDeletar.onclick = async function() {
            if (confirm("Deseja deletar permanentemente esta conta?")) {
                try {
                    await fetch(`${API_URL}/usuariosInstituicoes/${dadosUsuarioLogado.id}`, { method: "DELETE" });
                    await fetch(`${API_URL}/usuarioLogado`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({})
                    });
                    alert("Conta removida.");
                    window.location.href = "index.html";
                } catch (e) { alert("Erro ao excluir."); }
            }
        };
    }

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
                ...dadosUsuarioLogado,
                nome: document.getElementById("crud-nome").value.trim(),
                nome_usuario: document.getElementById("crud-nome").value.trim(),
                email: document.getElementById("crud-email").value.trim(),
                telefone: document.getElementById("crud-telefone").value.trim(),
                senha: document.getElementById("crud-senha").value
            };

            try {
                await fetch(`${API_URL}/usuariosInstituicoes/${dadosUsuarioLogado.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(atualizados)
                });

                if (novaFotoBase64 && dadosPerfilLogado) {
                    await fetch(`${API_URL}/infoPerfilInstituicoes/${dadosPerfilLogado.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fotoPerfil: novaFotoBase64 })
                    });
                }
                alert("Dados salvos com sucesso!");
                carregarDadosInstituicao();
            } catch (err) { alert("Erro ao atualizar."); }
        };
    }
}

function gerarObrasDemonstracao() {
    return [
        {
            titulo: "Falta de canalização e coleta",
            local: "Contagem",
            status: "RESOLVIIDAS",
            tempo: "HÁ 2 HORAS",
            urgencia: "BAIXA URGÊNCIA",
            imagem: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=300"
        }
    ];
}

document.addEventListener("DOMContentLoaded", carregarDadosInstituicao);