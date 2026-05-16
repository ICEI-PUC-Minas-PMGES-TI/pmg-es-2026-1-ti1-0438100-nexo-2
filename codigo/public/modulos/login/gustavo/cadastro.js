let db = {};

// 1. Carrega o "Banco de Dados" JSON
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

// 2. Lógica do botão Cadastrar
document.getElementById('cadastroUsuario').addEventListener('click', function(event) {
    // Impede o recarregamento da página
    event.preventDefault();

    // Captura os inputs
    const nome = document.getElementById('nome').value;
    const cpfDigitado = document.getElementById('cpf').value.replace(/\D/g, ''); // Limpa pontos/traços
    
    // Captura as senhas (considerando a ordem dos inputs no seu HTML)
    const camposSenha = document.querySelectorAll('input[type="password"]');
    const senha = camposSenha[0].value;
    const confirmaSenha = camposSenha[1].value;

    // --- VALIDAÇÕES ---

    // A. Verifica se campos estão vazios
    if (!nome || !cpfDigitado || !senha) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    // B. Verifica se as senhas batem
    if (senha !== confirmaSenha) {
        alert("As senhas digitadas não são iguais.");
        return;
    }

    // C. Simulação de "Cadastro/Login" via JSON
    // Procuramos se o usuário já existe na lista de moradores do JSON
    const moradorEncontrado = db.usuarioMorador.find(u => u.cpf == cpfDigitado);

    if (moradorEncontrado) {
        // Se o CPF existe, verificamos se a senha está correta
        if (moradorEncontrado.senha === senha) {
            alert("Sucesso! Redirecionando para seu perfil...");
            
            // REDIRECIONAMENTO DIRETO
            window.location.href = "perfil-usuario.html";
        } else {
            alert("Senha incorreta para este CPF.");
        }
    } else {
        // Como não podemos salvar no arquivo JSON via JS puro, avisamos que o CPF não consta na lista
        alert("Erro: Este CPF não foi encontrado na base de dados 'geral.json'.");
    }
});