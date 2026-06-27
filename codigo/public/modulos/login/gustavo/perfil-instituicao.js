/**
 * Zella - Sistema Operacional do Perfil Remoto (Unificado)
 */
const API_URL = "http://localhost:3000";

let dadosUsuarioLogado = null;
let dadosPerfilLogado = null;
let novaFotoBase64 = null;
let filtroAtual = "TODAS";
let listaObrasGeral = [];
let listaStatus = [];
let listaUrgencias = [];

// 1. CARGA DINÂMICA DOS DADOS DA ENTIDADE LOGADA
async function carregarDadosInstituicao() {
    try {
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
            console.warn("Nenhum registro de identificador ativo em /usuarioLogado");
            return;
        }

        // CORREÇÃO CRÍTICA: Varre de forma abrangente para achar novos cadastros de prefeituras ou empresas
        const usuario = resInstituicoes?.find(u => {
            const dbCpf = String(u.cpf || '').replace(/\D/g, '');
            const dbCnpj = String(u.cnpj || '').replace(/\D/g, '');
            const dbCpfResp = String(u.cpfResponsavel || '').replace(/\D/g, '');
            const loginLimpo = String(cpfLogado).replace(/\D/g, '');
            
            return (dbCpf === loginLimpo) || (dbCnpj === loginLimpo) || (dbCpfResp === loginLimpo);
        });

        if (!usuario) {
            const campoNome = document.getElementById("nome_usuario");
            if (campoNome) campoNome.innerText = "Conta não vinculada";
            return;
        }

        dadosUsuarioLogado = usuario;
        dadosPerfilLogado = usuario;

        // Associa denúncias destinadas à instituição logada
        listaObrasGeral = resDenuncias.filter(d => d.entidade_id === usuario.instituicao_id || d.usuarioInstituicao_cpf === cpfLogado);

        preencherHTMLFixo();
        renderizarAvaliacoesDinamicas(usuario.avaliacoes || []);
        renderizarMuralObras();
        configurarFiltrosAbas();
        configurarEfeitosInterface();
    } catch (e) { 
        console.error("Erro geral na carga do painel institucional:", e); 
    }
}

