let db = {};
let tipoCadastro = 'morador';

const campoIdEdicao = document.getElementById('idEdicao');
const campoNome = document.getElementById('nome');
const campoEmail = document.getElementById('email');
const campoIdentificador = document.getElementById('cpf') || document.getElementById('identificador');
const camposSenha = document.querySelectorAll('input[type="password"]');
const btnCadastro = document.getElementById('cadastroUsuario');
const tituloFormulario = document.getElementById('tituloFormulario');
const containerLista = document.getElementById('listaContas');

// Descobrir qual página o usuário está acessando
function definirTipoCadastro() {
    const url = window.location.pathname;
    if (url.includes('cadastroEmpresa')) {
        tipoCadastro = 'empresa';
    } else if (url.includes('cadastroPrefeitura')) {
        tipoCadastro = 'prefeitura';
    } else {
        tipoCadastro = 'morador';
    }
}

// Pegar as chaves certas do banco para cada tipo de conta
function obterChaves() {
    const chaves = {
        morador: { storage: 'banco_moradores_local', json: 'usuarioMorador', campoId: 'cpf', campoNome: 'nome_completo' },
        empresa: { storage: 'banco_empresas_local', json: 'usuarioEmpresa', campoId: 'cnpj', campoNome: 'nome' },
        prefeitura: { storage: 'banco_prefeituras_local', json: 'usuarioPrefeitura', campoId: 'identificador', campoNome: 'nome' }
    };
    return chaves[tipoCadastro];
}

// Carregar os dados iniciais do sistema
async function carregarBanco() {
    definirTipoCadastro();
    const chaves = obterChaves();
    
    try {
        const dadosLocais = localStorage.getItem(chaves.storage);
        
        if (dadosLocais) {
            db = JSON.parse(dadosLocais);
            console.log(`Dados de ${tipoCadastro} carregados localmente.`);
        } else {
            const resposta = await fetch('./geral.json');
            db = await resposta.json();
            salvarDadosLocal();
            console.log("Banco de dados original pronto para consulta.");
        }
        
        renderizarLista();
    } catch (erro) {
        console.error("Erro ao carregar o JSON:", erro);
    }
}

// Salvar as alterações atuais no navegador
function salvarDadosLocal() {
    const chaves = obterChaves();
    localStorage.setItem(chaves.storage, JSON.stringify(db));
}

// Atualizar a tabela de contas na tela
function renderizarLista() {
    if (!containerLista) return;
    containerLista.innerHTML = '';
    const chaves = obterChaves();
    
    if (!db[chaves.json]) db[chaves.json] = [];

    db[chaves.json].forEach(usuario => {
        const idVisual = usuario[chaves.campoId] || usuario.cpf || usuario.cnpj || usuario.identificador;
        const nomeVisual = usuario[chaves.campoNome] || usuario.nome_usuario || usuario.nome;
        
        const line = document.createElement('tr');
        line.innerHTML = `
            <td>${nomeVisual}</td>
            <td>${idVisual}</td>
            <td>
                <button class="btn-acao-editar" onclick="prepararEdicao('${idVisual}')">Editar</button>
                <button class="btn-acao-excluir" onclick="deletarConta('${idVisual}')">Excluir</button>
            </td>
        `;
        containerLista.appendChild(line);
    });
}

// Processar o clique no botão de cadastrar ou salvar alterações
if (btnCadastro) {
    btnCadastro.addEventListener('click', function(event) {
        event.preventDefault();

        const chaves = obterChaves();
        const nome = campoNome.value.trim();
        const email = campoEmail.value.trim();
        const idDigitado = tipoCadastro === 'prefeitura' ? campoIdentificador.value.trim() : campoIdentificador.value.replace(/\D/g, '');
        const senha = camposSenha[0].value;
        const confirmaSenha = camposSenha[1].value;

        if (!nome || nome === "" || !idDigitado || idDigitado === "" || !senha || senha === "") {
            alert("Preencha todos os campos corretamente. Dados em branco não são permitidos.");
            return;
        }

        if (senha !== confirmaSenha) {
            alert("As senhas digitadas não são iguais.");
            return;
        }

        const idEmEdicao = campoIdEdicao.value;

        if (idEmEdicao) {
            const indice = db[chaves.json].findIndex(u => (u[chaves.campoId] || u.cpf || u.cnpj || u.identificador) == idEmEdicao);
            if (indice !== -1) {
                db[chaves.json][indice] = { 
                    [chaves.campoNome]: nome,
                    "nome_usuario": nome, 
                    email, 
                    [chaves.campoId]: idDigitado,
                    senha 
                };
                salvarDadosLocal();
                renderizarLista();
                resetarFormulario();
                alert("Conta atualizada com sucesso!");
            }
        } else {
            const moradorEncontrado = db[chaves.json].find(u => (u[chaves.campoId] || u.cpf || u.cnpj || u.identificador) == idDigitado);

            if (moradorEncontrado) {
                if (moradorEncontrado.senha === senha) {
                    alert("Sucesso! Login realizado (simulação).");
                } else {
                    alert("Senha incorreta para as credenciais informadas.");
                }
            } else {
                const novoUsuario = { 
                    [chaves.campoNome]: nome,
                    "nome_usuario": nome,
                    email, 
                    [chaves.campoId]: idDigitado, 
                    senha 
                };
                db[chaves.json].push(novoUsuario);
                salvarDadosLocal();
                renderizarLista();
                resetarFormulario();
                alert("Cadastro realizado com sucesso!");
            }
        }
    });
}

// Apagar uma conta do sistema
window.deletarConta = function(idParaDeletar) {
    const chaves = obterChaves();
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
        db[chaves.json] = db[chaves.json].filter(u => (u[chaves.campoId] || u.cpf || u.cnpj || u.identificador) != idParaDeletar);
        salvarDadosLocal();
        renderizarLista();
        
        if (campoIdEdicao.value === idParaDeletar) {
            resetarFormulario();
        }
    }
};

// Jogar as informações da tabela de voltar para o formulário
window.prepararEdicao = function(idParaEditar) {
    const chaves = obterChaves();
    const usuario = db[chaves.json].find(u => (u[chaves.campoId] || u.cpf || u.cnpj || u.identificador) == idParaEditar);

    if (usuario) {
        campoIdEdicao.value = idParaEditar;
        campoNome.value = usuario[chaves.campoNome] || usuario.nome_usuario || usuario.nome;
        campoEmail.value = usuario.email || '';
        campoIdentificador.value = idParaEditar;
        camposSenha[0].value = usuario.senha;
        camposSenha[1].value = usuario.senha;

        tituloFormulario.textContent = "Editar Informações da Conta";
        btnCadastro.textContent = "Salvar Alterações";
    }
};

// Limpar os campos do formulário para deixá-lo em branco
function resetarFormulario() {
    document.getElementById('formCadastro').reset();
    campoIdEdicao.value = '';
    tituloFormulario.textContent = "Crie sua conta";
    btnCadastro.textContent = "Cadastrar";
}

// Desfazer as modificações e voltar a tabela para o estado original
window.restaurarPadrao = function() {
    const chaves = obterChaves();
    if (confirm("Deseja apagar as alterações desta página e voltar ao original?")) {
        localStorage.removeItem(chaves.storage);
        location.reload();
    }
};

carregarBanco();