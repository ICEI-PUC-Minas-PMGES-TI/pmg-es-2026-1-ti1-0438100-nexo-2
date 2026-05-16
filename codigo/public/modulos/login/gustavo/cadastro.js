let db = {};

// Carregamento do Banco de Dados JSON
async function carregarBanco() {
    try {
        const resposta = await fetch('./geral.json');
        db = await resposta.json();
        console.log("Banco de dados pronto para consulta.");
    } catch (erro) {
        console.error("Erro ao carregar o JSON:", erro);
    }
}

carregarBanco();

// Lógica do botão Cadastrar
document.getElementById('cadastroUsuario').addEventListener('click', function(event) {
    event.preventDefault();

    // Captura dos inputs
    const nome = document.getElementById('nome').value;
    const cpfDigitado = document.getElementById('cpf').value.replace(/\D/g, '');
    
    const camposSenha = document.querySelectorAll('input[type="password"]');
    const senha = camposSenha[0].value;
    const confirmaSenha = camposSenha[1].value;

    // Validação de campos vazios
    if (!nome || !cpfDigitado || !senha) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    // Validação de igualdade das senhas
    if (senha !== confirmaSenha) {
        alert("As senhas digitadas não são iguais.");
        return;
    }

    // Autenticação e Verificação no JSON
    const moradorEncontrado = db.usuarioMorador.find(u => u.cpf == cpfDigitado);

    if (moradorEncontrado) {
        if (moradorEncontrado.senha === senha) {
            alert("Sucesso! Redirecionando para seu perfil...");
            window.location.href = "perfil-usuario.html";
        } else {
            alert("Senha incorreta para este CPF.");
        }
    } else {
        alert("Erro: Este CPF não foi encontrado na base de dados 'geral.json'.");
    }
});