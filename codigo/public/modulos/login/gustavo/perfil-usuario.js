const API_URL = "http://localhost:3000";

let dadosUsuarioLogado = null;
let dadosPerfilLogado = null;
let denunciasDoUsuario = [];
let listaStatus = [];
let listaUrgencias = [];
let novaFotoBase64 = null;
let filtroAtual = "todas"; 

async function carregarDadosPerfil() {
    try {
        // Carrega todas as dependências respeitando a estrutura do JSON fornecido
        const [resLogado, resMoradores, resDenuncias, resStatus, resUrgencias] = await Promise.all([
            fetch(`${API_URL}/usuarioLogado`).then(r => r.json()),
            fetch(`${API_URL}/usuariosMoradores`).then(r => r.json()),
            fetch(`${API_URL}/denuncias`).then(r => r.json()),
            fetch(`${API_URL}/status`).then(r => r.json()),
            fetch(`${API_URL}/urgencias`).then(r => r.json())
        ]);

        listaStatus = resStatus || [];
        listaUrgencias = resUrgencias || [];

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
        // Fallback: Usa dados de estatísticas internos do usuário morador do seu JSON
        dadosPerfilLogado = usuario;
        
        // Mapeamento correto de acordo com a chave do JSON: "denunciasAcompanhadas"
        const denunciasAcompanhadas = usuario.denunciasAcompanhadas || [];
        
        // Filtra denúncias vinculadas ao usuário logado
        denunciasDoUsuario = resDenuncias?.filter(d => 
            denunciasAcompanhadas.includes(Number(d.id)) || d.usuarioMorador_cpf === cpfLogado
        ) || [];

        const rootDinamico = document.getElementById("profile-root");
        if (rootDinamico) {
            renderizarLayoutDinamicoMorador(rootDinamico);
        }
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
    }
}

