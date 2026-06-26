/**
 * Zella - Lógica de Cadastro Integrada com JSON Server (Ajustada para o Perfil Híbrido)
 */

const API_URL = "http://localhost:3000";
let db = {};
let tipoCadastro = 'morador';

// Identifica o tipo de cadastro pela URL atual
const urlAtual = window.location.pathname;
if (urlAtual.includes('cadastroEmpresa')) {
    tipoCadastro = 'empresa';
} else if (urlAtual.includes('cadastroPrefeitura')) {
    tipoCadastro = 'prefeitura';
} else {
    tipoCadastro = 'morador';
}

// Mapeamento dos elementos do DOM
const campoIdEdicao = document.getElementById('idEdicao');
const campoNome = document.getElementById('nome');
const campoNomeExibicao = document.getElementById('nomeExibicao'); 
const campoEmail = document.getElementById('email');

let campoIdentificador = null;
if (tipoCadastro === 'morador') {
    campoIdentificador = document.getElementById('cpf');
} else if (tipoCadastro === 'empresa') {
    campoIdentificador = document.getElementById('cnpj') || document.getElementById('identificador');
} else {
    campoIdentificador = document.getElementById('identificador');
}

const campoCpfResponsavel = document.getElementById('cpfResponsavel'); 
const campoSenhaPrincipal = document.getElementById('senha');
const campoConfirmarSenha = document.getElementById('confirmarSenha');
const formCadastro = document.getElementById('formCadastro');
const tituloFormulario = document.getElementById('tituloFormulario');
const containerLista = document.getElementById('listaContas');

// Retorna as configurações de rotas baseadas no tipo de cadastro (Mapeado com o novo JSON)
function obterConfiguracaoRotas() {
    return {
        morador: { 
            endpoint: 'usuariosMoradores', 
            campoId: 'cpf'
        },
        empresa: { 
            endpoint: 'usuariosInstituicoes', 
            campoId: 'cnpj'
        },
        prefeitura: { 
            endpoint: 'usuariosInstituicoes', 
            campoId: 'cnpj' // Tratado como documento identificador institucional
        }
    }[tipoCadastro];
}

// 1. CARREGA OS DADOS DO JSON SERVER
async function carregarBanco() {
    try {
        const config = obterConfiguracaoRotas();
        const resposta = await fetch(`${API_URL}/${config.endpoint}`);
        if (!resposta.ok) throw new Error("Não foi possível conectar ao JSON Server.");
        
        const dadosEndpoint = await resposta.json();
        
        db = {
            [config.endpoint]: dadosEndpoint
        };
        
        renderizarLista();
    } catch (erro) {
        console.error("Erro ao conectar com o JSON Server:", erro);
        alert("Erro ao carregar dados. Certifique-se de que o JSON Server está rodando na porta 3000!");
    }
}

function normalizarId(id) {
    if (!id) return '';
    const limpo = String(id).replace(/\D/g, '');
    return limpo ? String(limpo) : String(id).trim();
}

// 2. RENDERIZA A TABELA DE CONTAS CADASTRADAS (Lendo em tempo real da API)
function renderizarLista() {
    if (!containerLista) return;
    containerLista.innerHTML = '';
    const config = obterConfiguracaoRotas();
    
    let listaFiltrada = db[config.endpoint] || [];
    
    if (tipoCadastro === 'empresa') {
        listaFiltrada = listaFiltrada.filter(u => u.instituicao_id === 1); 
    } else if (tipoCadastro === 'prefeitura') {
        listaFiltrada = listaFiltrada.filter(u => u.instituicao_id === 2 || u.instituicao_id === 3);
    }

    listaFiltrada.forEach(usuario => {
        const idOriginal = usuario[config.campoId] || usuario.cpf || usuario.cnpj;
        const nomeVisual = usuario.nomeUsuario || usuario.nomeCompleto;
        
        const line = document.createElement('tr');
        line.innerHTML = `
            <td>${nomeVisual}</td>
            <td>${idOriginal}</td>
            <td>
                <button type="button" class="btn-acao-editar me-1" onclick="prepararEdicao('${usuario.id}')">Editar</button>
                <button type="button" class="btn-acao-excluir" onclick="deletarConta('${usuario.id}')">Excluir</button>
            </td>
        `;
        containerLista.appendChild(line);
    });
}

