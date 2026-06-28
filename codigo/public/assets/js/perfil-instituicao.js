/**
 * Zella - Sistema Operacional do Perfil Remoto
 * CORREÇÃO: Filtro blindado lendo o texto visível do botão, validação universal de status
 * e ajuste de rotas relativas baseado na árvore de diretórios do projeto Zella.
 */
const API_URL = "http://localhost:3000";

let dadosUsuarioLogado = null;
let dadosPerfilLogado = null;
let novaFotoBase64 = null;
let filtroAtual = "TODAS";
let listaObrasGeral = [];
let listaUrgencias = [];

// Função universal para analisar o JSON independente de qual propriedade ele use para o status
function determinarStatusObra(obra) {
    const id = Number(obra.status_id);
    const strStatus = String(obra.status || "").toUpperCase();
    
    // Status 1 ou 4 = Realizada / Concluída
    if (id === 1 || id === 4 || obra.concluida === true || strStatus.includes("REALIZAD") || strStatus.includes("CONCLU")) {
        return "REALIZADA";
    }
    // Status 3 = Em aberto
    if (id === 3 || strStatus.includes("ABERT")) {
        return "ABERTA";
    }
    // Status 2 ou qualquer outro valor cai como Em andamento
    return "ANDAMENTO";
}

async function carregarDadosInstituicao() {
    try {
        const [resLogado, resInstituicoes, resDenuncias, resUrgencias] = await Promise.all([
            fetch(`${API_URL}/usuarioLogado`).then(r => r.json()).catch(() => null),
            fetch(`${API_URL}/usuariosInstituicoes`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/denuncias`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/urgencias`).then(r => r.json()).catch(() => [])
        ]);

        listaUrgencias = resUrgencias || [];

        const logadoEfetivo = resLogado || {};
        const cpfLogado = logadoEfetivo.cpf || logadoEfetivo.usuario_cpf || "";
        const emailLogado = logadoEfetivo.email || "";
        const idLogado = logadoEfetivo.id || "";

        let usuario = resInstituicoes?.find(u => {
            const loginLimpo = String(cpfLogado).replace(/\D/g, '');
            const idItem = String(u.cpf || u.usuario_cpf || '').replace(/\D/g, '');
            
            if (loginLimpo && idItem && loginLimpo === idItem) return true;
            if (emailLogado && u.email && String(emailLogado).toLowerCase() === String(u.email).toLowerCase()) return true;
            if (idLogado && u.id && String(idLogado) === String(u.id)) return true;
            return false;
        });

        if (!usuario) {
            console.warn("Perfil não localizado. Carregando padrão.");
            usuario = {
                id: 1,
                nomeCompleto: "Ricardo Alves",
                nomeUsuario: "Ricardo Alves",
                email: "contato.nexocorporate@gmail.com",
                telefone: "(31) 3333-4444",
                senha: "123456",
                fotoPerfil: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256",
                instituicao_id: 2, 
                estatisticas: { atendidas: 67, abertas: 3, atualizacoes: 15 },
                avaliacoes: [
                    { id: 1, autor: "Luiza", data: "2026-06-05", nota: 5, descricao: "Ótimo trabalho!" }
                ]
            };
        }

        dadosUsuarioLogado = usuario;
        dadosPerfilLogado = usuario;

        listaObrasGeral = resDenuncias.filter(d => {
            return (d.entidade_id && String(d.entidade_id) === String(usuario.instituicao_id)) ||
                   (d.instituicao_id && String(d.instituicao_id) === String(usuario.instituicao_id));
        });

        if (listaObrasGeral.length === 0) {
            listaObrasGeral = resDenuncias || [];
        }

        preencherHTMLFixo();
        renderizarAvaliacoesDinamicas(usuario.avaliacoes || []);
        renderizarMuralObras();
        configurarFiltrosAbas();
        configurarEfeitosInterface();

    } catch (e) { 
        console.error("Erro geral na carga:", e); 
        removerGiroCarregamento();
    }
}

function removerGiroCarregamento() {
    const mural = document.getElementById("container-denuncias");
    if (mural) mural.innerHTML = `<div class="col-12 text-center text-muted py-4 small">Nenhuma obra carregada.</div>`;
}

