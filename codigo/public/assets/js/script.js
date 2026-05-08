// ==================== 1. CARREGAR DADOS DO JSON ====================
async function carregarDados() {
    try {

        const response = await fetch('detalhes.json');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();

        preencherSelect('categoria', data.categorias, 'nome', 'id');
        preencherSelect('urgencia', data.urgencias, 'tipo', 'id');
        preencherSelect('entidade', data.entidades, 'tipo', 'id');

        console.log('✅ Dados carregados do JSON');
    } catch (error) {

        console.error('⚠️ Falha no JSON, usando fallback manual:', error);
        preencherSelect('categoria', [
            {id:1, nome:"Buraco"}, 
            {id:2, nome:"Problema de esgoto"},
            {id:3, nome:"Deslizamento"}, 
            {id:4, nome:"Falta de limpeza"},
            {id:5, nome:"Falta de iluminação"}
        ], 'nome', 'id');
        preencherSelect('urgencia', [
            {id:1, tipo:"Baixa"}, 
            {id:2, tipo:"Média"}, 
            {id:3, tipo:"Alta"}
        ], 'tipo', 'id');
        preencherSelect('entidade', [
            {id:1, tipo:"Todos"}, 
            {id:2, tipo:"Prefeitura"}, 
            {id:3, tipo:"Empresa privada"}
        ], 'tipo', 'id');
        console.log('✅ Fallback manual aplicado');
    }
}

function preencherSelect(id, lista, textoProp, valorProp) {

    const select = document.getElementById(id);

    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Selecione uma opção</option>';

    lista.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valorProp];
        option.textContent = item[textoProp];
        select.appendChild(option);
    });
}

// ============= 2. LÓGICA DO CARROSSEL E FORMULÁRIO ==============
function iniciarFormulario() {

    const inputFotos = document.getElementById('inputFotos');
    const track = document.getElementById('carrosselTrack');
    const setaEsq = document.getElementById('setaEsq');
    const setaDir = document.getElementById('setaDir');
    const form = document.getElementById('formDenuncia');
    const mensagemDiv = document.getElementById('mensagemGlobal');
    
    let fotosBase64 = [];
    let posicaoAtual = 0;
    const larguraItem = 106;
    const QUANTIDADE_VISIVEL = 3;
    
    function mostrarMensagem(msg, tipo) {
        mensagemDiv.textContent = msg;
        mensagemDiv.className = `mensagem ${tipo}`;
        setTimeout(() => {
            mensagemDiv.textContent = '';
            mensagemDiv.className = 'mensagem';
        }, 4000);
    }
    
    function atualizarSetas() {

        const total = fotosBase64.length;
        const maxPos = Math.max(0, total - QUANTIDADE_VISIVEL);

        setaEsq.style.display = (maxPos === 0 || posicaoAtual <= 0) ? 'none' : 'block';
        setaDir.style.display = (maxPos === 0 || posicaoAtual >= maxPos) ? 'none' : 'block';
    }
    
    function moverCarrossel(delta) {

        const total = fotosBase64.length;
        const maxPos = Math.max(0, total - QUANTIDADE_VISIVEL);

        let novaPos = posicaoAtual + delta;
        if (novaPos < 0) novaPos = 0;
        if (novaPos > maxPos) novaPos = maxPos;
        if (novaPos === posicaoAtual) return;
        posicaoAtual = novaPos;
        track.style.transform = `translateX(-${posicaoAtual * larguraItem}px)`;
        atualizarSetas();
    }
    
    function renderizarFotos() {

        document.querySelectorAll('.foto-item').forEach(f => f.remove());
        
        fotosBase64.forEach((base64, idx) => {

            const div = document.createElement('div');

            div.className = 'foto-item';
            div.innerHTML = `
                <img src="${base64}" style="width:100%; height:100%; object-fit:cover;">
                <button class="remover-foto" data-index="${idx}">✕</button>
            `;

            div.querySelector('.remover-foto').onclick = () => {
                fotosBase64.splice(idx, 1);
                renderizarFotos();
                localStorage.setItem('fotosDenunciaTemp', JSON.stringify(fotosBase64));
                const maxPos = Math.max(0, fotosBase64.length - QUANTIDADE_VISIVEL);
                if (posicaoAtual > maxPos) posicaoAtual = maxPos;
                track.style.transform = `translateX(-${posicaoAtual * larguraItem}px)`;
                atualizarSetas();
            };

            const btnAdicionar = document.querySelector('.btn-adicionar');

            if (btnAdicionar) btnAdicionar.insertAdjacentElement('afterend', div);
            else track.appendChild(div);

        });
        
        atualizarSetas();
    }
    
    inputFotos.addEventListener('change', (e) => {

        const files = Array.from(e.target.files);

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                mostrarMensagem(`${file.name} não é uma imagem.`, 'erro');
                return;
            }

            const reader = new FileReader();

            reader.onload = (ev) => {
                fotosBase64.push(ev.target.result);
                renderizarFotos();
                localStorage.setItem('fotosDenunciaTemp', JSON.stringify(fotosBase64));

                const total = fotosBase64.length;
                const maxPos = total - QUANTIDADE_VISIVEL;
                
                if (total > QUANTIDADE_VISIVEL && posicaoAtual < maxPos) {
                    posicaoAtual = maxPos;
                    track.style.transform = `translateX(-${posicaoAtual * larguraItem}px)`;
                    atualizarSetas();
                }
            };
            reader.readAsDataURL(file);
        });
        inputFotos.value = '';
    });
    
    setaEsq.addEventListener('click', () => moverCarrossel(-1));
    setaDir.addEventListener('click', () => moverCarrossel(1));
    
     
}

// ==================== 3. INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    iniciarFormulario();
});