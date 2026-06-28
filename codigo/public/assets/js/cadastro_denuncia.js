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
let usuariosMoradores = [];
let usuariosInstituicoes = [];
let infoPerfilMoradores = [];
let infoPerfilInstituicoes = [];
const BASE_URL = "http://localhost:3000";

// ===================== 1. CARREGAR DADOS AUXILIARES =====================
async function carregarDados() {
    try {
        const [categorias, entidades, urgencias, usuariosMor, usuariosInst, perfisMor, perfisInst] = await Promise.all([
            fetch(`${BASE_URL}/categorias`).then(res => {
                if (!res.ok) throw new Error("Erro ao carregar categorias");
                return res.json();
            }),
            fetch(`${BASE_URL}/entidades`).then(res => {
                if (!res.ok) throw new Error("Erro ao carregar entidades");
                return res.json();
            }),
            fetch(`${BASE_URL}/urgencias`).then(res => {
                if (!res.ok) throw new Error("Erro ao carregar urgências");
                return res.json();
            }),
            fetch(`${BASE_URL}/usuariosMoradores`).then(res => {
                if (!res.ok) throw new Error("Erro ao carregar usuariosMoradores");
                return res.json();
            }),
            fetch(`${BASE_URL}/usuariosInstituicoes`).then(res => {
                if (!res.ok) throw new Error("Erro ao carregar usuariosInstituicoes");
                return res.json();
            }),
            fetch(`${BASE_URL}/infoPerfilMoradores`).then(res => {
                if (!res.ok) throw new Error("Erro ao carregar infoPerfilMoradores");
                return res.json();
            }),
            fetch(`${BASE_URL}/infoPerfilInstituicoes`).then(res => {
                if (!res.ok) throw new Error("Erro ao carregar infoPerfilInstituicoes");
                return res.json();
            })
        ]);
        categoriasLista = categorias;
        entidadesLista = entidades;
        usuariosMoradores = usuariosMor;
        usuariosInstituicoes = usuariosInst;
        infoPerfilMoradores = perfisMor;
        infoPerfilInstituicoes = perfisInst;
        preencherSelect('categoria', categorias, 'nome', 'id');
        preencherSelect('urgencia', urgencias, 'tipo', 'id');
        preencherSelect('entidade', entidades, 'tipo', 'id');
    } catch (erro) {
        categoriasLista = [
            { id: 1, nome: "Buraco" }, { id: 2, nome: "Problema de esgoto" },
            { id: 3, nome: "Deslizamento" }, { id: 4, nome: "Falta de limpeza" },
            { id: 5, nome: "Falta de iluminação" }
        ];
        entidadesLista = [
            { id: 1, tipo: "Todos" }, { id: 2, tipo: "Prefeitura" }, { id: 3, tipo: "Empresa privada" }
        ];
        preencherSelect('categoria', categoriasLista, 'nome', 'id');
        preencherSelect('urgencia', [
            { id: 1, tipo: "Baixa" }, { id: 2, tipo: "Média" }, { id: 3, tipo: "Alta" }
        ], 'tipo', 'id');
        preencherSelect('entidade', entidadesLista, 'tipo', 'id');
    }
}

async function carregarUsuarioLogado() {
    try {
        const resposta = await fetch('/usuarioLogado');
        if (!resposta.ok) throw new Error('Erro ao carregar db.json');
        const dados = await resposta.json();
        usuarioLogado.cpf = dados.cpf;
    } catch (erro) {
        mostrarMensagem('Falha ao carregar usuário logado. Usando CPF fixo para testes.', erro);
        usuarioLogado.cpf = '000.000.000-00';
    }
}

