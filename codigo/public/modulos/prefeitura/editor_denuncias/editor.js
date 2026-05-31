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
    document.getElementById('valor').value = denuncia.custo;
    document.getElementById('descricao-custo').value = denuncia.descricaoCusto;
    document.getElementById('prazo').value = denuncia.prazo;
    const lista = document.querySelector('.lista-checkpoints');
    lista.innerHTML = '';

    denuncia.checkpoints.forEach((checkpoint, indice) =>{
        const item = document.createElement('li');
        item.innerHTML = `
            <input type="checkbox" id="checkpoint-${indice}" ${checkpoint.concluido ? 'checked': ''}>
            <label for="checkpoint-${indice}">${checkpoint.nome}</label>
            `;
            lista.appendChild(item)
    });
}

document.querySelector('.btn-salvar').addEventListener('click', function(){
    const botao = this;
    botao.disabled = true;

    const nota = document.getElementById('nota').value.trim();
    const custo = document.getElementById('valor').value;
    const prazo = document.getElementById('prazo').value;
    if (!nota){
        alert('Por favor, preencha o campo de nota.');
        botao.disabled = false;
        return;
    }

    if(!custo || custo <= 0){
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
    document.querySelectorAll('.lista-checkpoints li').forEach((item,indice) => {
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
        custo: document.getElementById('valor').value,
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

document.querySelector('.btn-checkpoint').addEventListener('click', function(){
    const modal = document.getElementById('modal-checkpoint');
    modal.style.display = 'flex';
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

    const novoCheckpoint = {nome, descricao, concluido: false};

    fetch(`http://localhost:3000/denuncias/${id}`)
        .then(response => response.json())
        .then(denuncia => {
            const checkpointsAtualizados = [...denuncia.checkpoints, novoCheckpoint];

            return fetch(`http://localhost:3000/denuncias/${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({checkpoints: checkpointsAtualizados})
            });
        })
        .then(() => {
            adicionarCheckpointNaLista(novoCheckpoint);
            fecharModalCheckpoint();
        });
});

function adicionarCheckpointNaLista(checkpoint){
    const lista = document.querySelector('.lista-checkpoints');
    const novoItem = document.createElement('li');
    const indice = lista.children.length + 1;

    novoItem.innerHTML = `
        <input type="checkbox" id="checkpoint-${indice}">
        <label for="checkpoint-${indice}">${checkpoint.nome}</label>
    `;
    lista.appendChild(novoItem);
}