function preencherHTMLFixo() {
    const imgPerfil = document.getElementById("fotoPerfil");
    if (imgPerfil && dadosPerfilLogado?.fotoPerfil) imgPerfil.src = dadosPerfilLogado.fotoPerfil;
    
    const elNome = document.getElementById("nome_usuario");
    if (elNome) elNome.innerText = dadosUsuarioLogado.nomeUsuario || dadosUsuarioLogado.nomeCompleto;

    const txtTipo = document.getElementById("txt-tipo-instituicao");
    const titulo = document.getElementById("titulo-dados-perfil");

    if (String(dadosUsuarioLogado.instituicao_id) === "2") {
        if(txtTipo) txtTipo.innerText = "Nome da empresa: Megasfalt";
        if(titulo) titulo.innerText = "Dados Cadastrais";
    } else {
        if(txtTipo) txtTipo.innerText = "Cidadão Ativo";
        if(titulo) titulo.innerText = "Os Meus Dados Cadastrais";
    }

    const txtSolucionadas = document.getElementById("stat-solucionadas");
    if (txtSolucionadas) txtSolucionadas.innerText = dadosPerfilLogado?.estatisticas?.atendidas || "0";
    
    const txtObras = document.getElementById("stat-obras");
    if (txtObras) txtObras.innerText = dadosPerfilLogado?.estatisticas?.abertas || "0";

    const inputNome = document.getElementById("crud-nome");
    const inputEmail = document.getElementById("crud-email");
    const inputTelefone = document.getElementById("crud-telefone");
    const inputSenha = document.getElementById("crud-senha");

    if (inputNome) inputNome.value = dadosUsuarioLogado.nomeCompleto || dadosUsuarioLogado.nomeUsuario || "";
    if (inputEmail) inputEmail.value = dadosUsuarioLogado.email || "";
    if (inputTelefone) inputTelefone.value = dadosUsuarioLogado.telefone || "";
    if (inputSenha) inputSenha.value = dadosUsuarioLogado.senha || "";

    configurarEventosSalvar();
}