// 2. PREENCHIMENTO DOS CAMPOS FIXOS E SINCRONIZAÇÃO DE AVATARES
function preencherHTMLFixo() {
    if (dadosPerfilLogado?.fotoPerfil) {
        const urlFoto = dadosPerfilLogado.fotoPerfil;
        
        // Foto do Painel Central
        const imgPerfil = document.getElementById("fotoPerfil");
        if (imgPerfil) imgPerfil.src = urlFoto;
        
        // PADRONIZAÇÃO: Atualiza a foto de perfil do cabeçalho mapeada no seu CSS
        const imgHeader = document.querySelector('header a[data-tipo="perfil"] img') || document.querySelector('.foto-perfil');
        if (imgHeader) imgHeader.src = urlFoto;
    }
    
    const campoNomeUsuario = document.getElementById("nome_usuario");
    if (campoNomeUsuario) {
        campoNomeUsuario.innerText = dadosUsuarioLogado.nomeUsuario || dadosUsuarioLogado.nomeCompleto;
    }

    const txtTipo = document.getElementById("txt-tipo-instituicao");
    const titulo = document.getElementById("titulo-dados-perfil");

    if (dadosUsuarioLogado.instituicao_id === 2 || dadosUsuarioLogado.tipo === 'prefeitura') {
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

    // Alimenta formulário de modificações
    const campoCrudNome = document.getElementById("crud-nome");
    const campoCrudEmail = document.getElementById("crud-email");
    const campoCrudTelefone = document.getElementById("crud-telefone");
    const campoCrudSenha = document.getElementById("crud-senha");

    if(campoCrudNome) campoCrudNome.value = dadosUsuarioLogado.nomeCompleto || dadosUsuarioLogado.nomeUsuario || "";
    if(campoCrudEmail) campoCrudEmail.value = dadosUsuarioLogado.email || "";
    if(campoCrudTelefone) campoCrudTelefone.value = dadosUsuarioLogado.telefone || "";
    if(campoCrudSenha) campoCrudSenha.value = dadosUsuarioLogado.senha || "";

    configurarEventosSalvar();
}

// 3. RENDERIZAÇÃO DAS AVALIAÇÕES DO FORMULÁRIO DE SEGUIDORES
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

// 4. MURAL DE CARDS ALINHADOS E PADRONIZADOS COM O SEU CSS
function renderizarMuralObras() {
    const mural = document.getElementById("container-denuncias") || document.getElementById("lista-denuncias");
    if (!mural) return;

    mural.innerHTML = "";

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
        
        const objStatus = listaStatus.find(s => String(s.id) === String(obra.status_id));
        const statusTexto = objStatus ? objStatus.nome : "Pendente";
        const tempoTexto = obra.dataPublicacao || "Recente";
        
        const objUrgencia = listaUrgencias.find(u => String(u.id) === String(obra.urgencia_id));
        const urgenciaTexto = objUrgencia ? objUrgencia.nome : "Média Urgência";

        const imagemUrl = (obra.imagens && obra.imagens.length > 0 && obra.imagens[0] !== "") 
            ? obra.imagens[0] 
            : "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=300";

        // PADRONIZAÇÃO DE STATUS (.aberta, .andamento, .resolvida)
        let statusClass = "andamento"; 
        const idStatusVal = Number(obra.status_id);
        if (idStatusVal === 1 || idStatusVal === 4) {
            statusClass = "resolvida"; 
        } else if (idStatusVal === 3) {
            statusClass = "aberta";    
        }

        // PADRONIZAÇÃO DE URGÊNCIA (.urgencia-texto-baixa, .urgencia-texto-media, .urgencia-texto-alta)
        let urgenciaClass = "urgencia-texto-media";
        const idUrgenciaVal = Number(obra.urgencia_id);
        if (idUrgenciaVal === 3) urgenciaClass = "urgencia-texto-alta";
        if (idUrgenciaVal === 1) urgenciaClass = "urgencia-texto-baixa";
        
        const wrapperCard = document.createElement("div");
        wrapperCard.className = "col-12 mb-3";
        
        // Montagem estrutural seguindo fielmente as regras estruturais e classes do seu CSS
        wrapperCard.innerHTML = `
            <div class="card-denuncia">
                <div class="card-topo">
                    <img src="${imagemUrl}" alt="Capa">
                    <div class="card-info">
                        <p>${localTexto}</p>
                        <h3>${tituloTexto}</h3>
                        <p class="tempo-denuncia">${tempoTexto}</p>
                        <span class="urgencia-texto ${urgenciaClass}">${urgenciaTexto.toUpperCase()}</span>
                    </div>
                </div>
                <div class="card-rodape">
                    <div class="status ${statusClass}">${statusTexto}</div>
                    <div class="acoes-card">
                        <a href="detalhes-denuncia.html?id=${obra.id}" class="btn-detalhes">Ver detalhes</a>
                    </div>
                </div>
            </div>
        `;
        mural.appendChild(wrapperCard);
    });
}

// 5. INTERAÇÃO E FILTROS DE ABAS (.btn-filtro.ativo)
function configurarFiltrosAbas() {
    const botoesFiltro = document.querySelectorAll(".btn-filtro");
    botoesFiltro.forEach(btn => {
        btn.onclick = function() {
            botoesFiltro.forEach(b => b.classList.remove("ativo"));
            this.classList.add("ativo");
            
            filtroAtual = this.getAttribute("data-filtro") || "TODAS";
            renderizarMuralObras();
        };
    });
}

// 6. EVENTOS DE INTERFACE DE TRABALHO
function configurarEfeitosInterface() {
    const containerFoto = document.getElementById("container-foto-click");
    const inputFoto = document.getElementById("input-foto-perfil");
    if (containerFoto && inputFoto) {
        containerFoto.onclick = () => inputFoto.click();
    }
}

// 7. SUBSISTEMA DE ATUALIZAÇÃO E SALVAMENTO VIA API (PUT)
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
                    
                    // Altera em tempo real o avatar do menu superior
                    const imgHeader = document.querySelector('header a[data-tipo="perfil"] img') || document.querySelector('.foto-perfil');
                    if (imgHeader) imgHeader.src = novaFotoBase64;
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