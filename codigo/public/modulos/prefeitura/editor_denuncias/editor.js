const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get('id'));

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

    document.getElementById('checkpoint-1').checked = denuncia.checkpoints.denunciaAceita;
    document.getElementById('checkpoint-2').checked = denuncia.checkpoints.equipeEnviada;
    document.getElementById('checkpoint-3').checked = denuncia.checkpoints.planejamento;
    document.getElementById('checkpoint-4').checked = denuncia.checkpoints.manutencaoAndamento;
    document.getElementById('checkpoint-5').checked = denuncia.checkpoints.obraFinalizada;

    document.getElementById('valor').value = `R$ ${denuncia.custo}`;
    document.getElementById('descricao-custo').value = denuncia.descricaoCusto;
    document.getElementById('prazo').value = denuncia.prazo;
}

document.querySelector('.btn-salvar').addEventListener('click', function(){
    const dadosAtualizados = {
        notaOrgao: document.getElementById('nota').value,
        checkpoints: {
            denunciaAceita: document.getElementById('checkpoint-1').checked,
            equipeEnviada: document.getElementById('checkpoint-2').checked,
            planejamento: document.getElementById('checkpoint-3').checked,
            manutencaoAndamento: document.getElementById('checkpoint-4').checked,
            obraFinalizada: document.getElementById('checkpoint-5').checked,
        },
        custo: document.getElementById('valor').value.replace('R$ ', ''),
        descricaoCusto: document.getElementById('descricao-custo').value,
        prazo: document.getElementById('prazo').value
    };
    fetch(`http://localhost:3000/denuncias/${id}`,{
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosAtualizados)
    })
    .then(response => response.json())
    .then(() => {
        alert('Denúncia atualizada com sucesso!');
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

            return fetch(`http://localhost:3000/denuncias/{id}`, {
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