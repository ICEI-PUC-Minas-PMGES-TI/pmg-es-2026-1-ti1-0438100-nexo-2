// VARIÁVEIS GLOBAIS

let fotosBase64 = [];           
let carrosselTrack;
let botaoSetaEsquerda;
let botaoSetaDireita;
let inputSelecionarFotos;
let posicaoAtual = 0;
const LARGURA_ITEM = 106;
const QUANTIDADE_VISIVEL = 3;
let denunciaEditando = null;   


// 1. CARREGAR DADOS DO JSON 

async function carregarDados() {

    try {

        const resposta = await fetch('./../../../../db/denuncias.json');
        if (!resposta.ok) throw new Error('HTTP ' + resposta.status);

        const dados = await resposta.json();
        preencherSelect('categoria', dados.categorias, 'nome', 'id');
        preencherSelect('urgencia', dados.urgencias, 'tipo', 'id');
        preencherSelect('entidade', dados.entidades, 'tipo', 'id');

    } catch (erro) {

        console.error('Fallback (JSON não encontrado):', erro);

        preencherSelect('categoria', [
            {id:1, nome:"Buraco"}, {id:2, nome:"Problema de esgoto"},
            {id:3, nome:"Deslizamento"}, {id:4, nome:"Falta de limpeza"},
            {id:5, nome:"Falta de iluminação"}
        ], 'nome', 'id');

        preencherSelect('urgencia', [
            {id:1, tipo:"Baixa"}, {id:2, tipo:"Média"}, {id:3, tipo:"Alta"}
        ], 'tipo', 'id');

        preencherSelect('entidade', [
            {id:1, tipo:"Todos"}, {id:2, tipo:"Prefeitura"}, {id:3, tipo:"Empresa privada"}
        ], 'tipo', 'id');
    }
}

function preencherSelect(idSelect, lista, textoProp, valorProp) {

    const select = document.getElementById(idSelect);
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Selecione uma opção</option>';
    
    for (let item of lista) {
        const option = document.createElement('option');
        option.value = item[valorProp];
        option.textContent = item[textoProp];
        select.appendChild(option);
    }
}

// 2. CARROSSEL (fotos) - aprimorar na sprint 2, erro nas setas e etc

function atualizarSetas() {

    const total = fotosBase64.length;
    const maxPos = Math.max(0, total - QUANTIDADE_VISIVEL);

    if (botaoSetaEsquerda) botaoSetaEsquerda.style.display = (maxPos === 0 || posicaoAtual <= 0) ? 'none' : 'block';
    if (botaoSetaDireita) botaoSetaDireita.style.display = (maxPos === 0 || posicaoAtual >= maxPos) ? 'none' : 'block';

}

function moverCarrossel(delta) {

    const total = fotosBase64.length;
    const maxPos = Math.max(0, total - QUANTIDADE_VISIVEL);
    let novaPos = posicaoAtual + delta;

    if (novaPos < 0) novaPos = 0;
    if (novaPos > maxPos) novaPos = maxPos;
    if (novaPos === posicaoAtual) return;
    posicaoAtual = novaPos;
    carrosselTrack.style.transform = `translateX(-${posicaoAtual * LARGURA_ITEM}px)`;
    atualizarSetas();

}

function renderizarFotos() {

    const fotosAntigas = document.querySelectorAll('.foto-item');
    for (let foto of fotosAntigas) foto.remove();

    for (let i = 0; i < fotosBase64.length; i++) {
        const div = document.createElement('div');
        div.className = 'foto-item';
        div.innerHTML = `
            <img src="${fotosBase64[i]}" style="width:100%; height:100%; object-fit:cover;">
            <button class="remover-foto">✕</button>
        `;

        const botaoRemover = div.querySelector('.remover-foto');
        botaoRemover.onclick = () => {
            fotosBase64.splice(i, 1);
            renderizarFotos();
            const maxPos = Math.max(0, fotosBase64.length - QUANTIDADE_VISIVEL);
            if (posicaoAtual > maxPos) posicaoAtual = maxPos;
            carrosselTrack.style.transform = `translateX(-${posicaoAtual * LARGURA_ITEM}px)`;
            atualizarSetas();
        };

        const btnAdicionar = document.querySelector('.btn-adicionar');
        if (btnAdicionar) btnAdicionar.insertAdjacentElement('afterend', div);
        else carrosselTrack.appendChild(div);

    }
    atualizarSetas();
}


