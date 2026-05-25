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