function configurarInterfaceUsuario() {

    const ehMorador = usuariosMoradores.some(
        usuario => usuario.cpf === usuarioLogado.cpf
    );

    const ehInstituicao = usuariosInstituicoes.some(
        usuario => usuario.cpf === usuarioLogado.cpf
    );

    if (ehMorador) {

        const perfil = infoPerfilMoradores.find(
            perfil => perfil.usuarioMorador_cpf === usuarioLogado.cpf
        );

        if (perfil?.fotoPerfil) {
            document.querySelectorAll(".avatar").forEach(img => {
                img.src = perfil.fotoPerfil;
            });
        }

        // Header
        const btnNova = document.getElementById("btnNovaDenuncia");
        if (btnNova) btnNova.textContent = "Faça sua denúncia";

        const btnMinhas = document.getElementById("btnMinhasDenuncias");
        if (btnMinhas) btnMinhas.textContent = "Minhas denúncias";

        const btnOutras = document.getElementById("btnOutrasDenuncias");
        if (btnOutras) btnOutras.style.display = "";

    } else if (ehInstituicao) {

        const perfil = infoPerfilInstituicoes.find(
            perfil => perfil.usuarioInstituicao_cpf === usuarioLogado.cpf
        );

        if (perfil?.fotoPerfil) {
            document.querySelectorAll(".avatar").forEach(img => {
                img.src = perfil.fotoPerfil;
            });
        }

        // Header
        const btnNova = document.getElementById("btnNovaDenuncia");
        if (btnNova) btnNova.textContent = "Denúncias";

        const btnMinhas = document.getElementById("btnMinhasDenuncias");
        if (btnMinhas) btnMinhas.textContent = "Minhas obras";

        const btnOutras = document.getElementById("btnOutrasDenuncias");
        if (btnOutras) btnOutras.style.display = "none";
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
    if (!document.getElementById('mapa')) return;

    const posicaoInicial = [-15.7801, -47.9292];

    mapa = L.map('mapa').setView(posicaoInicial, 4);

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution: '&copy; OpenStreetMap'
        }
    ).addTo(mapa);

    marcador = L.marker(
        posicaoInicial,
        { draggable: true }
    ).addTo(mapa);

    mapa.on('click', e =>
        atualizarLocalSelecionado(
            e.latlng.lat,
            e.latlng.lng
        )
    );

    marcador.on('dragend', e => {
        const pos = e.target.getLatLng();

        atualizarLocalSelecionado(
            pos.lat,
            pos.lng
        );
    });

    mapaInicializado = true;
}

async function buscarEnderecoPorCoordenada(lat, lng) {
    const resposta = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );

    return await resposta.json();
}
async function atualizarLocalSelecionado(lat, lng) {
    if (!mapaInicializado) return;

    marcador.setLatLng([lat, lng]);
    mapa.setView([lat, lng], 15);

    try {
        const data =
            await buscarEnderecoPorCoordenada(
                lat,
                lng
            );

        const addr = data.address || {};

        document.getElementById(
            'localizacao'
        ).value =
            data.display_name ||
            `${lat}, ${lng}`;

        localTemp = {
            cidade:
                addr.city ||
                addr.town ||
                addr.village ||
                "Não informada",

            estado:
                addr.state_code ||
                addr.state ||
                "XX",

            pais:
                addr.country ||
                "Brasil",

            logradouro:
                addr.road ||
                addr.suburb ||
                addr.neighbourhood ||
                "",

            numero:
                addr.house_number ||
                "",

            latitude: lat,
            longitude: lng
        };

    } catch (erro) {

        mostrarMensagem(
            'Erro ao buscar endereço',
            'warning'
        );

        localTemp = {
            cidade: "Não informada",
            estado: "XX",
            pais: "Brasil",
            logradouro: "",
            numero: "",
            latitude: lat,
            longitude: lng
        };
    }
}

