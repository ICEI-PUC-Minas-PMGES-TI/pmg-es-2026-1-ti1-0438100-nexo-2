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
    .then(response => {
        if (!response.ok){
            document.querySelector('main').innerHTML = '<p>Denúncia não encontrada. Verifique o link e tente novamente.</p>';
            throw new Error('Denúncia não encontrada');
        }
        return response.json();
    })
    .then(denuncia => {
        denunciaOriginal = denuncia;
        preencherModal(denuncia);
    })
const flatpickrPrazo = flatpickr('#prazo', {
    locale: 'pt',
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m/Y',
    minDate: 'today',
    allowInput: false
});

function formatarBRL(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarDataBR(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function converterDataParaISO(dataBR) {
    const [dia, mes, ano] = dataBR.split('/');
    return `${ano}-${mes}-${dia}`;
}

let denunciaOriginal = null;

function preencherModal(denuncia){
    document.getElementById('nota').value = denuncia.notaOrgao;
    const inputValor = document.getElementById('valor');
    let custo = denuncia.custo;
    if (custo) {
        const custoLimpo = parseFloat(
            custo.toString().replace(/[^\d,.-]/g, '').replace(',', '.')
        );
        inputValor.value = custoLimpo
            ? custoLimpo.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })
            : '';
    } else {
        inputValor.value = '';
    }
    document.getElementById('descricao-custo').value = denuncia.notaCusto;
    flatpickrPrazo.setDate(converterDataParaISO(denuncia.prazo));
    const lista = document.querySelector('.lista-checkpoints');
    lista.innerHTML = '';

    denuncia.progresso.forEach((checkpoint, indice) =>{
        lista.appendChild(criarItemCheckpoint(checkpoint, indice));
    });
    atualizarBotaoCheckpoint();
}
function criarItemCheckpoint(checkpoint, indice){
    const item = document.createElement('li');
    item.dataset.tipo = checkpoint.tipo || 'fixo';
    item.innerHTML= `
        <input type="checkbox" id="checkpoint-${indice}" ${checkpoint.concluida ? 'checked' : ''} ${indice === 0 ? 'disabled' : ''}>
        <label for="checkpoint-${indice}">${checkpoint.etapa}</label>
        ${checkpoint.tipo === 'customizado' ? '<button type="button" class="btn-remover-checkpoint"><i class="fa-solid fa-trash"></i></button>' : ''}
    `;

    if (checkpoint.tipo === 'customizado'){
        item.querySelector('.btn-remover-checkpoint').addEventListener('click', function(){
            const indiceReal = Array.from(item.parentElement.children).indexOf(item);
            denunciaOriginal.progresso.splice(indiceReal, 1);
            item.remove();
            atualizarBotaoCheckpoint();
        });
    }
    return item;
}

