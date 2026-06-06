let db = {};
let tipoCadastro = 'morador';

const campoIdEdicao = document.getElementById('idEdicao');
const campoNome = document.getElementById('nome');
const campoNomeExibicao = document.getElementById('nomeExibicao'); 
const campoEmail = document.getElementById('email');
const campoIdentificador = document.getElementById('identificador') || document.getElementById('cpf');
const campoCpfResponsavel = document.getElementById('cpfResponsavel'); 
const camposSenha = document.querySelectorAll('input[type="password"]');
const formCadastro = document.getElementById('formCadastro');
const tituloFormulario = document.getElementById('tituloFormulario');
const containerLista = document.getElementById('listaContas');

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

// CORREÇÃO: Nomes das propriedades ajustados para bater perfeitamente com o seu db.json
function obterChaves() {
    const chaves = {
        morador: { storage: 'banco_moradores_local', json: 'usuariosMoradores', campoId: 'cpf', campoNome: 'nome_completo' },
        empresa: { storage: 'banco_empresas_local', json: 'usuariosInstituicoes', campoId: 'cnpj', campoNome: 'nome' },
        prefeitura: { storage: 'banco_prefeituras_local', json: 'usuariosInstituicoes', campoId: 'identificador', campoNome: 'nome' }
    };
    return chaves[tipoCadastro];
}

async function carregarBanco() {
    definirTipoCadastro();
    const chaves = obterChaves();
    
    try {
        const dadosLocais = localStorage.getItem(chaves.storage);
        
        if (dadosLocais) {
            db = JSON.parse(dadosLocais);
            console.log(`Dados de ${tipoCadastro} carregados localmente.`);
        } else {
            // CORREÇÃO: Apontando para db.json que armazena sua estrutura atual
            const resposta = await fetch('./db.json');
            db = await resposta.json();
            salvarDadosLocal();
            console.log("Banco de dados original pronto para consulta.");
        }
        
        renderizarLista();
    } catch (erro) {
        console.error("Erro ao carregar o JSON:", erro);
    }
}

function salvarDadosLocal() {
    const chaves = obterChaves();
    localStorage.setItem(chaves.storage, JSON.stringify(db));
}

// CORREÇÃO: Conversão para String pura ou Número puro para bater com a busca do JSON
function normalizarId(id) {
    if (!id) return '';
    const limpo = String(id).replace(/\D/g, '');
    return limpo ? Number(limpo) : String(id).trim();
}

function renderizarLista() {
    if (!containerLista) return;
    containerLista.innerHTML = '';
    const chaves = obterChaves();
    
    if (!db[chaves.json]) db[chaves.json] = [];

    // Filtro para separar Empresa e Prefeitura que compartilham a mesma lista de 'usuariosInstituicoes'
    let listaFiltrada = db[chaves.json];
    if (tipoCadastro === 'empresa') {
        listaFiltrada = listaFiltrada.filter(u => u.cnpj || u.instituicao_id === 1); 
    } else if (tipoCadastro === 'prefeitura') {
        listaFiltrada = listaFiltrada.filter(u => u.Município || u.instituicao_id === 2 || u.instituicao_id === 3);
    }

    listaFiltrada.forEach(usuario => {
        const idOriginal = usuario[chaves.campoId] || usuario.cpf || usuario.cnpj || usuario.identificador;
        const nomeVisual = usuario.nome_usuario || usuario[chaves.campoNome] || usuario.nome;
        
        const line = document.createElement('tr');
        line.innerHTML = `
            <td>${nomeVisual}</td>
            <td>${idOriginal}</td>
            <td>
                <button class="btn-acao-editar me-1" onclick="prepararEdicao('${idOriginal}')">Editar</button>
                <button class="btn-acao-excluir" onclick="deletarConta('${idOriginal}')">Excluir</button>
            </td>
        `;
        containerLista.appendChild(line);
    });
}