// 3. ENVIO DO FORMULÁRIO (CADASTRAR OU ATUALIZAR VIA API)
if (formCadastro) {
    formCadastro.addEventListener('submit', async function(event) {
        event.preventDefault();

        const config = obterConfiguracaoRotas();
        const nome = campoNome ? campoNome.value.trim() : '';
        const nomeExibicao = campoNomeExibicao ? campoNomeExibicao.value.trim() : '';
        const email = campoEmail ? campoEmail.value.trim() : '';
        const idDigitado = campoIdentificador ? normalizarId(campoIdentificador.value) : '';
        const cpfResponsavelDigitado = campoCpfResponsavel ? String(campoCpfResponsavel.value.replace(/\D/g, '')) : '';
        const senha = campoSenhaPrincipal ? campoSenhaPrincipal.value : '';
        const confirmaSenha = campoConfirmarSenha ? campoConfirmarSenha.value : '';

        if (!nome || !nomeExibicao || !idDigitado || !senha) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        if (senha !== confirmaSenha) {
            alert("As senhas digitadas não são iguais.");
            return;
        }

        const idEmEdicao = campoIdEdicao ? campoIdEdicao.value : '';

        // MODO EDIÇÃO (PATCH)
        if (idEmEdicao) {
            const dadosAtualizados = {
                nomeUsuario: nomeExibicao,
                nomeCompleto: nome,
                email, 
                [config.campoId]: idDigitado,
                senha 
            };

            try {
                await fetch(`${API_URL}/${config.endpoint}/${idEmEdicao}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dadosAtualizados)
                });
                
                alert("Conta atualizada com sucesso!");
                resetarFormulario();
                carregarBanco();
            } catch (erro) {
                console.error("Erro ao atualizar:", erro);
            }

        // MODO NOVO CADASTRO (POST)
        } else {
            // Verifica duplicidade
            const usuarioExistente = db[config.endpoint]?.find(u => {
                const idItem = u[config.campoId] || u.cpf || u.cnpj;
                return normalizarId(idItem) === idDigitado;
            });

            if (usuarioExistente) {
                alert("Este documento (CPF/CNPJ) já está cadastrado!");
                return;
            }

            // Cria o objeto unificado adaptado exatamente ao novo formato do seu banco
            const novoUsuario = { 
                "id": Math.random().toString(36).substring(2, 13),
                "nomeUsuario": nomeExibicao,
                "nomeCompleto": nome,
                "email": email, 
                "senha": senha,
                "fotoPerfil": "imgs/imgPerfil/default.png",
                [config.campoId]: idDigitado
            };

            // Regras de negócio adicionadas com base no tipo de conta mapeada no JSON
            if (tipoCadastro === 'morador') {
                novoUsuario.cpf = idDigitado;
                novoUsuario.denunciasAcompanhadas = [];
                novoUsuario.estatisticas = { "atendidas": 0, "abertas": 0 };
            } else {
                novoUsuario.cnpj = idDigitado;
                novoUsuario.cpfResponsavel = cpfResponsavelDigitado || "";
                novoUsuario.instituicao_id = tipoCadastro === 'empresa' ? 1 : 2;
                novoUsuario.avaliacoes = [];
                novoUsuario.estatisticas = { "atendidas": 0, "abertas": 0 };
            }

            try {
                // Envia para o banco de dados via POST
                await fetch(`${API_URL}/${config.endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(novoUsuario)
                });

                // Sincroniza a sessão do usuário logado
                await fetch(`${API_URL}/usuarioLogado`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ "cpf": idDigitado })
                });

                localStorage.setItem('usuarioLogado', JSON.stringify(novoUsuario));
                localStorage.setItem('cpfLogado', idDigitado);

                alert("Cadastro realizado com sucesso!");
                
                const documentoDigitadoAnteriormente = campoIdentificador ? campoIdentificador.value : '';
                resetarFormulario();
                
                if (campoIdentificador) {
                    campoIdentificador.value = documentoDigitadoAnteriormente;
                }

                if (tipoCadastro === 'morador') {
                    window.location.href = './perfil-usuario.html';
                } else {
                    window.location.href = './perfil-instituicao.html';
                }

            } catch (erro) {
                console.error("Erro ao efetuar cadastro no servidor:", erro);
                alert("Não foi possível salvar os dados no servidor local.");
            }
        }
    });
}

