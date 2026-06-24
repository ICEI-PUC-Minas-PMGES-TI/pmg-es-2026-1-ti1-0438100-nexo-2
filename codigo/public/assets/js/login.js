// Trabalho Interdisciplinar 1 - Aplicações Web
//
// Esse módulo realiza o registro de novos usuários e login para aplicações com 
// backend baseado em API REST provida pelo JSONServer
// Os dados de usuário estão localizados no arquivo db.json que acompanha este projeto.
//
// Autor: Rommel Vieira Carneiro (rommelcarneiro@gmail.com)
// Data: 09/09/2024
//
// Código LoginApp

// Página inicial de Login
const LOGIN_URL = "/modulos/login/login.html";
let RETURN_URL = "/modulos/login/index.html";
const API_URL = '/usuarios'; // ======== Alterar com o que for necessário para o backend ========

// Objeto para o banco de dados de usuários baseado em JSON
var db_usuarios = {};

// Objeto para o usuário corrente
var usuarioCorrente = {};

function displayMessage(msg, tipo = 'info') {
    const div = document.getElementById('mensagem');
    if (!div) return;

    // Remove classes anteriores (Bootstrap)
    div.classList.remove('alert-success', 'alert-danger', 'alert-warning', 'alert-info', 'd-none');

    // Mapeia o tipo para a classe do Bootstrap
    const classes = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    };
    div.classList.add('alert', classes[tipo] || 'alert-info');

    // Insere a mensagem
    div.textContent = msg;

    // Opcional: oculta automaticamente após 5 segundos
    clearTimeout(div._timeout);
    div._timeout = setTimeout(() => {
        div.classList.add('d-none');
    }, 5000);
}

function initLoginApp() {
    let pagina = window.location.pathname;

    if (pagina != LOGIN_URL) {
        // Salva a URL atual para redirecionar após login
        sessionStorage.setItem('returnURL', pagina);
        RETURN_URL = pagina;

        // Verifica se o usuário está logado
        const usuarioCorrenteJSON = sessionStorage.getItem('usuarioCorrente');
        if (usuarioCorrenteJSON) {
            usuarioCorrente = JSON.parse(usuarioCorrenteJSON);
            // Atualiza informações do usuário na página (se houver)
            document.addEventListener('DOMContentLoaded', function () {
                showUserInfo('userInfo');
            });
        } else {
            // Não está logado → redireciona para o login
            window.location.href = LOGIN_URL;
        }
    } else {
        // Define a URL de retorno (página que o usuário tentou acessar)
        let returnURL = sessionStorage.getItem('returnURL');
        RETURN_URL = returnURL || RETURN_URL;

        // Carrega os usuários do backend
        carregarUsuarios(() => {
            console.log('Usuários carregados...');
        });

        // Configura a troca de versão (CPF/CNPJ/Município) após o DOM carregar
        document.addEventListener('DOMContentLoaded', function () {
            setupVersionToggle();
        });
    }
}

function carregarUsuarios(callback) {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            db_usuarios = data;
            if (callback) callback();
        })
        .catch(error => {
            console.error('Erro ao ler usuários via API JSONServer:', error);
            displayMessage("Erro ao ler usuários", "error");
        });
}

function loginUser(login, senha) {
    for (var i = 0; i < db_usuarios.length; i++) {
        var usuario = db_usuarios[i];
        // ======== Alterar com o que for necessário para o backend ========
        if (login == usuario.login && senha == usuario.senha) {
            usuarioCorrente.id = usuario.id;
            usuarioCorrente.login = usuario.login;
            usuarioCorrente.email = usuario.email;
            usuarioCorrente.nome = usuario.nome;

            sessionStorage.setItem('usuarioCorrente', JSON.stringify(usuarioCorrente));
            return true;
        }
    }
    return false;
}

function processaFormLogin(event) {
    event.preventDefault(); // Evita o reload da página

    // ======== Alterar com o que for necessário para o backend ========
    const login = document.getElementById('username').value.trim();
    const senha = document.getElementById('password').value.trim();

    if (!login || !senha) {
        displayMessage("Preencha todos os campos.", "warning");
        return;
    }

    if (loginUser(login, senha)) {
        // Login bem-sucedido → redireciona para a página inicial
        window.location.href = RETURN_URL;
    } else {
        displayMessage("Usuário ou senha inválidos.", "error");
    }
}

function logoutUser() {
    sessionStorage.removeItem('usuarioCorrente');
    window.location = LOGIN_URL;
}

function addUser(nome, login, senha, email) {
    // ======== Alterar com o que for necessário para o backend ========// ======== Alterar com o que for necessário para o backend ========
    let usuario = { "login": login, "senha": senha, "nome": nome, "email": email };

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuario),
    })
        .then(response => response.json())
        .then(data => {
            db_usuarios.push(usuario);
            displayMessage("Usuário inserido com sucesso", "success");
        })
        .catch(error => {
            console.error('Erro ao inserir usuário via API JSONServer:', error);
            displayMessage("Erro ao inserir usuário", "error");
        });
}

function showUserInfo(element) {
    var elemUser = document.getElementById(element);
    if (elemUser) {
        elemUser.innerHTML = `${usuarioCorrente.nome} (${usuarioCorrente.login}) 
                    <a onclick="logoutUser()">❌</a>`;
    }
}

const VERSION_CONFIG = {
    pessoal: {
        label: 'CPF:',
        placeholder: 'Digite seu CPF'
    },
    empresa: {
        label: 'CNPJ:',
        placeholder: 'Digite seu CNPJ'
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

            if (texto.includes('pessoal')) {
                setLoginVersion('pessoal');
            } else if (texto.includes('empresa')) {
                setLoginVersion('empresa');
            } else if (texto.includes('prefeitura')) {
                setLoginVersion('prefeitura');
            }
        });
    });

    const storedVersion = sessionStorage.getItem('versaoLogin') || DEFAULT_VERSION;
    setLoginVersion(storedVersion);
}

// INICIALIZA
initLoginApp();