function renderizarAvaliacoesDinamicas(avaliacoes) {
    const container = document.getElementById("container-comentarios-dinamicos");
    const titulo = document.getElementById("titulo-container-avaliacoes");
    if (!container) return;

    if (titulo) titulo.innerText = `Avaliações ( ${avaliacoes.length} )`;
    container.innerHTML = "";

    if (avaliacoes.length === 0) {
        container.innerHTML = `<p class="text-muted small ps-2 py-2">Nenhuma avaliação recebida ainda.</p>`;
        return;
    }

    avaliacoes.forEach(comentario => {
        const divBox = document.createElement("div");
        divBox.className = "d-flex align-items-start gap-3 p-3 rounded-3 mb-2 item-comentario-zella";
        divBox.innerHTML = `
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100" class="rounded-circle avatar-comentario-zella" alt="Avaliador">
            <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                    <strong class="text-dark small">${comentario.autor || 'Usuário'}</strong>
                    <span class="data-comentario-zella">${comentario.data}</span>
                    <span class="badge text-dark small" style="background-color: rgba(255, 193, 7, 0.2);">★ ${comentario.nota}</span>
                </div>
                <p class="texto-comentario-zella mb-0">${comentario.descricao || ""}</p>
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

        const statusReal = determinarStatusObra(obra);

        if (filtroAtual === "REALIZADAS") return statusReal === "REALIZADA";
        if (filtroAtual === "ANDAMENTO") return statusReal === "ANDAMENTO";
        if (filtroAtual === "ABERTAS") return statusReal === "ABERTA";

        return true;
    });

    if (listaFiltrada.length === 0) {
        mural.innerHTML = `<div class="col-12 text-center text-muted py-4 small">Nenhuma obra encontrada para esse filtro.</div>`;
        return;
    }

    listaFiltrada.forEach(obra => {
        const tituloTexto = obra.titulo || "Sem título";
        const localTexto = obra.local?.logradouro || "Não informado";
        const tempoTexto = obra.dataPublicacao || "Recente";
        
        const objUrgencia = listaUrgencias.find(u => String(u.id) === String(obra.urgencia_id));
        const urgenciaTexto = objUrgencia ? objUrgencia.nome : "Média Urgência";

        const imagemUrl = (obra.imagens && obra.imagens.length > 0 && obra.imagens[0] !== "") 
            ? obra.imagens[0] 
            : "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=300";

        // Estilização vinculada estritamente à função universal de status
        const statusReal = determinarStatusObra(obra);
        let classeStatus = "";
        let statusTexto = "";

        if (statusReal === "REALIZADA") {
            classeStatus = "status-resolvida";
            statusTexto = "REALIZADA";
        } else if (statusReal === "ABERTA") {
            classeStatus = "status-aberta"; 
            statusTexto = "EM ABERTO";
        } else {
            classeStatus = "status-andamento";
            statusTexto = "EM ANDAMENTO";
        }

        let classeUrgencia = "badge-urgencia-media";
        const idUrgenciaVal = Number(obra.urgencia_id);
        if (idUrgenciaVal === 3 || idUrgenciaVal === 1) classeUrgencia = "badge-urgencia-alta";
        if (idUrgenciaVal === 2) classeUrgencia = "badge-urgencia-baixa";
        
        const cardCol = document.createElement("div");
        cardCol.className = "col-12 col-lg-6 mb-3"; 
        
        // AJUSTADO: Alinhamento de rota de detalhes. 
        // Subindo de modulos/perfis/ para modulos/ e entrando na pasta detalhes/
        const linkDetalhes = `../detalhes/detalhes.html?id=${obra.id}`;

        cardCol.innerHTML = `
            <div class="card p-3 h-100 card-denuncia-zella shadow-sm">
                <div class="row g-3 align-items-center h-100">
                    <div class="col-4 h-100">
                        <img src="${imagemUrl}" class="img-fluid img-denuncia-cover-zella" alt="Capa">
                    </div>
                    <div class="col-8 d-flex flex-column justify-content-between ps-2">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-1 gap-2">
                                <span class="text-muted text-truncate badge-local-zella"><i class="bi bi-geo-alt-fill me-1"></i>${localTexto}</span>
                                <span class="badge badge-status-zella flex-shrink-0 ${classeStatus}">${statusTexto}</span>
                            </div>
                            <h5 class="fw-bold text-dark mb-1 text-truncate card-title-zella" title="${tituloTexto}">${tituloTexto}</h5>
                            <div class="d-flex gap-1 flex-wrap mb-2">
                                <span class="badge text-muted badge-meta-zella"><i class="bi bi-clock me-1"></i>${tempoTexto}</span>
                                <span class="badge text-secondary badge-meta-zella ${classeUrgencia}">${urgenciaTexto.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="text-end mt-1">
                            <a href="${linkDetalhes}" class="text-decoration-none fw-semibold link-detalhes-zella alignment-right">
                                Ver detalhes <i class="bi bi-arrow-right short ms-1"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        mural.appendChild(cardCol);
    });
}

function configurarFiltrosAbas() {
    // Alvo apenas para botões reais que possuem atributo data-filtro ou classe de filtragem específica
    const botoesFiltro = document.querySelectorAll(".btn-filter-zella, .filter-btn, [data-filtro]");
    
    botoesFiltro.forEach(btn => {
        const textoBotao = String(btn.innerText || btn.textContent).toUpperCase().trim();
        
        // Blindagem extra: impede que botões de ação estrutural entrem na re-estilização automática de abas
        if (btn.id === "btn-salvar" || btn.id === "btn-nova-denuncia" || btn.type === "submit") {
            return; 
        }

        btn.className = "btn-filter-zella filter-btn"; 
        
        btn.onclick = function() {
            botoesFiltro.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            
            const textoClique = String(this.innerText || this.textContent).toUpperCase().trim();

            if (textoClique.includes("TODAS")) {
                filtroAtual = "TODAS";
            } else if (textoClique.includes("REALIZ") || textoClique.includes("CONCLU")) {
                filtroAtual = "REALIZADAS";
            } else if (textoClique.includes("ANDAMENTO")) {
                filtroAtual = "ANDAMENTO";
            } else if (textoClique.includes("ABERT")) {
                filtroAtual = "ABERTAS";
            }
            
            renderizarMuralObras();
        };
    });
}

function configurarEfeitosInterface() {
    const containerFoto = document.getElementById("container-foto-click") || document.querySelector(".container-avatar-click");
    const inputFoto = document.getElementById("input-foto-perfil");
    if (containerFoto && inputFoto) {
        containerFoto.style.cursor = "pointer";
        containerFoto.onclick = () => inputFoto.click();
    }
}

function configurarEventosSalvar() {
    const inputFoto = document.getElementById("input-foto-perfil");
    const imgFotoPerfil = document.getElementById("fotoPerfil");
    const formPerfil = document.getElementById("form-perfil") || document.querySelector("form");

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
            
            const elNome = document.getElementById("crud-nome");
            const elEmail = document.getElementById("crud-email");
            const elTelefone = document.getElementById("crud-telefone");
            const elSenha = document.getElementById("crud-senha");

            const atualizados = {
                ...dadosUsuarioLogado,
                nomeCompleto: elNome ? elNome.value.trim() : dadosUsuarioLogado.nomeCompleto,
                email: elEmail ? elEmail.value.trim() : dadosUsuarioLogado.email,
                telefone: elTelefone ? elTelefone.value.trim() : dadosUsuarioLogado.telefone,
                senha: elSenha ? elSenha.value : dadosUsuarioLogado.senha
            };

            if (novaFotoBase64) atualizados.fotoPerfil = novaFotoBase64;

            try {
                await fetch(`${API_URL}/usuariosInstituicoes/${dadosUsuarioLogado.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(atualizados)
                });
                alert("Dados salvos com sucesso!");
                carregarDadosInstituicao();
            } catch (err) { alert("Erro ao atualizar."); }
        };
    }
}

document.addEventListener("DOMContentLoaded", carregarDadosInstituicao);