const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get('id'));
if (!id || isNaN(id)) {
    document.querySelector('main').innerHTML = '<p>Denúncia não encontrada. Verifique o link e tente novamente.</p>';
    throw new Error('ID inválido');
}

fetch(`http://localhost:3000/denuncias/${id}`,{
    headers: {
        "Accept": "application/json"
    }
})
    .then(response => response.json())
    .then(denuncia => {
        preencherModal(denuncia);
    })

function preencherModal(denuncia){
    document.getElementById('nota').value = denuncia.notaOrgao;
    const custoFormatado = parseFloat(denuncia.custo).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    document.getElementById('valor').value = custoFormatado;
    document.getElementById('descricao-custo').value = denuncia.descricaoCusto;
    document.getElementById('prazo').value = denuncia.prazo;
    const lista = document.querySelector('.lista-checkpoints');
    lista.innerHTML = '';

    denuncia.checkpoints.forEach((checkpoint, indice) =>{
        lista.appendChild(criarItemCheckpoint(checkpoint, indice));
    });
}
function criarItemCheckpoint(checkpoint, indice){
    const item = document.createElement('li');
    item.innerHTML= `
        <input type="checkbox" id="checkpoint-${indice}" ${checkpoint.concluido ? 'checked' : ''}>
        <label for="checkpoint-${indice}">${checkpoint.nome}</label>
    `;
    return item;
}

function popularSelectPosicao(){
    const select = document.getElementById('checkpoint-posicao');
    select.innerHTML = '';

    const opcaoInicio = document.createElement('option');
    opcaoInicio.value = '-1';
    opcaoInicio.textContent = 'No início da lista';
    select.appendChild(opcaoInicio);

    const itens = document.querySelectorAll('.lista-checkpoints li');
    itens.forEach((item, indice) => {
        const label = item.querySelector('label').textContent;
        const opcao = document.createElement('option');
        opcao.value = indice;
        opcao.textContent = `Após: ${label}`;
        select.appendChild(opcao);
    });

    select.value = itens.length - 1;
}

document.getElementById('valor').addEventListener('input', (e) =>{
    let valor = e.target.value.replace(/\D/g, '');
    if (valor === ''){
        valor = 0;
    }
    valor = (parseInt(valor) / 100);
    valor = valor.toLocaleString('pt-BR', {
        style : 'currency',
        currency: 'BRL'
    });
    e.target.value = valor;
});

document.querySelector('.btn-salvar').addEventListener('click', function(){
    const botao = this;
    botao.disabled = true;

    const nota = document.getElementById('nota').value.trim();
    const custo = document.getElementById('valor').value;
    const custoLimpo = parseFloat(custo.replace(/[R$\u00a0\s.]/g, '').replace(',', '.'));
    const prazo = document.getElementById('prazo').value;
    if (!nota){
        alert('Por favor, preencha o campo de nota.');
        botao.disabled = false;
        return;
    }

    if(!custo || custoLimpo <= 0 || isNaN(custoLimpo)){
        alert('Por favor, insira um custo válido.');
        botao.disabled = false;
        return;
    }

    if (!prazo){
        alert('Por favor, selecione um prazo.');
        botao.disabled = false;
        return;
    }
    const checkpoints = [];
    document.querySelectorAll('.lista-checkpoints li').forEach((item) => {
        const input = item.querySelector('input[type="checkbox"]');
        const label = item.querySelector('label');
        checkpoints.push({
            nome: label.textContent,
            descricao: '',
            concluido: input.checked
        });
    });
    const dadosAtualizados = {
        notaOrgao: document.getElementById('nota').value,
        checkpoints: checkpoints,
        custo: custoLimpo,
        descricaoCusto: document.getElementById('descricao-custo').value,
        prazo: document.getElementById('prazo').value
    };
    fetch(`http://localhost:3000/denuncias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizados)
    })
        .then(response => response.json())
        .then(() => {
            alert('Denúncia atualizada com sucesso!');
        })
        .finally(() =>{
            botao.disabled = false;
        });
});

document.querySelector('main .btn-checkpoint').addEventListener('click', function(){
    popularSelectPosicao();
    document.getElementById('modal-checkpoint').style.display = 'flex';
});

document.getElementById('btn-cancelar').addEventListener('click', function(){
    fecharModalCheckpoint();
});

function fecharModalCheckpoint(){
    document.getElementById('modal-checkpoint').style.display = 'none';
    document.getElementById('checkpoint-nome').value = '';
    document.getElementById('checkpoint-descricao').value = '';
}

document.getElementById('btn-confirmar-checkpoint').addEventListener('click', function(){
    const nome = document.getElementById('checkpoint-nome').value.trim();
    const descricao = document.getElementById('checkpoint-descricao').value.trim();

    if (!nome || !descricao){
        alert('Preencha o nome e a descrição do checkpoint!');
        return;
    }

    const posicaoSelecionada = parseInt(document.getElementById('checkpoint-posicao').value);
    const novoCheckpoint = {nome, descricao, concluido: false, tipo : 'customizado'};

    fetch(`http://localhost:3000/denuncias/${id}`)
        .then(response => response.json())
        .then(denuncia => {
            const checkpointsAtualizados = [...denuncia.checkpoints];

            const indiceInsercao = posicaoSelecionada + 1;
            checkpointsAtualizados.splice(indiceInsercao, 0, novoCheckpoint);

            return fetch(`http://localhost:3000/denuncias/${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({checkpoints: checkpointsAtualizados})
            });
        })
        .then(() => {
            adicionarCheckpointNaLista(novoCheckpoint, posicaoSelecionada);
            fecharModalCheckpoint();
        });
});

function adicionarCheckpointNaLista(checkpoint, posicaoSelecionada){
    const lista = document.querySelector('.lista-checkpoints');
    const novoItem = criarItemCheckpoint(checkpoint, lista.children.length);
    if (posicaoSelecionada === -1){
        lista.insertBefore(novoItem, lista.firstChild);
    } else {
        const itemReferencia = lista.children[posicaoSelecionada];
        itemReferencia.insertAdjacentElement('afterend', novoItem);
    }
}