function popularSelectPosicao(){
    const select = document.getElementById('checkpoint-posicao');
    select.innerHTML = '';

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
    const descricaoCusto = document.getElementById('descricao-custo').value;
    const dadosAtualizados = {};
    dadosAtualizados.notaOrgao = nota;
    if (custo && custoLimpo > 0 && !isNaN(custoLimpo)) {
        dadosAtualizados.custo = formatarBRL(custoLimpo);
        dadosAtualizados.notaCusto = descricaoCusto;
    }
    if (prazo) dadosAtualizados.prazo = formatarDataBR(prazo);

    const checkpoints = [];
    document.querySelectorAll('.lista-checkpoints li').forEach((item, index) => {
        const input = item.querySelector('input[type="checkbox"]');
        const label = item.querySelector('label').textContent;
        const original = denunciaOriginal.progresso[index];
        checkpoints.push({
            etapa: label,
            tipo: item.dataset.tipo || 'fixo', 
            concluida: index === 0 ? original.concluida : input.checked,
            arquivo: input.checked
                ? original?.arquivo || { nome: "", url: "" }
                : {nome: "", url: ""}
        });
    });

    dadosAtualizados.progresso = checkpoints
    if (Object.keys(dadosAtualizados).length === 1) {
        const semAlteracoes = JSON.stringify(checkpoints) === JSON.stringify(denunciaOriginal.progresso);
        if (semAlteracoes) {
            alert('Nenhuma alteração foi feita.');
            botao.disabled = false;
            return;
        }
    }

    fetch(`http://localhost:3000/denuncias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizados)
    })
        .then(response => response.json())
        .then(() => {
            alteracoesPendentes = false;
            alert('Denúncia atualizada com sucesso!');
            window.parent.postMessage({ tipo: 'fechar-editor' }, '*');
        })
        .catch((err) => {
            console.error(err);
            alert('Erro ao atualizar denúncia');
        })
        .finally(() => {
            botao.disabled = false;
        });
});

document.querySelector('main .btn-checkpoint').addEventListener('click', function(){
    const total = document.querySelectorAll('.lista-checkpoints li').length;
    if (total >= 7){
        alert('Limite de 7 checkpoints atingido!');
        return;
    }
    popularSelectPosicao();
    document.getElementById('modal-checkpoint').style.display = 'flex';
});

document.getElementById('btn-cancelar').addEventListener('click', function(){
    fecharModalCheckpoint();
});

function fecharModalCheckpoint(){
    document.getElementById('modal-checkpoint').style.display = 'none';
    document.getElementById('checkpoint-nome').value = '';
}

document.getElementById('btn-confirmar-checkpoint').addEventListener('click', function(){
    const nome = document.getElementById('checkpoint-nome').value.trim();

    if (!nome){
        alert('Preencha o nome do checkpoint!');
        return;
    }
    const itens = document.querySelectorAll('.lista-checkpoints li');
    if (itens.length >= 7){
        alert('Limite de 7 checkpoints atingido!');
        return;
    }

    let posicaoSelecionada = parseInt(document.getElementById('checkpoint-posicao').value);

    const checkpointsVisiveis = Array.from(itens);
    const ultimoConcluido = checkpointsVisiveis.reduce((ultimo, item, indice) =>{
        const input = item.querySelector('input[type="checkbox"]');
        return input.checked ? indice : ultimo;
    }, -1);

    if (ultimoConcluido !== -1 && posicaoSelecionada < ultimoConcluido){
        alert('Posição inválida. O checkpoint será inserido após o último concluído.');
        posicaoSelecionada = ultimoConcluido;
    }

    const novoCheckpoint = {etapa: nome, concluida: false, tipo : 'customizado', arquivo: { nome: "", url: "" }};
    const indiceInsercao = posicaoSelecionada + 1;
    denunciaOriginal.progresso.splice(indiceInsercao, 0, novoCheckpoint);
    adicionarCheckpointNaLista(novoCheckpoint, posicaoSelecionada);
    fecharModalCheckpoint();
    
});

function adicionarCheckpointNaLista(checkpoint, posicaoSelecionada){
    const lista = document.querySelector('.lista-checkpoints');
    const novoItem = criarItemCheckpoint(checkpoint, lista.children.length);
    const itemReferencia = lista.children[posicaoSelecionada];
    itemReferencia.insertAdjacentElement('afterend', novoItem);
    atualizarBotaoCheckpoint();
}

let alteracoesPendentes = false;

document.getElementById('nota').addEventListener('input', () => alteracoesPendentes = true);
document.getElementById('valor').addEventListener('input', () => alteracoesPendentes = true);
document.getElementById('descricao-custo').addEventListener('input', () => alteracoesPendentes = true);
document.getElementById('prazo').addEventListener('change', () => alteracoesPendentes = true);

window.addEventListener('beforeunload', (e) =>{
    if (alteracoesPendentes){
        e.preventDefault();
    }
})

function atualizarBotaoCheckpoint(){
    const total = document.querySelectorAll('.lista-checkpoints li').length;
    const botao = document.querySelector('main .btn-checkpoint');
    botao.disabled = false;
    botao.title = '';
}