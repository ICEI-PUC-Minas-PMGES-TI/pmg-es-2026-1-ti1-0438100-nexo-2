/**
 * Zella - Sistema Operacional do Perfil Remoto
 */
const API_URL = "http://localhost:3000";

let dadosUsuarioLogado = null;
let dadosPerfilLogado = null;
let novaFotoBase64 = null;
let filtroAtual = "TODAS";
let listaObrasGeral = [];
let listaStatus = [];
let listaUrgencias = [];

async function carregarDadosInstituicao() {
    try {
        // Adaptado para as rotas e tabelas existentes no seu JSON
        const [resLogado, resInstituicoes, resDenuncias, resStatus, resUrgencias] = await Promise.all([
            fetch(`${API_URL}/usuarioLogado`).then(r => r.json()),
            fetch(`${API_URL}/usuariosInstituicoes`).then(r => r.json()),
            fetch(`${API_URL}/denuncias`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/status`).then(r => r.json()).catch(() => []),
            fetch(`${API_URL}/urgencias`).then(r => r.json()).catch(() => [])
        ]);

        listaStatus = resStatus || [];
        listaUrgencias = resUrgencias || [];

        const cpfLogado = resLogado?.cpf;
        if (!cpfLogado) {
            console.warn("Nenhum registro de CPF ativo em /usuarioLogado");
            return;
        }

        // Busca o usuário comparando os CPFs limpos
        const usuario = resInstituicoes?.find(u => {
            const idItem = String(u.cpf || '').replace(/\D/g, '');
            const loginLimpo = String(cpfLogado).replace(/\D/g, '');
            return idItem === loginLimpo;
        });

        if (!usuario) {
            document.getElementById("nome_usuario").innerText = "Conta não vinculada";
            return;
        }

        dadosUsuarioLogado = usuario;
        dadosPerfilLogado = usuario; // No seu JSON as estatísticas e fotos já estão unificadas aqui

        // Filtra denúncias destinadas à entidade ou instituição logada
        listaObrasGeral = resDenuncias.filter(d => d.entidade_id === usuario.instituicao_id || d.usuarioInstituicao_cpf === cpfLogado);

        preencherHTMLFixo();
        
        // Puxa as avaliações diretamente de dentro do usuário no seu formato JSON
        renderizarAvaliacoesDinamicas(usuario.avaliacoes || []);
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
    
    document.getElementById("nome_usuario").innerText = dadosUsuarioLogado.nomeUsuario || dadosUsuarioLogado.nomeCompleto;

    const txtTipo = document.getElementById("txt-tipo-instituicao");
    const titulo = document.getElementById("titulo-dados-perfil");

    if (dadosUsuarioLogado.instituicao_id === 2) {
        if(txtTipo) txtTipo.innerText = "Prefeitura Oficial";
        if(titulo) titulo.innerText = "Dados Municipais";
    } else {
        if(txtTipo) txtTipo.innerText = "Parceiro Corporativo";
        if(titulo) titulo.innerText = "Dados da Empresa";
    }

    if (document.getElementById("stat-solucionadas")) {
        document.getElementById("stat-solucionadas").innerText = dadosPerfilLogado?.estatisticas?.atendidas || "0";
    }
    if (document.getElementById("stat-obras")) {
        document.getElementById("stat-obras").innerText = dadosPerfilLogado?.estatisticas?.abertas || "0";
    }

    document.getElementById("crud-nome").value = dadosUsuarioLogado.nomeCompleto || dadosUsuarioLogado.nomeUsuario || "";
    document.getElementById("crud-email").value = dadosUsuarioLogado.email || "";
    document.getElementById("crud-telefone").value = dadosUsuarioLogado.telefone || "";
    document.getElementById("crud-senha").value = dadosUsuarioLogado.senha || "";

    configurarEventosSalvar();
}

/**
 * GERAÇÃO DINÂMICA DAS AVALIAÇÕES DO SERVIDOR
 */
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
        divBox.className = "d-flex align-items-start gap-3 item-comentario-zella p-3 rounded-3 mb-2";
        
        divBox.innerHTML = `
            <img src="imgs/imgPerfil/perfil_joaopedro.png" class="rounded-circle avatar-comentario-zella" style="width:45px; height:45px; object-fit:cover;" alt="Avaliador">
            <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                    <strong class="text-dark small">CPF: ${comentario.avaliador_cpf}</strong>
                    <span class="text-muted data-comentario-zella">${comentario.data}</span>
                    <span class="badge bg-warning text-dark small">★ ${comentario.nota}</span>
                </div>
                <p class="text-secondary mb-0 texto-comentario-zella">${comentario.descricao || ""}</p>
            </div>
        `;
        container.appendChild(divBox);
    });
}

function renderizarMuralObras() {
    const mural = document.getElementById("container-denuncias");
    if (!mural) return;

    mural.innerHTML = "";

    // CORREÇÃO 1: Normalização de tipo (String) para garantir que filtros numéricos funcionem estritamente
    const listaFiltrada = listaObrasGeral.filter(obra => {
        if (filtroAtual === "TODAS") return true;
        return String(obra.status_id) === String(filtroAtual);
    });

    if (listaFiltrada.length === 0) {
        mural.innerHTML = `<div class="col-12 text-center text-muted py-4">Nenhuma obra encontrada para esse filtro.</div>`;
        return;
    }

    listaFiltrada.forEach(obra => {
        const tituloTexto = obra.titulo || "Sem título";
        const localTexto = obra.local?.logradouro || "Não informado";
        
        // CORREÇÃO 2: Normalização na busca do objeto de status
        const objStatus = listaStatus.find(s => String(s.id) === String(obra.status_id));
        const statusTexto = objStatus ? objStatus.nome : "Pendente";
        
        const tempoTexto = obra.dataPublicacao || "Recente";
        
        // CORREÇÃO 3: Normalização na busca do objeto de urgência
        const objUrgencia = listaUrgencias.find(u => String(u.id) === String(obra.urgencia_id));
        const urgenciaTexto = objUrgencia ? objUrgencia.nome : "Média Urgência";

        const imagemUrl = (obra.imagens && obra.imagens.length > 0 && obra.imagens[0] !== "") 
            ? obra.imagens[0] 
            : "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=300";

        // CORREÇÃO 4: Distribuição correta de classes visuais por ID numérico do status
        let statusClass = "status-andamento"; // Padrão: Em Andamento (ID 2)
        const idStatusVal = Number(obra.status_id);

        if (idStatusVal === 1 || idStatusVal === 4) {
            statusClass = "status-resolvida"; // Verde para Concluída / Resolvida
        } else if (idStatusVal === 3) {
            statusClass = "status-aberto";     // Laranja para Aberto / Novo
        }

        // CORREÇÃO 5: Tratamento numérico estável para as IDs de urgência
        let urgenciaClass = "badge-urgencia-media";
        const idUrgenciaVal = Number(obra.urgencia_id);
        if (idUrgenciaVal === 3) urgenciaClass = "badge-urgencia-alta";
        if (idUrgenciaVal === 1) urgenciaClass = "badge-urgencia-baixa";
        
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
                                <span class="badge badge-status-zella ${statusClass} flex-shrink-0">${statusTexto}</span>
                            </div>
                            <h5 class="fw-bold text-dark card-title-zella mb-2 text-truncate-2">${tituloTexto}</h5>
                            <div class="d-flex gap-1 flex-wrap mb-2">
                                <span class="badge-meta-zella">${tempoTexto}</span>
                                <span class="badge-meta-zella ${urgenciaClass}">${urgenciaTexto.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="text-end mt-auto">
                            <a href="detalhes-denuncia.html?id=${obra.id}" class="link-detalhes-zella fw-bold text-muted small text-decoration-none">Ver detalhes</a>
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
            
            // Pega o valor do atributo (Garante o ID correto vindo do HTML)
            filtroAtual = this.getAttribute("data-filtro") || "TODAS";
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
            if (confirm("Deseja deletar permanentemente esta conta institucional?")) {
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

                alert("Dados salvos com sucesso!");
                carregarDadosInstituicao();
            } catch (err) { alert("Erro ao atualizar."); }
        };
    }
}

document.addEventListener("DOMContentLoaded", carregarDadosInstituicao);