function renderizarLayoutDinamicoMorador(root) {
    root.innerHTML = "";

    const aside = document.createElement("aside");
    aside.className = "col-12 col-md-4 col-xl-3 text-center d-flex flex-column align-items-center";
    aside.innerHTML = `
        <div class="card card-perfil-zella border-0 shadow-sm px-4 pb-4 pt-5 position-relative w-100">
            <input type="file" id="input-foto-perfil" accept="image/*" style="display: none;">
            
            <div class="avatar-perfil-container position-absolute start-50 translate-middle-x" style="cursor: pointer;" title="Mudar foto">
                <img id="fotoPerfil" src="${dadosPerfilLogado?.fotoPerfil || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}" class="rounded-circle border border-4 border-white shadow" alt="Avatar">
            </div>
            
            <div class="card-body p-0 mt-5 pt-3">
                <h4 id="nome_usuario" class="fw-bold text-dark mb-4 text-center">${dadosUsuarioLogado.nomeUsuario || dadosUsuarioLogado.nomeCompleto}</h4>
                
                <ul class="list-unstyled text-start list-status-zella mb-4 ps-2">
                    <li class="mb-2 d-flex align-items-center">
                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                        <span>Cidadão Ativo</span>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                        <i class="bi bi-clipboard-check me-2"></i>
                        <span>Demandas atendidas:</span>
                        <strong class="text-dark ms-auto">${dadosPerfilLogado?.estatisticas?.atendidas || 0}</strong>
                    </li>
                    <li class="mb-2 d-flex align-items-center">
                        <i class="bi bi-clipboard-data me-2"></i>
                        <span>Demandas em aberto:</span>
                        <strong class="text-dark ms-auto">${dadosPerfilLogado?.estatisticas?.abertas || 0}</strong>
                    </li>
                </ul>
                
                <button type="button" id="btn-nova-denuncia" class="btn btn-nova-denuncia-zella w-100 fw-bold shadow-sm">
                    Nova denúncia +
                </button>
            </div>
        </div>
    `;

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
                        <input type="text" id="crud-nome" class="form-control" value="${dadosUsuarioLogado.nomeCompleto || ''}" required>
                    </div>
                    <div class="col-12 col-md-6">
                        <label class="form-label text-muted small fw-semibold">E-mail</label>
                        <input type="email" id="crud-email" class="form-control" value="${dadosUsuarioLogado.email || ''}" required>
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
                    <button type="button" data-filter="3" class="btn btn-filter-zella ${filtroAtual === '3' ? 'active' : ''}">ABERTAS</button>
                    <button type="button" data-filter="2" class="btn btn-filter-zella ${filtroAtual === '2' ? 'active' : ''}">EM ANDAMENTO</button>
                    <button type="button" data-filter="1" class="btn btn-filter-zella ${filtroAtual === '1' ? 'active' : ''}">REALIZADAS</button>
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
                ...dadosUsuarioLogado,
                nomeCompleto: document.getElementById("crud-nome").value.trim(),
                email: document.getElementById("crud-email").value.trim(),
                senha: document.getElementById("crud-senha").value
            };

            if (novaFotoBase64) {
                atualizados.fotoPerfil = novaFotoBase64;
            }

            try {
                await fetch(`${API_URL}/usuariosMoradores/${dadosUsuarioLogado.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(atualizados)
                });

                alert("Alterações salvas com sucesso!");
                carregarDadosPerfil();
            } catch (err) { alert("Erro ao salvar dados."); }
        };
    }
}

function renderizarCardsHistorico() {
    const container = document.getElementById("container-denuncias");
    if (!container) return;

    // CORREÇÃO AQUI: Convertendo ambos para String para evitar falha de comparação de Tipo (Número vs String)
    const denunciasFiltradas = denunciasDoUsuario.filter(item => {
        if (filtroAtual === "todas") return true;
        return String(item.status_id) === String(filtroAtual);
    });

    if (denunciasFiltradas.length === 0) {
        container.innerHTML = `<div class="col-12 py-3"><p class="text-muted small ps-2">Nenhuma ocorrência encontrada para este filtro.</p></div>`;
        return;
    }

    let html = "";
    denunciasFiltradas.forEach(item => {
        const capa = (item.imagens && item.imagens.length > 0 && item.imagens[0] !== "") 
            ? item.imagens[0] 
            : "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=400";

        // Tradução dinâmica de status_id para texto usando a lista auxiliar carregada
        const objStatus = listaStatus.find(s => String(s.id) === String(item.status_id));
        const statusStr = objStatus ? objStatus.nome : "Aberto";
        
        // CORREÇÃO AQUI: Mapeamento de cores baseado na ID numérica convertida em número estável
        let statusClass = "bg-secondary"; 
        const currentStatusId = Number(item.status_id);
        if (currentStatusId === 1 || currentStatusId === 4) {
            statusClass = "status-resolvida";
        } else if (currentStatusId === 2) {
            statusClass = "status-andamento";
        } else if (currentStatusId === 3) {
            statusClass = "status-aberto"; // Classe adicionada para os cards "Abertos" (Laranja)
        }

        // Tradução dinâmica de urgencia_id para texto
        const objUrgencia = listaUrgencias.find(u => String(u.id) === String(item.urgencia_id));
        const urgenciaStr = objUrgencia ? objUrgencia.nome : "Média";
        
        let urgenciaClass = "badge-urgencia-media";
        const currentUrgenciaId = Number(item.urgencia_id);
        if (currentUrgenciaId === 3) urgenciaClass = "badge-urgencia-alta";
        if (currentUrgenciaId === 1) urgenciaClass = "badge-urgencia-baixa";

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
                                
                                <h5 class="fw-bold text-dark mb-1 card-title-zella text-truncate-2" title="${item.titulo}">
                                    ${item.titulo}
                                </h5>
                                
                                <div class="d-flex gap-1 mb-2 flex-wrap">
                                    <span class="badge badge-meta-zella"><i class="bi bi-clock me-1"></i>${item.dataPublicacao || 'Sem data'}</span>
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