
        (function() {
            const inputFotos = document.getElementById('inputFotos');
            const fotosContainer = document.getElementById('fotosContainer');
            const track = document.getElementById('carrosselTrack');
            const setaEsq = document.getElementById('setaEsq');
            const setaDir = document.getElementById('setaDir');
            const form = document.getElementById('formDenuncia');
            const mensagemDiv = document.getElementById('mensagemGlobal');
            
            let fotosBase64 = [];
            let posicaoAtual = 0;
            const larguraItem = 96; 
            const QUANTIDADE_VISIVEL = 3;
            
            function atualizarSetas() {
                const totalFotos = fotosBase64.length;
                const maxPosicao = Math.max(0, totalFotos - QUANTIDADE_VISIVEL);
                setaEsq.classList.toggle('oculto', maxPosicao === 0 || posicaoAtual <= 0);
                setaDir.classList.toggle('oculto', maxPosicao === 0 || posicaoAtual >= maxPosicao);
            }
            
            function moverCarrossel(delta) {
                const totalFotos = fotosBase64.length;
                const maxPos = Math.max(0, totalFotos - QUANTIDADE_VISIVEL);
                let novaPos = posicaoAtual + delta;
                if (novaPos < 0) novaPos = 0;
                if (novaPos > maxPos) novaPos = maxPos;
                if (novaPos === posicaoAtual) return;
                posicaoAtual = novaPos;
                track.style.transform = `translateX(-${posicaoAtual * larguraItem}px)`;
                atualizarSetas();
            }
            
            function renderizarFotos() {
               
                const fotosExistentes = track.querySelectorAll('.foto-item');
                fotosExistentes.forEach(f => f.remove());
                
                // Inserir cada foto após o botão
                fotosBase64.forEach((base64, idx) => {
                    const div = document.createElement('div');
                    div.className = 'foto-item';
                    const img = document.createElement('img');
                    img.src = base64;
                    const btn = document.createElement('button');
                    btn.textContent = '✕';
                    btn.className = 'remover-foto';
                    btn.onclick = (e) => {
                        e.preventDefault();
                        fotosBase64.splice(idx, 1);
                        renderizarFotos();
                        localStorage.setItem('fotosDenunciaTemp', JSON.stringify(fotosBase64));
                        const maxPos = Math.max(0, fotosBase64.length - QUANTIDADE_VISIVEL);
                        if (posicaoAtual > maxPos) posicaoAtual = maxPos;
                        track.style.transform = `translateX(-${posicaoAtual * larguraItem}px)`;
                        atualizarSetas();
                    };
                    div.appendChild(img);
                    div.appendChild(btn);
                    const btnAdicionar = track.querySelector('.btn-adicionar');
                    if (btnAdicionar) {
                        btnAdicionar.insertAdjacentElement('afterend', div);
                    } else {
                        track.appendChild(div);
                    }
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
                        const maxPos = Math.max(0, total - QUANTIDADE_VISIVEL);
                        if (posicaoAtual === maxPos - 1 || total > QUANTIDADE_VISIVEL) {
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
            
            function mostrarMensagem(msg, tipo) {
                mensagemDiv.textContent = msg;
                mensagemDiv.className = `mensagem ${tipo}`;
                setTimeout(() => {
                    mensagemDiv.textContent = '';
                    mensagemDiv.className = 'mensagem';
                }, 4000);
            }
            
            const saved = localStorage.getItem('fotosDenunciaTemp');
            if (saved) {
                fotosBase64 = JSON.parse(saved);
            }
            renderizarFotos();

            const total = fotosBase64.length;
            if (total > QUANTIDADE_VISIVEL) {
                posicaoAtual = total - QUANTIDADE_VISIVEL;
                track.style.transform = `translateX(-${posicaoAtual * larguraItem}px)`;
                atualizarSetas();
            } else {
                posicaoAtual = 0;
                track.style.transform = `translateX(0px)`;
                atualizarSetas();
            }
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const descricao = document.getElementById('descricao').value.trim();
                const categoria = document.getElementById('categoria').value;
                const localizacao = document.getElementById('localizacao').value.trim();
                const urgencia = document.getElementById('urgencia').value;
                const entidade = document.getElementById('entidade').value;
                
                if (!descricao || !categoria || !localizacao || !urgencia) {
                    mostrarMensagem('Preencha todos os campos obrigatórios.', 'erro');
                    return;
                }
                const denuncia = {
                    id: Date.now(),
                    data: new Date().toISOString(),
                    fotos: fotosBase64,
                    descricao, categoria, localizacao, urgencia, entidade
                };
                let lista = JSON.parse(localStorage.getItem('denunciasUrbanasZella')) || [];
                lista.push(denuncia);
                localStorage.setItem('denunciasUrbanasZella', JSON.stringify(lista));
                
                fotosBase64 = [];
                localStorage.removeItem('fotosDenunciaTemp');
                renderizarFotos();
                form.reset();
                mostrarMensagem('Denúncia publicada com sucesso!', 'sucesso');
                posicaoAtual = 0;
                track.style.transform = `translateX(0px)`;
                atualizarSetas();
            });
        })();