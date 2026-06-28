/**
 * Zella - Sistema Operacional do Perfil da Instituição / Empresa
 * PADRONIZADO: Endpoint corrigido, mapeamento de avaliações alinhado e remoção da tela de carregamento.
 */
const API_URL = "http://localhost:3000";

let dadosUsuarioLogado = null;
let dadosPerfilLogado = null;
let obrasDaInstituicao = [];
let listaStatus = [];
let novaFotoBase64 = null;
let filtroAtual = "TODAS"; 

async function carregarDadosPerfil() {
    try {
        // CORREÇÃO: Alterado de 'usuariosEmpresas' para 'usuariosInstituicoes' para corresponder ao banco
        const [resLogado, resInstituicoes, resDenuncias, resStatus] = await Promise.all([
            fetch(`${API_URL}/usuarioLogado`).then(r => r.json()).catch(() => ({})),
            fetch(`${API_URL}/usuariosInstituicoes`).then(r => r.json()).catch(() => []), 
            fetch(`${API_URL}/denuncias`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/status`).then(r => r.json()).catch(() => [])
        ]);

        listaStatus = resStatus || [];

        // Recupera o identificador único
        let emailLogado = resLogado?.email || localStorage.getItem("emailLogado");
        
        if (!emailLogado) {
            console.warn("Nenhuma instituição logada encontrada.");
            esconderSpinnerDeCarregamento();
            return;
        }

        // Procura a instituição correspondente
        const instituicao = resInstituicoes?.find(i => 
            (i.email && String(i.email).toLowerCase() === String(emailLogado).toLowerCase()) ||
            (i.emailInstitucional && String(i.emailInstitucional).toLowerCase() === String(emailLogado).toLowerCase())
        );
        
        if (!instituicao) {
            const localUser = localStorage.getItem("usuarioLogado");
            if (localUser) {
                dadosUsuarioLogado = JSON.parse(localUser);
                dadosPerfilLogado = dadosUsuarioLogado;
            } else {
                console.warn("Sessão inválida. Aplicando fallback de segurança.");
                dadosUsuarioLogado = resInstituicoes[0] || {
                    id: "A0thZ-vgQ7M",
                    nomeUsuario: "Fernanda Rocha",
                    nomeCompleto: "Fernanda Rocha Ladeira",
                    email: "fernandaprefcontagem@gmail.com",
                    instituicao_id: 2,
                    estatisticas: { atendidas: 67, abertas: 3, atualizacoes: 15 },
                    avaliacoes: []
                };
                dadosPerfilLogado = dadosUsuarioLogado;
            }
        } else {
            dadosUsuarioLogado = instituicao;
            dadosPerfilLogado = instituicao;
        }
        
        // CORREÇÃO: Filtro abrangente usando a propriedade de ID correta
        const instId = dadosUsuarioLogado.instituicao_id || dadosUsuarioLogado.id;
        obrasDaInstituicao = resDenuncias?.filter(d => 
            String(d.empresaResponsavel_id) === String(dadosUsuarioLogado.id) ||
            String(d.entidade_id) === String(instId) ||
            String(d.instituicao_id) === String(instId)
        ) || [];

        // Atualiza os dados estáticos diretamente no HTML
        atualizarComponentesInterface();
        
        // CORREÇÃO: Remove a interface de bloqueio/carregamento
        esconderSpinnerDeCarregamento();
        
    } catch (erro) {
        console.error("Erro fatal ao carregar dados da instituição:", erro);
        esconderSpinnerDeCarregamento();
    }
}

function esconderSpinnerDeCarregamento() {
    const spinnerTexto = Array.from(document.querySelectorAll('div, p, h3, span')).find(el => 
        el.textContent.includes("Carregando dados do perfil") || el.textContent.includes("Sincronizando")
    );
    if (spinnerTexto) {
        const containerPai = spinnerTexto.closest('.flex-column') || spinnerTexto.parentElement;
        if (containerPai && containerPai !== document.body) {
            containerPai.style.setProperty("display", "none", "important");
        } else {
            spinnerTexto.style.display = 'none';
        }
    }
}

function atualizarComponentesInterface() {
    const nomeUsuario = document.getElementById("nome_usuario");
    const fotoPerfil = document.getElementById("fotoPerfil");
    const txtTipoInstituicao = document.getElementById("txt-tipo-instituicao");
    const statSolucionadas = document.getElementById("stat-solucionadas");
    const statObras = document.getElementById("stat-obras");

    if (nomeUsuario) nomeUsuario.textContent = dadosUsuarioLogado.nomeUsuario || dadosUsuarioLogado.nomeCompleto || 'Órgão Responsável';
    if (fotoPerfil && dadosPerfilLogado.fotoPerfil) {
        fotoPerfil.src = dadosPerfilLogado.fotoPerfil;
    }
    if (txtTipoInstituicao) txtTipoInstituicao.textContent = dadosUsuarioLogado.tipoInstituicao || "Prestador de Serviço";
    
    const totalConcluidas = obrasDaInstituicao.filter(o => String(o.status_id) === "1" || String(o.status_id) === "4").length;
    const totalAndamento = obrasDaInstituicao.filter(o => String(o.status_id) === "2").length;

    if (statSolucionadas) statSolucionadas.textContent = totalConcluidas;
    if (statObras) statObras.textContent = totalAndamento;

    const inputNome = document.getElementById("crud-nome");
    const inputEmail = document.getElementById("crud-email");
    const inputTelefone = document.getElementById("crud-telefone");
    const inputSenha = document.getElementById("crud-senha");

    if (inputNome) inputNome.value = dadosUsuarioLogado.nomeCompleto || dadosUsuarioLogado.nomeUsuario || '';
    if (inputEmail) inputEmail.value = dadosUsuarioLogado.email || dadosUsuarioLogado.emailInstitucional || '';
    if (inputTelefone) inputTelefone.value = dadosUsuarioLogado.telefone || dadosUsuarioLogado.telefoneContato || '';
    if (inputSenha) inputSenha.value = dadosUsuarioLogado.senha || '';

    configurarEventosInteracao();
    configurarEventosFiltro();
    renderizarCardsObras();
    renderizarAvaliacoes();
}

function configurarEventosFiltro() {
    const botoes = document.querySelectorAll(".btn-filter-zella");
    botoes.forEach(botao => {
        botao.onclick = function() {
            botoes.forEach(b => {
                b.classList.remove("active", "btn-dark");
                b.classList.add("btn-outline-secondary");
            });
            this.classList.add("active", "btn-dark");
            this.classList.remove("btn-outline-secondary");

            filtroAtual = this.getAttribute("data-filtro") || String(this.innerText || this.textContent).toUpperCase().trim();
            if (filtroAtual.includes("TODAS")) filtroAtual = "TODAS";
            if (filtroAtual.includes("ABERT")) filtroAtual = "ABERTAS";
            if (filtroAtual.includes("ANDAMENTO")) filtroAtual = "EM ANDAMENTO";
            if (filtroAtual.includes("REALIZ") || filtroAtual.includes("CONCLU")) filtroAtual = "REALIZADAS";

            renderizarCardsObras();
        };
    });
}

function configurarEventosInteracao() {
    const clickAvatar = document.getElementById("container-foto-click");
    const inputFoto = document.getElementById("input-foto-perfil");
    const imgFotoPerfil = document.getElementById("fotoPerfil");
    const formPerfil = document.getElementById("form-perfil");
    const btnDeletar = document.getElementById("btn-deletar");

    if (btnDeletar) {
        btnDeletar.onclick = async function() {
            if (confirm("Deseja remover o cadastro desta instituição permanentemente?")) {
                try {
                    await fetch(`${API_URL}/usuariosInstituicoes/${dadosUsuarioLogado.id}`, { method: "DELETE" });
                    localStorage.clear();
                    window.location.href = "../login/login.html";
                } catch (e) { alert("Erro ao deletar conta institucional."); }
            }
        };
    }

    if (clickAvatar && inputFoto) clickAvatar.onclick = () => inputFoto.click();

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
                telefone: document.getElementById("crud-telefone").value.trim(),
                senha: document.getElementById("crud-senha").value
            };

            if (novaFotoBase64) {
                atualizados.fotoPerfil = novaFotoBase64;
            }

            try {
                await fetch(`${API_URL}/usuariosInstituicoes/${dadosUsuarioLogado.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(atualizados)
                });

                localStorage.setItem("usuarioLogado", JSON.stringify(atualizados));
                alert("Dados institucionais atualizados com sucesso!");
                carregarDadosPerfil();
            } catch (err) { alert("Erro ao salvar alterações."); }
        };
    }
}

