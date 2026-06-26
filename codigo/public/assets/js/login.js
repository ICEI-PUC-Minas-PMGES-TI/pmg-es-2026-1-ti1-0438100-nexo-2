const API_BASE = 'http://localhost:3000';
const LOGIN_URL = "/modulos/login/login.html";
let RETURN_URL = "/index.html";

const API_MORADOR = `${API_BASE}/usuariosMoradores`;
const API_INSTITUICAO = `${API_BASE}/usuariosInstituicoes`;
const API_INSTITUICOES_LISTA = `${API_BASE}/instituicoes`;
const API_USUARIO_LOGADO = `${API_BASE}/usuarioLogado`;

// ============= DADOS GLOBAIS =============
var dbMoradores = [];
var dbInstituicoes = [];
var dbInstituicoesLista = [];
var usuarioCorrente = {};



function displayMessage(msg, tipo = 'info') {
    const div = document.getElementById('mensagem');
    if (!div) return;

    div.classList.remove('alert-success', 'alert-danger', 'alert-warning', 'alert-info', 'd-none');

    const classes = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    };
    div.classList.add('alert', classes[tipo] || 'alert-info');

    div.textContent = msg;

    clearTimeout(div._timeout);
    div._timeout = setTimeout(() => {
        div.classList.add('d-none');
    }, 5000);
}

function limparIdentificador(valor) {
    if (typeof valor === 'string') {
        return valor.replace(/[^\d]/g, '');
    }
    return String(valor);
}

function criarUsuarioCorrente(usuario, tipo) {
    return {
        id: usuario.id,
        nome: usuario.nome_usuario || usuario.nome_completo || '',
        nomeCompleto: usuario.nome_completo || '',
        email: usuario.email || '',
        cpf: usuario.cpf || '',
        instituicao_id: usuario.instituicao_id || null,
        tipo: tipo,
        ...usuario
    };
}

function carregarTodosDados(callback) {
    Promise.all([
        fetch(API_MORADOR).then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
            return res.json();
        }).catch(() => []),
        fetch(API_INSTITUICAO).then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
            return res.json();
        }).catch(() => []),
        fetch(API_INSTITUICOES_LISTA).then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
            return res.json();
        }).catch(() => [])
    ])
    .then(([moradores, instituicoes, listaInst]) => {
        dbMoradores = moradores;
        dbInstituicoes = instituicoes;
        dbInstituicoesLista = listaInst;
        if (callback) callback();
        console.log('Dados carregados com sucesso.');
    })
    .catch(error => {
        console.error('Erro ao carregar dados via API JSONServer:', error);
        displayMessage("Erro ao carregar dados do servidor. Verifique se o JSON Server está rodando.", "error");
    });
}

async function salvarUsuarioLogado(cpf) {
    try {
        const res = await fetch(API_USUARIO_LOGADO, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf: cpf || '' })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    } catch (error) {
        console.error('Erro ao salvar usuário logado no servidor:', error);
    }
}

function loginUser(identificador, senha, versao) {
    const idNormalizado = limparIdentificador(identificador);

    switch (versao) {
        case 'pessoal':
            for (let usuario of dbMoradores) {
                if (usuario.cpf !== undefined) {
                    let cpfNormalizado = limparIdentificador(usuario.cpf);
                    if (cpfNormalizado === idNormalizado && usuario.senha === senha) {
                        usuarioCorrente = criarUsuarioCorrente(usuario, 'pessoal');
                        sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuarioCorrente));
                        salvarUsuarioLogado(usuarioCorrente.cpf);
                        return true;
                    }
                }
            }
            return false;

        case 'empresa':
            for (let usuario of dbInstituicoes) {
                if (usuario.cpf !== undefined) {
                    let cpfNormalizado = limparIdentificador(usuario.cpf);
                    if (cpfNormalizado === idNormalizado && usuario.senha === senha) {
                        usuarioCorrente = criarUsuarioCorrente(usuario, 'empresa');
                        sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuarioCorrente));
                        salvarUsuarioLogado(usuarioCorrente.cpf);
                        return true;
                    }
                }
            }
            return false;

        case 'prefeitura':
            for (let usuario of dbInstituicoes) {
                if (usuario.instituicao_id !== undefined) {
                    const instituicao = dbInstituicoesLista.find(
                        inst => String(inst.id) === String(usuario.instituicao_id)
                    );
                    if (instituicao && instituicao.nome.toLowerCase() === identificador.trim().toLowerCase() &&
                        usuario.senha === senha) {
                        usuarioCorrente = criarUsuarioCorrente(usuario, 'prefeitura');
                        usuarioCorrente.municipio = instituicao.nome;
                        sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuarioCorrente));
                        salvarUsuarioLogado(usuarioCorrente.cpf);
                        return true;
                    }
                }
            }
            return false;

        default:
            return false;
    }
}