// 3. FUNÇÕES PARA SALVAR/RECUPERAR IMAGENS NO LOCALSTORAGE

function salvarImagensNoLocalStorage(idDenuncia, imagens) {

    if (!idDenuncia) return;
    const chave = `imagens_${idDenuncia}`;
    localStorage.setItem(chave, JSON.stringify(imagens));
    console.log(`Imagens salvas para denúncia ${idDenuncia}: ${imagens.length} foto(s)`);

}

function carregarImagensDoLocalStorage(idDenuncia) {

    if (!idDenuncia) return [];

    const chave = `imagens_${idDenuncia}`;
    const dados = localStorage.getItem(chave);

    if (dados) {
        const imagens = JSON.parse(dados);
        console.log(`Imagens carregadas para denúncia ${idDenuncia}: ${imagens.length} foto(s)`);
        return imagens;
    }

    console.log(`Nenhuma imagem encontrada no localStorage para denúncia ${idDenuncia}`);
    return [];
}

// 4. CRIAR OU EDITAR DENÚNCIA 

async function criarDenuncia(evento) {

    evento.preventDefault();

    const descricao = document.getElementById('descricao').value.trim();
    const categoriaId = document.getElementById('categoria').value;
    const localizacao = document.getElementById('localizacao').value.trim();
    const urgenciaId = document.getElementById('urgencia').value;
    const entidadeId = document.getElementById('entidade').value;

    if (!descricao || !categoriaId || !localizacao || !urgenciaId || !entidadeId) {
        alert('Preencha todos os campos obrigatórios.');
        return;
    }

    if (fotosBase64.length === 0) {
        alert('Adicione pelo menos uma foto.');
        return;
    }

    // Extrai cidade e estado do local
    const local = { pais: "Brasil", logradouro: localizacao };
    const regex = /([A-Za-zÀ-ú\s]+?)\s*[-]\s*([A-Z]{2})/;
    const match = localizacao.match(regex);

    if (match) {

        local.cidade = match[1].trim();
        local.estado = match[2].toUpperCase();
        local.logradouro = localizacao.replace(match[0], '').trim();

    } else {

        local.cidade = "Não informada";
        local.estado = "XX";

    }

    // Objeto da denúncia
    const denuncia = {

        status_id: 3,
        categoria_id: parseInt(categoriaId),
        descricaoDenuncia: descricao,
        urgencia_id: parseInt(urgenciaId),
        data: new Date().toISOString().split('T')[0],
        entidade_id: parseInt(entidadeId),
        usuarioMorador_cpf: 12345678900,
        local: local,
        usuarioInstituicao_cpf: null,
        notaOrgao: "",
        prazo: "",
        afetados: 0,
        custo: "",
        progresso: [
            { etapa: "Denúncia aceita", concluida: false },
            { etapa: "Equipe enviada ao local", concluida: false },
            { etapa: "Planejamento e previsões", concluida: false },
            { etapa: "Manutenção em andamento", concluida: false },
            { etapa: "Obra finalizada", concluida: false }
        ]
    };

    try {

        let idDenunciaSalva;

        if (denunciaEditando) {

            await atualizarDenuncia(denunciaEditando, denuncia);
            idDenunciaSalva = denunciaEditando;

        } else {

            const resposta = await fetch('http://localhost:3000/denuncias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(denuncia)

            });
            if (!resposta.ok) throw new Error('Erro ao criar denúncia');
            const novaDenuncia = await resposta.json();
            idDenunciaSalva = novaDenuncia.id;
        }

        salvarImagensNoLocalStorage(idDenunciaSalva, fotosBase64);

        document.getElementById('formDenuncia').reset();
        fotosBase64 = [];
        renderizarFotos();
        denunciaEditando = null;
        await carregarDenuncias();

    } catch (erro) {

        console.error('Erro ao salvar:', erro);

    }
}

// 5. COMUNICAÇÃO COM API (json-server) - sem imagens