function renderizarCardsObras() {
    const container = document.getElementById("container-denuncias");
    if (!container) return;

    const deParaStatus = { "TODAS": "todas", "ABERTAS": "3", "EM ANDAMENTO": "2", "REALIZADAS": "1" };
    const filtroId = deParaStatus[filtroAtual] || "todas";

    const obrasFiltradas = obrasDaInstituicao.filter(item => {
        if (filtroId === "todas") return true;
        return String(item.status_id) === String(filtroId);
    });

    if (obrasFiltradas.length === 0) {
        container.innerHTML = `<div class="col-12 py-3 w-100 text-center"><p class="text-muted small">Nenhuma obra sob sua responsabilidade neste filtro.</p></div>`;
        return;
    }

    let html = "";
    obrasFiltradas.forEach(item => {
        const capa = (item.imagens && item.imagens.length > 0 && item.imagens[0] !== "") 
            ? item.imagens[0] 
            : "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=400";

        const objStatus = listaStatus.find(s => String(s.id) === String(item.status_id));
        const statusStr = objStatus ? objStatus.nome : "Pendente";
        
        let badgeBg = "#6c757d";
        let badgeColor = "#ffffff";
        if (item.status_id == 3) { badgeBg = "rgba(220, 53, 69, 0.15)"; badgeColor = "#dc3545"; } 
        if (item.status_id == 2) { badgeBg = "rgba(255, 138, 0, 0.15)"; badgeColor = "#ff8a00"; } 
        if (item.status_id == 1 || item.status_id == 4) { badgeBg = "rgba(66, 197, 154, 0.15)"; badgeColor = "#42c59a"; }

        const linkDetalhes = `../detalhes/detalhes.html?id=${item.id}`;

        html += `
            <div class="col-12 col-lg-6 mb-3">
                <div class="card border-0 p-3 h-100 bg-white" style="border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div class="row g-3 align-items-center">
                        <div class="col-4">
                            <img src="${capa}" class="img-fluid rounded" style="height: 95px; width: 100%; object-fit: cover; border-radius: 12px !important;" alt="Obra">
                        </div>
                        <div class="col-8 d-flex flex-column justify-content-between">
                            <div>
                                <span class="badge mb-1" style="font-size: 0.7rem; background-color: ${badgeBg}; color: ${badgeColor}; padding: 4px 10px; border-radius: 12px;">${statusStr.toUpperCase()}</span>
                                <h6 class="fw-bold text-dark mb-1 text-truncate" style="font-size: 0.92rem;" title="${item.titulo || ''}">${item.titulo || 'Obra Pública'}</h6>
                                <small class="text-muted d-block mb-2" style="font-size: 0.78rem;"><i class="bi bi-clock me-1"></i>${item.dataPublicacao || 'Sem data'}</small>
                            </div>
                            <div class="text-end">
                                <a href="${linkDetalhes}" class="text-decoration-none fw-semibold" style="font-size: 0.78rem; color: #f28b0c;">
                                    Atualizar Status <i class="bi bi-arrow-right ms-1"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

function renderizarAvaliacoes() {
    const containerComentarios = document.getElementById("container-comentarios-dinamicos");
    const tituloAvaliacoes = document.getElementById("titulo-container-avaliacoes");
    
    if (!containerComentarios) return;

    // CORREÇÃO: Alinhado com a propriedade 'avaliacoes' padrão do db.json
    const avaliacoes = dadosUsuarioLogado.avaliacoes || [];
    if (tituloAvaliacoes) tituloAvaliacoes.textContent = `Avaliações (${avaliacoes.length})`;

    if (avaliacoes.length === 0) {
        containerComentarios.innerHTML = `<div class="text-muted small py-1">Nenhuma avaliação recebida até o momento.</div>`;
        return;
    }

    let html = "";
    avaliacoes.forEach(av => {
        const notaEstrelas = Number(av.nota || 5);
        html += `
            <div class="p-3 rounded-3 mb-2" style="background-color: #f8f9fa; border-left: 4px solid #f28b0c;">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="text-dark small">${av.autor || 'Cidadão'}</strong>
                    <span class="text-warning small">${'★'.repeat(notaEstrelas)}${'☆'.repeat(Math.max(0, 5 - notaEstrelas))}</span>
                </div>
                <p class="text-muted mb-0 small">${av.descricao || av.comentario || 'Sem comentário preenchido.'}</p>
            </div>`;
    });
    containerComentarios.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", carregarDadosPerfil);