async function buscarEndereco() {

    const endereco =
        document
            .getElementById('searchEndereco')
            .value
            .trim();

    if (!endereco) return;

    try {

        const resposta = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`
        );

        const resultado =
            await resposta.json();

        if (!resultado.length) {
            mostrarMensagem(
                'Endereço não encontrado.',
                'warning'
            );
            return;
        }

        const local = resultado[0];

        await atualizarLocalSelecionado(
            Number(local.lat),
            Number(local.lon)
        );

    } catch {

        mostrarMensagem(
            'Erro ao buscar endereço.',
            'danger'
        );
    }
}

function extrairCidadeEstadoDoTexto(texto) {

    return {
        cidade:
            texto.match(
                /,\s*([A-Za-zÀ-ú\s]+?)\s*-\s*[A-Z]{2}/
            )?.[1]?.trim()
            || "Não informada",

        estado:
            texto.match(
                /-\s*([A-Z]{2})/
            )?.[1]
            || "XX"
    };
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

// ===================== 5. CRIAR =====================
async function criarDenuncia(evento) {
    evento.preventDefault();
    const descricao = document.getElementById('descricao').value.trim();
    const categoriaId = document.getElementById('categoria').value;
    const urgenciaId = document.getElementById('urgencia').value;
    const entidadeId = document.getElementById('entidade').value;
    if (!descricao || !categoriaId || !urgenciaId || !entidadeId) return mostrarMensagem('Preencha todos os campos.', 'warning');
    if (fotosBase64.length === 0) return mostrarMensagem('Adicione pelo menos uma foto.');

    let local;
    if (localTemp && localTemp.latitude) local = { ...localTemp };
    else {
        const texto = document.getElementById('localizacao').value.trim();
        const { cidade, estado } = extrairCidadeEstadoDoTexto(texto);
        local = { cidade, estado, pais: "Brasil", logradouro: texto, numero: "", latitude: null, longitude: null };
    }

    const denuncia = {
        status_id: 3, categoria_id: parseInt(categoriaId), urgencia_id: parseInt(urgenciaId),
        entidade_id: parseInt(entidadeId), denunciante: usuarioLogado.cpf, usuarioInstituicao_cpf: "",
        descricaoDenuncia: descricao, imagens: fotosBase64, dataPublicacao: new Date().toLocaleDateString('pt-BR'),
        dataResolucao: null, local, afetados: 1, notaOrgao: "", prazo: "", custo: "", notaCusto: "", comentarios: [],
        progresso: [{ etapa: "Denúncia aceita", tipo: "fixo", concluida: false, arquivo: { nome: "", url: "" } }, { etapa: "Equipe enviada ao local", tipo: "fixo", concluida: false, arquivo: { nome: "", url: "" } }, { etapa: "Planejamento e previsões", tipo: "fixo", concluida: false, arquivo: { nome: "", url: "" } }, { etapa: "Manutenção em andamento", tipo: "fixo", concluida: false, arquivo: { nome: "", url: "" } }, { etapa: "Obra finalizada", tipo: "fixo",  concluida: false, arquivo: { nome: "", url: "" } }]
    };

    try {
        let idSalva;
        if (denunciaEditando) {
            await atualizarDenuncia(denunciaEditando, denuncia);
            idSalva = denunciaEditando;
        } else {
            const jsonString = JSON.stringify(denuncia);

            mostrarMensagem(
                "Payload:",
                Math.round(jsonString.length / 1024),
                "KB"
            );
            const res = await fetch('http://localhost:3000/denuncias', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(denuncia)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            idSalva = (await res.json()).id;
        }
        document.getElementById('formDenuncia').reset();
        fotosBase64 = []; renderizarFotos(); denunciaEditando = null; localTemp = null;
        if (mapaInicializado) { mapa.setView([-15.7801, -47.9292], 4); marcador.setLatLng([-15.7801, -47.9292]); document.getElementById('localizacao').value = ''; }
        mostrarMensagem('Denúncia salva com sucesso!');
    } catch (err) { mostrarMensagem(err); mostrarMensagem('Erro ao salvar. Verifique json-server na porta 3000.'); }
}


// ===================== 7. INICIALIZAÇÃO =====================
function iniciarFormulario() {
    inputSelecionarFotos = document.getElementById('inputFotos');
    carrosselTrack = document.getElementById('carrosselTrack');
    botaoSetaEsquerda = document.getElementById('setaEsq');
    botaoSetaDireita = document.getElementById('setaDir');
    const form = document.getElementById('formDenuncia');
    if (!inputSelecionarFotos || !carrosselTrack || !form) return mostrarMensagem('Elementos não encontrados', 'error');
    inputSelecionarFotos.addEventListener('change', async (e) => {

        for (const arquivo of Array.from(e.target.files)) {
            const TAMANHO_MAXIMO = 10 * 1024 * 1024;

            if (arquivo.size > TAMANHO_MAXIMO) {
                mostrarMensagem(`${arquivo.name} possui mais de 10MB`, 'warning');
                continue;
            }

            if (!arquivo.type.startsWith('image/')) {
                continue;
            }

            try {

                const imagemCompactada =
                    await converterImagemBase64(arquivo);
                mostrarMensagem(
                    "Tamanho Base64:",
                    Math.round(imagemCompactada.length / 1024),
                    "KB"
                );

                if (fotosBase64.length >= 2) {
                    mostrarMensagem("Máximo de 2 fotos.", 'warning');
                    break;
                }
                fotosBase64.push(imagemCompactada);

                renderizarFotos();

                const maxPos = Math.max(
                    0,
                    fotosBase64.length - QUANTIDADE_VISIVEL
                );

                if (
                    fotosBase64.length > QUANTIDADE_VISIVEL &&
                    posicaoAtual < maxPos
                ) {
                    posicaoAtual = maxPos;

                    carrosselTrack.style.transform =
                        `translateX(-${posicaoAtual * LARGURA_ITEM}px)`;

                    atualizarSetas();
                }

            } catch (erro) {

                mostrarMensagem(
                    'Erro ao processar imagem:',
                    erro
                );

            }
        }

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

function converterImagemBase64(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();

        leitor.onload = () => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement("canvas");

                canvas.width = 400;
                canvas.height = 400;

                canvas
                    .getContext("2d")
                    .drawImage(img, 0, 0, 400, 400);

                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        0.3
                    )
                );
            };

            img.src = leitor.result;
        };

        leitor.onerror = reject;
        leitor.readAsDataURL(arquivo);
    });
}


function mostrarMensagem(texto, tipo = 'info') {
    const mensagemDiv = document.getElementById('mensagemGlobal');

    mensagemDiv.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    setTimeout(() => {
        const alerta = mensagemDiv.querySelector('.alert');
        if (alerta) {
            alerta.classList.remove('show');
            setTimeout(() => alerta.remove(), 300);
        }
    }, 5000);
}
document.addEventListener('DOMContentLoaded', async () => {
    await carregarUsuarioLogado();
    await carregarDados();
    configurarInterfaceUsuario();
    inicializarMapa();
    iniciarFormulario();
});