if (formCadastro) {
    formCadastro.addEventListener('submit', function(event) {
        event.preventDefault();

        const chaves = obterChaves();
        const nome = campoNome.value.trim();
        const nomeExibicao = campoNomeExibicao.value.trim();
        const email = campoEmail.value.trim();
        const idDigitado = normalizarId(campoIdentificador.value);
        const cpfResponsavelDigitado = campoCpfResponsavel ? Number(campoCpfResponsavel.value.replace(/\D/g, '')) : '';
        const senha = camposSenha[0].value;
        const confirmaSenha = camposSenha[1].value;

        if (!nome || !nomeExibicao || !idDigitado || !senha) {
            alert("Preencha todos os campos corretamente. Dados em branco não são permitidos.");
            return;
        }

        if (campoCpfResponsavel && !cpfResponsavelDigitado) {
            alert("O preenchimento do CPF de acesso é obrigatório.");
            return;
        }

        if (senha !== confirmaSenha) {
            alert("As senhas digitadas não são iguais.");
            return;
        }

        const idEmEdicao = campoIdEdicao.value;

        if (idEmEdicao) {
            const indice = db[chaves.json].findIndex(u => {
                const idItem = u[chaves.campoId] || u.cpf || u.cnpj || u.identificador;
                return normalizarId(idItem) === normalizarId(idEmEdicao);
            });

            if (indice !== -1) {
                db[chaves.json][indice] = { 
                    ...db[chaves.json][indice],
                    [chaves.campoNome]: nome,
                    "nome_usuario": nomeExibicao, // Ajustado para salvar o nome curto/exibição aqui
                    "nome_completo": nome,
                    email, 
                    [chaves.campoId]: idDigitado,
                    "cpf": tipoCadastro === 'morador' ? idDigitado : undefined,
                    "cpf_responsavel": cpfResponsavelDigitado,
                    senha 
                };
                salvarDadosLocal();
                renderizarLista();
                resetarFormulario();
                alert("Conta atualizada com sucesso!");
            }
        } else {
            const usuarioEncontrado = db[chaves.json].find(u => {
                const idItem = u[chaves.campoId] || u.cpf || u.cnpj || u.identificador;
                return normalizarId(idItem) === idDigitado;
            });

            if (usuarioEncontrado) {
                if (usuarioEncontrado.senha === senha) {
                    alert("Sucesso! Login realizado (simulação).");
                } else {
                    alert("Senha incorreta para as credenciais informadas.");
                }
            } else {
                // Criando IDs aleatórios no mesmo formato do seu db.json original
                const idGeradoAleatorio = Math.random().toString(36).substring(2, 13);

                const novoUsuario = { 
                    "id": idGeradoAleatorio,
                    [chaves.campoNome]: nome,
                    "nome_usuario": nomeExibicao,
                    "nome_completo": nome,
                    email, 
                    [chaves.campoId]: idDigitado,
                    "cpf": tipoCadastro === 'morador' ? idDigitado : undefined,
                    "cpf_responsavel": cpfResponsavelDigitado,
                    "senha": senha,
                    "denuncias_acompanhadas": tipoCadastro === 'morador' ? [] : undefined,
                    "instituicao_id": tipoCadastro === 'empresa' ? 1 : (tipoCadastro === 'prefeitura' ? 2 : undefined)
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

window.deletarConta = function(idParaDeletar) {
    const chaves = obterChaves();
    if (confirm("Tem certeza que deseja excluir esta conta?")) {
        db[chaves.json] = db[chaves.json].filter(u => {
            const idItem = u[chaves.campoId] || u.cpf || u.cnpj || u.identificador;
            return normalizarId(idItem) !== normalizarId(idParaDeletar);
        });
        salvarDadosLocal();
        renderizarLista();
        
        if (campoIdEdicao.value === String(idParaDeletar)) {
            resetarFormulario();
        }
    }
};

window.prepararEdicao = function(idParaEditar) {
    const chaves = obterChaves();
    const usuario = db[chaves.json].find(u => {
        const idItem = u[chaves.campoId] || u.cpf || u.cnpj || u.identificador;
        return normalizarId(idItem) === normalizarId(idParaEditar);
    });

    if (usuario) {
        campoIdEdicao.value = idParaEditar;
        campoNome.value = usuario[chaves.campoNome] || usuario.nome_completo || usuario.nome;
        campoNomeExibicao.value = usuario.nome_usuario || '';
        campoEmail.value = usuario.email || '';
        campoIdentificador.value = idParaEditar;
        if (campoCpfResponsavel) campoCpfResponsavel.value = usuario.cpf_responsavel || usuario.cpf || '';
        camposSenha[0].value = usuario.senha;
        camposSenha[1].value = usuario.senha;

        tituloFormulario.textContent = "Editar Informações da Conta";
        
        const btnSubmit = formCadastro.querySelector('button[type="submit"]') || formCadastro.querySelector('button');
        if (btnSubmit) btnSubmit.textContent = "Salvar Alterações";
    }
};

function resetarFormulario() {
    if (formCadastro) formCadastro.reset();
    if (campoIdEdicao) campoIdEdicao.value = '';
    if (tituloFormulario) tituloFormulario.textContent = "Crie sua conta";
    
    const btnSubmit = formCadastro ? (formCadastro.querySelector('button[type="submit"]') || formCadastro.querySelector('button')) : null;
    if (btnSubmit) btnSubmit.textContent = "Cadastrar";
}

window.restaurarPadrao = function() {
    const chaves = obterChaves();
    if (confirm("Deseja apagar as alterações desta página e voltar ao original?")) {
        localStorage.removeItem(chaves.storage);
        location.reload();
    }
};

carregarBanco();