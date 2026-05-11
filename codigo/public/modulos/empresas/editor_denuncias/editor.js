const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get('id'));

fetch('editor.json')
    .then(response => response.json())
    .then(dados => {
        const denuncia = dados.denuncias.find(d => d.id === id);
        if (denuncia) {
            preencherModal(denuncia);
        }
    });

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