function processaFormLogin(event) {
    event.preventDefault();

    const identificador = document.getElementById('username').value.trim();
    const senha = document.getElementById('password').value.trim();
    const versao = sessionStorage.getItem('versaoLogin') || DEFAULT_VERSION;

    if (!identificador || !senha) {
        displayMessage("Preencha todos os campos.", "warning");
        return;
    }

    if (loginUser(identificador, senha, versao)) {
        window.location.href = RETURN_URL;
    } else {
        displayMessage("Usuário ou senha inválidos.", "error");
    }
}

function logoutUser() {
    sessionStorage.removeItem('usuarioCorrente');
    salvarUsuarioLogado('');
    window.location = LOGIN_URL;
}

function showUserInfo(element) {
    var elemUser = document.getElementById(element);
    if (elemUser) {
        const nomeExibicao = usuarioCorrente.nome || usuarioCorrente.nome_usuario || 'Usuário';
        elemUser.innerHTML = `${nomeExibicao} 
                    <a onclick="logoutUser()">❌</a>`;
    }
}

const VERSION_CONFIG = {
    pessoal: {
        label: 'CPF:',
        placeholder: 'Digite seu CPF'
    },
    empresa: {
        label: 'CPF/CNPJ:',
        placeholder: 'Digite seu CPF ou CNPJ'
    },
    prefeitura: {
        label: 'Município:',
        placeholder: 'Digite o município'
    }
};

const DEFAULT_VERSION = 'empresa';

function setLoginVersion(version) {
    const label = document.querySelector('label[for="username"]');
    const input = document.getElementById('username');
    if (!label || !input) return;

    const config = VERSION_CONFIG[version];
    if (config) {
        label.textContent = config.label;
        input.placeholder = config.placeholder;
    } else {
        label.textContent = 'Login:';
        input.placeholder = '';
    }
    sessionStorage.setItem('versaoLogin', version);
}

function setupVersionToggle() {
    const links = document.querySelectorAll('.top-links a');
    if (!links.length) return;

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const texto = this.textContent.trim().toLowerCase();
            if (texto.includes('pessoal')) setLoginVersion('pessoal');
            else if (texto.includes('empresa')) setLoginVersion('empresa');
            else if (texto.includes('prefeitura')) setLoginVersion('prefeitura');
        });
    });

    const storedVersion = sessionStorage.getItem('versaoLogin') || DEFAULT_VERSION;
    setLoginVersion(storedVersion);
}

// ================= INICIALIZAÇÃO =================
function initLoginApp() {
    let pagina = window.location.pathname;

    if (pagina != LOGIN_URL) {
        sessionStorage.setItem('returnURL', pagina);
        RETURN_URL = pagina;

        const usuarioCorrenteJSON = sessionStorage.getItem('usuarioCorrente');
        if (usuarioCorrenteJSON) {
            usuarioCorrente = JSON.parse(usuarioCorrenteJSON);
            document.addEventListener('DOMContentLoaded', function () {
                showUserInfo('userInfo');
            });
        } else {
            window.location.href = LOGIN_URL;
        }
    } else {
        let returnURL = sessionStorage.getItem('returnURL');
        RETURN_URL = returnURL || RETURN_URL;

        carregarTodosDados(() => {
            console.log('Dados carregados com sucesso.');
        });

        document.addEventListener('DOMContentLoaded', function () {
            setupVersionToggle();
        });
    }
}
initLoginApp();