async function carregarDenuncias() {

    try {

        const resposta = await fetch('http://localhost:3000/denuncias');

        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

        const denuncias = await resposta.json();

        const tabela = document.getElementById('tabelaDenuncias');

        if (!tabela) return;
        tabela.innerHTML = '';

        for (let denuncia of denuncias) {

            tabela.innerHTML += `
                <tr>
                    <td>${denuncia.id}</td>
                    <td>${denuncia.descricaoDenuncia || ''}</td>
                    <td>${denuncia.local?.logradouro || 'Não informado'}</td>
                    <td>${denuncia.data || ''}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editarDenuncia('${denuncia.id}')">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="excluirDenuncia('${denuncia.id}')">Excluir</button>
                    </td>
                </tr>
            `;
        }
    } catch (erro) {

        console.error('Erro ao carregar denúncias:', erro);

    }
}

async function excluirDenuncia(id) {

    if (!id) return;

    if (!confirm('Deseja realmente excluir esta denúncia?')) return;

    try {

        const resposta = await fetch(`http://localhost:3000/denuncias/${id}`, { method: 'DELETE' });

        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
       
        localStorage.removeItem(`imagens_${id}`);
        await carregarDenuncias();

        if (denunciaEditando == id) {
            denunciaEditando = null;
            document.getElementById('formDenuncia').reset();
            fotosBase64 = [];
            renderizarFotos();
        }
    } catch (erro) {

        console.error('Erro ao excluir:', erro);

    }
}

async function editarDenuncia(id) {

    try {

        const resposta = await fetch(`http://localhost:3000/denuncias/${id}`);

        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

        const denuncia = await resposta.json();
        denunciaEditando = id;

        document.getElementById('descricao').value = denuncia.descricaoDenuncia || '';
        document.getElementById('categoria').value = denuncia.categoria_id || '';
        document.getElementById('localizacao').value = denuncia.local?.logradouro || '';
        document.getElementById('urgencia').value = denuncia.urgencia_id || '';
        document.getElementById('entidade').value = denuncia.entidade_id || '';

        let imagens = carregarImagensDoLocalStorage(id);

        if (imagens.length === 0 && denuncia.imagens && Array.isArray(denuncia.imagens)) {
            imagens = denuncia.imagens;
            console.log(`Usando imagens do próprio objeto denúncia (${imagens.length} fotos) e salvando no localStorage`);
            salvarImagensNoLocalStorage(id, imagens); // migra para localStorage
        }

        fotosBase64 = imagens;
        renderizarFotos();

    } catch (erro) {

        console.error('Erro ao editar:', erro)

    }
}

async function atualizarDenuncia(id, denunciaAtualizada) {

    const resposta = await fetch(`http://localhost:3000/denuncias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...denunciaAtualizada, id: parseInt(id) })
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
}


// 6. INICIALIZAÇÃO

function iniciarFormulario() {

    inputSelecionarFotos = document.getElementById('inputFotos');
    carrosselTrack = document.getElementById('carrosselTrack');
    botaoSetaEsquerda = document.getElementById('setaEsq');
    botaoSetaDireita = document.getElementById('setaDir');

    const formulario = document.getElementById('formDenuncia');

    if (!inputSelecionarFotos || !carrosselTrack || !formulario) {
        console.error('Elementos não encontrados');
        return;
    }

    inputSelecionarFotos.addEventListener('change', (e) => {

        const arquivos = Array.from(e.target.files);

        for (let arquivo of arquivos) {

            if (!arquivo.type.startsWith('image/')) continue;
            const leitor = new FileReader();

            leitor.onload = (ev) => {

                fotosBase64.push(ev.target.result);
                renderizarFotos();

                const total = fotosBase64.length;
                const maxPos = total - QUANTIDADE_VISIVEL;

                if (total > QUANTIDADE_VISIVEL && posicaoAtual < maxPos) {
                    posicaoAtual = maxPos;
                    carrosselTrack.style.transform = `translateX(-${posicaoAtual * LARGURA_ITEM}px)`;
                    atualizarSetas();
                }
            };
            leitor.readAsDataURL(arquivo);
        }
        inputSelecionarFotos.value = '';
    });

    botaoSetaEsquerda.addEventListener('click', () => moverCarrossel(-1));
    botaoSetaDireita.addEventListener('click', () => moverCarrossel(1));
    formulario.addEventListener('submit', criarDenuncia);
}

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    iniciarFormulario();
    await carregarDenuncias();
});