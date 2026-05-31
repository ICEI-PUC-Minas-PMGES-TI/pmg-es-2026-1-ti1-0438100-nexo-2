    // ===================== VARIÁVEIS GLOBAIS =====================
    let fotosBase64 = [];
    let carrosselTrack;
    let botaoSetaEsquerda;
    let botaoSetaDireita;
    let inputSelecionarFotos;
    let posicaoAtual = 0;
    const LARGURA_ITEM = 106;
    const QUANTIDADE_VISIVEL = 3;
    let denunciaEditando = null;
    let usuarioLogado = { cpf: null };
    let mapa, marcador, mapaInicializado = false;
    let localTemp = null;
    let categoriasLista = [];
    let entidadesLista = [];

    // ===================== 1. CARREGAR DADOS AUXILIARES =====================
    async function carregarDados() {
        try {
            const resposta = await fetch('./../../../../db/denuncias.json');
            if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
            const dados = await resposta.json();
            categoriasLista = dados.categorias;
            entidadesLista = dados.entidades;
            preencherSelect('categoria', dados.categorias, 'nome', 'id');
            preencherSelect('urgencia', dados.urgencias, 'tipo', 'id');
            preencherSelect('entidade', dados.entidades, 'tipo', 'id');
        } catch (erro) {
            console.warn('Fallback (JSON não encontrado):', erro);
            categoriasLista = [
                {id:1, nome:"Buraco"}, {id:2, nome:"Problema de esgoto"},
                {id:3, nome:"Deslizamento"}, {id:4, nome:"Falta de limpeza"},
                {id:5, nome:"Falta de iluminação"}
            ];
            entidadesLista = [
                {id:1, tipo:"Todos"}, {id:2, tipo:"Prefeitura"}, {id:3, tipo:"Empresa privada"}
            ];
            preencherSelect('categoria', categoriasLista, 'nome', 'id');
            preencherSelect('urgencia', [
                {id:1, tipo:"Baixa"}, {id:2, tipo:"Média"}, {id:3, tipo:"Alta"}
            ], 'tipo', 'id');
            preencherSelect('entidade', entidadesLista, 'tipo', 'id');
        }
    }

    async function carregarUsuarioLogado() {
        try {
            const resposta = await fetch('./../../../../db/detalhes.json');
            if (!resposta.ok) throw new Error('Erro ao carregar detalhes.json');
            const dados = await resposta.json();
            usuarioLogado.cpf = dados.usuarioLogado.cpf;
            console.log('Usuário logado CPF:', usuarioLogado.cpf);
        } catch (erro) {
            console.error('Falha ao carregar usuário logado. Usando CPF fixo para testes.', erro);
            usuarioLogado.cpf = '000.000.000-00';
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

    function getCategoriaNome(id) {
        const cat = categoriasLista.find(c => c.id == id);
        return cat ? cat.nome : 'Desconhecida';
    }

    function getEntidadeNome(id) {
        const ent = entidadesLista.find(e => e.id == id);
        return ent ? ent.tipo : 'Desconhecida';
    }

    function formatarData(dataISO) {
        if (!dataISO) return '';
        const partes = dataISO.split('-');
        if (partes.length !== 3) return dataISO;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    // ===================== 2. MAPA E ENDEREÇO =====================
    function inicializarMapa() {
        const mapaDiv = document.getElementById('mapa');
        if (!mapaDiv) return;
        const posicaoInicial = [-15.7801, -47.9292];
        mapa = L.map('mapa').setView(posicaoInicial, 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapa);
        marcador = L.marker(posicaoInicial, { draggable: true }).addTo(mapa);
        mapa.on('click', async (e) => await atualizarLocalSelecionado(e.latlng.lat, e.latlng.lng));
        marcador.on('dragend', async (e) => {
            const pos = e.target.getLatLng();
            await atualizarLocalSelecionado(pos.lat, pos.lng);
        });
        mapaInicializado = true;
    }

    async function atualizarLocalSelecionado(lat, lng) {
        if (!mapaInicializado) return;
        marcador.setLatLng([lat, lng]);
        mapa.setView([lat, lng], 15);
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            const data = await resp.json();
            const enderecoCompleto = data.display_name || `${lat}, ${lng}`;
            document.getElementById('localizacao').value = enderecoCompleto;

            const addr = data.address || {};
            const cidade = addr.city || addr.town || addr.village || addr.municipality || "Não informada";
            let estado = addr.state_code ? addr.state_code.toUpperCase() : (addr.state || "XX");
            // Mapeia nomes completos para sigla
            const siglas = {
                "Acre":"AC","Alagoas":"AL","Amapá":"AP","Amazonas":"AM","Bahia":"BA","Ceará":"CE",
                "Distrito Federal":"DF","Espírito Santo":"ES","Goiás":"GO","Maranhão":"MA","Mato Grosso":"MT",
                "Mato Grosso do Sul":"MS","Minas Gerais":"MG","Pará":"PA","Paraíba":"PB","Paraná":"PR",
                "Pernambuco":"PE","Piauí":"PI","Rio de Janeiro":"RJ","Rio Grande do Norte":"RN","Rio Grande do Sul":"RS",
                "Rondônia":"RO","Roraima":"RR","Santa Catarina":"SC","São Paulo":"SP","Sergipe":"SE","Tocantins":"TO"
            };
            if (estado.length > 2 && siglas[estado]) estado = siglas[estado];

            const pais = addr.country || "Brasil";
            let logradouro = addr.road || addr.pedestrian || addr.footway || "";
            if (!logradouro && addr.suburb) logradouro = addr.suburb;
            if (!logradouro && addr.neighbourhood) logradouro = addr.neighbourhood;
            if (!logradouro && enderecoCompleto) logradouro = enderecoCompleto.split(',')[0].trim();
            const numero = addr.house_number || "";

            localTemp = { cidade, estado, pais, logradouro, numero, latitude: lat, longitude: lng };
            console.log('Dados extraídos:', localTemp);
        } catch (err) {
            console.error('Erro ao buscar endereço:', err);
            document.getElementById('localizacao').value = `${lat}, ${lng}`;
            localTemp = { cidade: "Não informada", estado: "XX", pais: "Brasil", logradouro: "", numero: "", latitude: lat, longitude: lng };
        }
    }

    async function buscarEndereco() {
        if (!mapaInicializado) return;
        const query = document.getElementById('searchEndereco').value.trim();
        if (!query) return;
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await resp.json();
            if (data.length > 0) {
                const { lat, lon, display_name } = data[0];
                await atualizarLocalSelecionado(parseFloat(lat), parseFloat(lon));
                document.getElementById('localizacao').value = display_name;
            } else alert('Endereço não encontrado.');
        } catch (err) { console.error('Erro na busca:', err); }
    }

    function extrairCidadeEstadoDoTexto(texto) {
        const matchUF = texto.match(/-\s*([A-Z]{2})/);
        const estado = matchUF ? matchUF[1] : "XX";
        const matchCidade = texto.match(/,\s*([A-Za-zÀ-ú\s]+?)\s*-\s*[A-Z]{2}/);
        const cidade = matchCidade ? matchCidade[1].trim() : "Não informada";
        return { cidade, estado };
    }

    // ===================== 3. CARROSSEL =====================
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
        novaPos = Math.min(Math.max(0, novaPos), maxPos);
        if (novaPos === posicaoAtual) return;
        posicaoAtual = novaPos;
        carrosselTrack.style.transform = `translateX(-${posicaoAtual * LARGURA_ITEM}px)`;
        atualizarSetas();
    }

    function renderizarFotos() {
        document.querySelectorAll('.foto-item').forEach(f => f.remove());
        fotosBase64.forEach((foto, idx) => {
            const div = document.createElement('div');
            div.className = 'foto-item';
            div.innerHTML = `<img src="${foto}" style="width:100%; height:100%; object-fit:cover;"><button class="remover-foto">✕</button>`;
            div.querySelector('.remover-foto').onclick = () => {
                fotosBase64.splice(idx, 1);
                renderizarFotos();
                const maxPos = Math.max(0, fotosBase64.length - QUANTIDADE_VISIVEL);
                if (posicaoAtual > maxPos) posicaoAtual = maxPos;
                carrosselTrack.style.transform = `translateX(-${posicaoAtual * LARGURA_ITEM}px)`;
                atualizarSetas();
            };
            const btn = document.querySelector('.btn-adicionar');
            if (btn) btn.insertAdjacentElement('afterend', div);
            else carrosselTrack.appendChild(div);
        });
        atualizarSetas();
    }

    // ===================== 4. LOCALSTORAGE =====================
    function salvarImagensNoLocalStorage(id, imagens) { if (id) localStorage.setItem(`imagens_${id}`, JSON.stringify(imagens)); }
    function carregarImagensDoLocalStorage(id) { return id ? JSON.parse(localStorage.getItem(`imagens_${id}`) || '[]') : []; }

    // ===================== 5. CRIAR / EDITAR =====================
    async function criarDenuncia(evento) {
        evento.preventDefault();
        const descricao = document.getElementById('descricao').value.trim();
        const categoriaId = document.getElementById('categoria').value;
        const urgenciaId = document.getElementById('urgencia').value;
        const entidadeId = document.getElementById('entidade').value;
        if (!descricao || !categoriaId || !urgenciaId || !entidadeId) return alert('Preencha todos os campos.');
        if (fotosBase64.length === 0) return alert('Adicione pelo menos uma foto.');

        let local;
        if (localTemp && localTemp.latitude) local = { ...localTemp };
        else {
            const texto = document.getElementById('localizacao').value.trim();
            const { cidade, estado } = extrairCidadeEstadoDoTexto(texto);
            local = { cidade, estado, pais: "Brasil", logradouro: texto, numero: "", latitude: null, longitude: null };
        }

        const denuncia = {
            status_id: 3, categoria_id: parseInt(categoriaId), descricaoDenuncia: descricao,
            urgencia_id: parseInt(urgenciaId), data: new Date().toISOString().split('T')[0],
            entidade_id: parseInt(entidadeId), usuarioMorador_cpf: usuarioLogado.cpf,
            imagems: [], local, usuarioInstituicao_cpf: null, notaOrgao: "", prazo: "",
            afetados: 1, custo: "", progresso: [{ etapa: "Denúncia aceita", concluida: false }]
        };

        try {
            let idSalva;
            if (denunciaEditando) {
                await atualizarDenuncia(denunciaEditando, denuncia);
                idSalva = denunciaEditando;
            } else {
                const res = await fetch('http://localhost:3000/denuncias', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(denuncia)
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                idSalva = (await res.json()).id;
            }
            salvarImagensNoLocalStorage(idSalva, fotosBase64);
            document.getElementById('formDenuncia').reset();
            fotosBase64 = []; renderizarFotos(); denunciaEditando = null; localTemp = null;
            if (mapaInicializado) { mapa.setView([-15.7801, -47.9292], 4); marcador.setLatLng([-15.7801, -47.9292]); document.getElementById('localizacao').value = ''; }
            await carregarDenuncias();
            alert('Denúncia salva com sucesso!');
        } catch (err) { console.error(err); alert('Erro ao salvar. Verifique json-server na porta 3000.'); }
    }

    async function atualizarDenuncia(id, data) {
        const res = await fetch(`http://localhost:3000/denuncias/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, id: parseInt(id) })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }

    // ===================== 6. TABELA =====================
    async function carregarDenuncias() {
        try {
            const res = await fetch('http://localhost:3000/denuncias');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const denuncias = await res.json();
            const tbody = document.getElementById('tabelaDenuncias');
            if (!tbody) return;
            tbody.innerHTML = '';
            for (let d of denuncias) {
                let localStr = 'Sem local';
                if (d.local) {
                    if (d.local.logradouro) {
                        localStr = d.local.logradouro;
                        if (d.local.numero) localStr += `, ${d.local.numero}`;
                    } else if (d.local.cidade && d.local.cidade !== 'Não informada') localStr = d.local.cidade;
                }
                const catNome = getCategoriaNome(d.categoria_id);
                const entNome = getEntidadeNome(d.entidade_id);
                const dataFormatada = formatarData(d.data);
                tbody.innerHTML += `
                    <tr>
                        <td>${catNome}</td>
                        <td>${localStr}</td>
                        <td>${entNome}</td>
                        <td>${dataFormatada}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editarDenuncia('${d.id}')">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="excluirDenuncia('${d.id}')">Excluir</button>
                        </td>
                    </tr>
                `;
            }
        } catch (err) { console.error('Erro ao carregar denúncias:', err); }
    }

    async function excluirDenuncia(id) {
        if (!id || !confirm('Excluir esta denúncia?')) return;
        try {
            await fetch(`http://localhost:3000/denuncias/${id}`, { method: 'DELETE' });
            localStorage.removeItem(`imagens_${id}`);
            if (denunciaEditando == id) { denunciaEditando = null; document.getElementById('formDenuncia').reset(); fotosBase64 = []; renderizarFotos(); localTemp = null; }
            await carregarDenuncias();
        } catch (err) { console.error(err); }
    }

    window.editarDenuncia = async function(id) {
        try {
            const res = await fetch(`http://localhost:3000/denuncias/${id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const d = await res.json();
            denunciaEditando = id;
            document.getElementById('descricao').value = d.descricaoDenuncia || '';
            document.getElementById('categoria').value = d.categoria_id || '';
            document.getElementById('urgencia').value = d.urgencia_id || '';
            document.getElementById('entidade').value = d.entidade_id || '';
            let imagens = carregarImagensDoLocalStorage(id);
            if (!imagens.length && d.imagems) imagens = d.imagems;
            fotosBase64 = imagens;
            renderizarFotos();
            if (d.local) {
                localTemp = { ...d.local };
                if (mapaInicializado && d.local.latitude && d.local.longitude) {
                    await atualizarLocalSelecionado(d.local.latitude, d.local.longitude);
                    let end = d.local.logradouro || '';
                    if (d.local.numero) end += `, ${d.local.numero}`;
                    if (d.local.cidade && d.local.cidade !== 'Não informada') end += ` - ${d.local.cidade}/${d.local.estado}`;
                    document.getElementById('localizacao').value = end;
                } else if (mapaInicializado && d.local.logradouro) {
                    document.getElementById('searchEndereco').value = d.local.logradouro;
                    await buscarEndereco();
                } else {
                    document.getElementById('localizacao').value = d.local.logradouro || '';
                }
            } else { localTemp = null; document.getElementById('localizacao').value = ''; }
        } catch (err) { console.error(err); alert('Erro ao carregar dados para edição.'); }
    };
    window.excluirDenuncia = excluirDenuncia;

    // ===================== 7. INICIALIZAÇÃO =====================
    function iniciarFormulario() {
        inputSelecionarFotos = document.getElementById('inputFotos');
        carrosselTrack = document.getElementById('carrosselTrack');
        botaoSetaEsquerda = document.getElementById('setaEsq');
        botaoSetaDireita = document.getElementById('setaDir');
        const form = document.getElementById('formDenuncia');
        if (!inputSelecionarFotos || !carrosselTrack || !form) return console.error('Elementos não encontrados');

        inputSelecionarFotos.addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(arquivo => {
                if (!arquivo.type.startsWith('image/')) return;
                const leitor = new FileReader();
                leitor.onload = ev => {
                    fotosBase64.push(ev.target.result);
                    renderizarFotos();
                    const maxPos = Math.max(0, fotosBase64.length - QUANTIDADE_VISIVEL);
                    if (fotosBase64.length > QUANTIDADE_VISIVEL && posicaoAtual < maxPos) {
                        posicaoAtual = maxPos;
                        carrosselTrack.style.transform = `translateX(-${posicaoAtual * LARGURA_ITEM}px)`;
                        atualizarSetas();
                    }
                };
                leitor.readAsDataURL(arquivo);
            });
            inputSelecionarFotos.value = '';
        });

        botaoSetaEsquerda.addEventListener('click', () => moverCarrossel(-1));
        botaoSetaDireita.addEventListener('click', () => moverCarrossel(1));
        form.addEventListener('submit', criarDenuncia);

        const btnBuscar = document.getElementById('btnBuscar');
        const searchEndereco = document.getElementById('searchEndereco');
        if (btnBuscar) btnBuscar.addEventListener('click', buscarEndereco);
        if (searchEndereco) searchEndereco.addEventListener('keypress', e => { if (e.key === 'Enter') buscarEndereco(); });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        await carregarUsuarioLogado();
        await carregarDados();
        inicializarMapa();
        iniciarFormulario();
        await carregarDenuncias();
    });