// 4. DELETAR CONTA DIRETAMENTE DO SERVIDOR (DELETE)
window.deletarConta = async function(idParaDeletar) {
    const config = obterConfiguracaoRotas();
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
        try {
            await fetch(`${API_URL}/${config.endpoint}/${idParaDeletar}`, {
                method: "DELETE"
            });
            alert("Conta removida com sucesso!");
            carregarBanco();
            if (campoIdEdicao && campoIdEdicao.value === String(idParaDeletar)) {
                resetarFormulario();
            }
        } catch (erro) {
            console.error("Erro ao deletar conta:", erro);
        }
    }
};

// 5. SELECIONAR CONTA PARA EDIÇÃO
window.prepararEdicao = function(idInternoJsonServer) {
    const config = obterConfiguracaoRotas();
    const usuario = db[config.endpoint]?.find(u => String(u.id) === String(idInternoJsonServer));

    if (usuario) {
        const idOriginalDocumento = usuario[config.campoId] || usuario.cpf || usuario.cnpj;

        if (campoIdEdicao) campoIdEdicao.value = usuario.id; 
        if (campoNome) campoNome.value = usuario.nomeCompleto || '';
        if (campoNomeExibicao) campoNomeExibicao.value = usuario.nomeUsuario || '';
        if (campoEmail) campoEmail.value = usuario.email || '';
        if (campoIdentificador) campoIdentificador.value = idOriginalDocumento;
        if (campoCpfResponsavel) campoCpfResponsavel.value = usuario.cpfResponsavel || '';
        if (campoSenhaPrincipal) campoSenhaPrincipal.value = usuario.senha;
        if (campoConfirmarSenha) campoConfirmarSenha.value = usuario.senha;

        if (tituloFormulario) tituloFormulario.textContent = "Editar Informações da Conta";
        
        if (formCadastro) {
            const btnSubmit = formCadastro.querySelector('button[type="submit"]') || formCadastro.querySelector('button');
            if (btnSubmit) btnSubmit.textContent = "Salvar Alterações";
        }
    }
};

function resetarFormulario() {
    if (formCadastro) formCadastro.reset();
    if (campoIdEdicao) campoIdEdicao.value = '';
    if (tituloFormulario) tituloFormulario.textContent = "Crie sua conta";
    
    const btnSubmit = formCadastro ? (formCadastro.querySelector('button[type="submit"]') || formCadastro.querySelector('button')) : null;
    if (btnSubmit) btnSubmit.textContent = "Cadastrar";
}

// 6. LOGAR COM ENTRAR
function configurarBotaoEntrar() {
    const btnEntrar = document.getElementById('entrarUsuario') || document.getElementById('entrar') || document.querySelector('.btn-entrar');

    if (btnEntrar) {
        btnEntrar.addEventListener('click', async function(event) {
            event.preventDefault();
            
            const idDigitado = campoIdentificador ? normalizarId(campoIdentificador.value) : '';
            const config = obterConfiguracaoRotas();

            if (!idDigitado) {
                alert("Por favor, digite o documento de identificação ou CPF para entrar.");
                return;
            }

            try {
                const resposta = await fetch(`${API_URL}/${config.endpoint}`);
                const listaUsuarios = await resposta.json();

                const usuarioEncontrado = listaUsuarios.find(u => {
                    const idItem = normalizarId(u[config.campoId] || u.cpf || u.cnpj);
                    const cpfRespItem = normalizarId(u.cpfResponsavel);
                    return idItem === idDigitado || cpfRespItem === idDigitado;
                });

                if (usuarioEncontrado) {
                    const loginChaveFinal = usuarioEncontrado[config.campoId] || usuarioEncontrado.cpf || idDigitado;

                    await fetch(`${API_URL}/usuarioLogado`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ "cpf": loginChaveFinal })
                    });

                    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado));
                    localStorage.setItem('cpfLogado', loginChaveFinal);
                } else {
                    alert("Atenção: Usuário não cadastrado no sistema.");
                    return;
                }

                if (tipoCadastro === 'morador') {
                    window.location.href = './perfil-usuario.html';
                } else {
                    window.location.href = './perfil-instituicao.html';
                }
            } catch (erro) {
                console.error("Erro ao tentar logar:", erro);
                alert("Erro ao conectar com o servidor.");
            }
        });
    }
}

// Inicializa buscando do Servidor de Banco
carregarBanco().then(() => {
    configurarBotaoEntrar();
});