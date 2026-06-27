/**
 * Zella - Lógica de Cadastro e Login
 * AJUSTADO: Rotas corrigidas para navegar de 'modulos/login/' para 'modulos/perfis/'
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

// Mapeamento dinâmico dos elementos do DOM
const campoIdEdicao = document.getElementById('idEdicao');
const campoNome = document.getElementById('nome');
const campoNomeExibicao = document.getElementById('nomeExibicao'); 
const campoEmail = document.getElementById('email');

let campoIdentificador = null;
if (tipoCadastro === 'morador') {
    campoIdentificador = document.getElementById('cpf');
} else {
    // Empresa e Prefeitura utilizam id="identificador" 
    campoIdentificador = document.getElementById('identificador');
}

const campoCpfResponsavel = document.getElementById('cpfResponsavel'); 
const campoSenhaPrincipal = document.getElementById('senha');
const campoConfirmarSenha = document.getElementById('confirmarSenha');
const formCadastro = document.getElementById('formCadastro');

// Retorna as rotas baseadas no tipo de cadastro
function obterConfiguracaoRotas() {
    return {
        morador: { endpoint: 'usuariosMoradores', campoId: 'cpf' },
        empresa: { endpoint: 'usuariosInstituicoes', campoId: 'cnpj' },
        prefeitura: { endpoint: 'usuariosInstituicoes', campoId: 'municipioAtuacao' }
    }[tipoCadastro];
}

// 1. CARREGA OS DADOS DO JSON SERVER
async function carregarBanco() {
    try {
        const config = obterConfiguracaoRotas();
        const resposta = await fetch(`${API_URL}/${config.endpoint}`);
        if (!resposta.ok) throw new Error("Não foi possível conectar ao JSON Server.");
        db = { [config.endpoint]: await resposta.json() };
    } catch (erro) {
        console.error("Erro ao conectar com o JSON Server:", erro);
    }
}

// Limpa pontuações para salvar e comparar apenas números (quando necessário)
function normalizarId(id, apenasNumeros = true) {
    if (!id) return '';
    if (apenasNumeros) {
        const limpo = String(id).replace(/\D/g, '');
        return limpo ? String(limpo) : String(id).trim();
    }
    return String(id).trim();
}

// CORREÇÃO: Caminhos ajustados baseados na árvore de diretórios.
// Partindo de 'modulos/login/login.html', voltamos um nível com '../' e entramos em 'perfis/'
function redirecionarParaPerfil() {
    if (tipoCadastro === 'morador') {
        window.location.href = '../perfis/perfil-usuario.html';
    } else if (tipoCadastro === 'prefeitura') {
        window.location.href = '../perfis/perfil-instituicao.html';
    } else if (tipoCadastro === 'empresa') {
        window.location.href = '../perfis/perfilEmpresa.html';
    }
}

// 2. CADASTRAR VIA API
if (formCadastro) {
    formCadastro.addEventListener('submit', async function(event) {
        event.preventDefault();

        const config = obterConfiguracaoRotas();
        const nome = campoNome ? campoNome.value.trim() : '';
        const nomeExibicao = campoNomeExibicao ? campoNomeExibicao.value.trim() : '';
        const email = campoEmail ? campoEmail.value.trim() : '';
        
        // Se for prefeitura, mantém o nome da cidade. Se não, limpa os números do CPF/CNPJ
        const deveraLimparNumeros = (tipoCadastro !== 'prefeitura');
        const idDigitado = campoIdentificador ? normalizarId(campoIdentificador.value, deveraLimparNumeros) : '';
        
        const cpfResponsavelDigitado = campoCpfResponsavel ? normalizarId(campoCpfResponsavel.value, true) : '';
        const senha = campoSenhaPrincipal ? campoSenhaPrincipal.value : '';
        const confirmaSenha = campoConfirmarSenha ? campoConfirmarSenha.value : '';

        if (!nome || !idDigitado || !senha) {
            alert("Preencha todos os campos obrigatórios corretamente.");
            return;
        }

        if (senha !== confirmaSenha) {
            alert("As senhas digitadas não são iguais.");
            return;
        }

        // Verifica duplicidade no banco
        const usuarioExistente = db[config.endpoint]?.find(u => {
            const idItem = u[config.campoId] || u.cpf || u.cnpj || u.municipioAtuacao;
            return normalizarId(idItem, deveraLimparNumeros) === idDigitado;
        });

        if (usuarioExistente) {
            alert("Este identificador/documento já está cadastrado no sistema!");
            return;
        }

        // Monta o usuário base
        const novoUsuario = { 
            "id": Math.random().toString(36).substring(2, 13),
            "tipo": tipoCadastro, 
            "nomeUsuario": nomeExibicao,
            "nomeCompleto": nome,
            "email": email, 
            "senha": senha,
            "fotoPerfil": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
            [config.campoId]: idDigitado
        };

        // Regras específicas
        if (tipoCadastro === 'morador') {
            novoUsuario.cpf = idDigitado;
            novoUsuario.denunciasAcompanhadas = [];
            novoUsuario.estatisticas = { "atendidas": 0, "abertas": 0 };
        } else if (tipoCadastro === 'empresa') {
            novoUsuario.cnpj = idDigitado;
            novoUsuario.cpfResponsavel = cpfResponsavelDigitado;
            novoUsuario.instituicao_id = 1; 
            novoUsuario.avaliacoes = [];
            novoUsuario.estatisticas = { "atendidas": 0, "abertas": 0 };
        } else if (tipoCadastro === 'prefeitura') {
            novoUsuario.municipioAtuacao = idDigitado;
            novoUsuario.cnpj = "00000000000000"; 
            novoUsuario.cpfResponsavel = cpfResponsavelDigitado;
            novoUsuario.instituicao_id = 2; 
            novoUsuario.avaliacoes = [];
            novoUsuario.estatisticas = { "atendidas": 0, "abertas": 0 };
        }

        try {
            // Salva no banco via POST
            await fetch(`${API_URL}/${config.endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novoUsuario)
            });

            // Atualiza sessão injetando o CPF e o tipo correspondente
            const chaveSessaoLogado = (tipoCadastro === 'morador') ? idDigitado : cpfResponsavelDigitado;
            await fetch(`${API_URL}/usuarioLogado`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    "cpf": chaveSessaoLogado,
                    "tipo": tipoCadastro 
                })
            });

            localStorage.setItem('usuarioLogado', JSON.stringify(novoUsuario));
            localStorage.setItem('cpfLogado', chaveSessaoLogado);

            alert("Cadastro realizado com sucesso! Você já pode clicar em 'Entrar'.");
            await carregarBanco(); 

        } catch (erro) {
            console.error("Erro ao efetuar cadastro:", erro);
            alert("Não foi possível salvar os dados no servidor local.");
        }
    });
}

// 3. ENTRAR (LOGIN)
function configurarBotaoEntrar() {
    const btnEntrar = document.getElementById('entrarUsuario') || document.getElementById('entrar') || document.querySelector('.btn-entrar');

    if (btnEntrar) {
        btnEntrar.addEventListener('click', async function(event) {
            event.preventDefault();
            
            const config = obterConfiguracaoRotas();
            let valorParaLogin = '';

            // Lógica de qual campo o sistema deve olhar para fazer login
            if (tipoCadastro === 'morador') {
                valorParaLogin = campoIdentificador ? normalizarId(campoIdentificador.value, true) : '';
            } else if (tipoCadastro === 'empresa') {
                valorParaLogin = (campoIdentificador && campoIdentificador.value) ? normalizarId(campoIdentificador.value, true) : (campoCpfResponsavel ? normalizarId(campoCpfResponsavel.value, true) : '');
            } else if (tipoCadastro === 'prefeitura') {
                valorParaLogin = campoCpfResponsavel ? normalizarId(campoCpfResponsavel.value, true) : '';
            }

            if (!valorParaLogin) {
                let rotulo = (tipoCadastro === 'morador') ? 'CPF' : (tipoCadastro === 'prefeitura' ? 'CPF do Servidor' : 'CNPJ');
                alert(`Por favor, preencha o campo [${rotulo}] no formulário para entrar.`);
                return;
            }

            try {
                const resposta = await fetch(`${API_URL}/${config.endpoint}`);
                const listaUsuarios = await resposta.json();

                // Busca o usuário batendo a chave correta
                const usuarioEncontrado = listaUsuarios.find(u => {
                    const dbCpf = normalizarId(u.cpf, true);
                    const dbCnpj = normalizarId(u.cnpj, true);
                    const dbCpfResp = normalizarId(u.cpfResponsavel, true);
                    
                    return (dbCpf === valorParaLogin) || (dbCnpj === valorParaLogin) || (dbCpfResp === valorParaLogin);
                });

                if (usuarioEncontrado) {
                    const loginChaveFinal = usuarioEncontrado.cpf || usuarioEncontrado.cpfResponsavel || usuarioEncontrado.cnpj;

                    const tipoDetectado = usuarioEncontrado.tipo || (tipoCadastro === 'morador' ? 'morador' : (usuarioEncontrado.instituicao_id === 2 ? 'prefeitura' : 'empresa'));

                    await fetch(`${API_URL}/usuarioLogado`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            "cpf": loginChaveFinal,
                            "tipo": tipoDetectado
                        })
                    });

                    usuarioEncontrado.tipo = tipoDetectado;
                    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado));
                    localStorage.setItem('cpfLogado', loginChaveFinal);

                    redirecionarParaPerfil();
                    
                } else {
                    alert("Atenção: Credenciais informadas não constam registradas no sistema.");
                }
            } catch (erro) {
                console.error("Erro ao tentar logar:", erro);
                alert("Erro ao conectar com o servidor.");
            }
        });
    }
}

// Inicia o processo
carregarBanco().then(() => {
    configurarBotaoEntrar();
});