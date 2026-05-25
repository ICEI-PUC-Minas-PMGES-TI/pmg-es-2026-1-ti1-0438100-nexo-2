const BASE_URL = "http://localhost:3000";
 
async function init() {
    // Busca todos os objetos
    const [denuncias, categorias, urgencias, status, usuariosMoradores, usuariosInstituicoes, instituicao, usuarioLogado, infoPerfilMoradores, infoPerfilInstituicoes, comentarios] = await Promise.all([
        fetch(`${BASE_URL}/denuncias`).then(res => res.json()),
        fetch(`${BASE_URL}/categorias`).then(res => res.json()),
        fetch(`${BASE_URL}/urgencias`).then(res => res.json()),
        fetch(`${BASE_URL}/status`).then(res => res.json()),
        fetch(`${BASE_URL}/usuariosMoradores`).then(res => res.json()),
        fetch(`${BASE_URL}/usuariosInstituicoes`).then(res => res.json()),
        fetch(`${BASE_URL}/instituicao`).then(res => res.json()),
        fetch(`${BASE_URL}/usuarioLogado`).then(res => res.json()),
        fetch(`${BASE_URL}/infoPerfilMoradores`).then(res => res.json()),
        fetch(`${BASE_URL}/infoPerfilInstituicoes`).then(res => res.json()),
        fetch(`${BASE_URL}/comentarios`).then(res => res.json()),
    ]);
    const data = { denuncias, categorias, urgencias, status, usuariosMoradores, usuariosInstituicoes, instituicao, usuarioLogado, infoPerfilMoradores, infoPerfilInstituicoes, comentarios };
    

    //Referência aos elementos HTML
    const date = document.getElementById("date");
    const localizacao = document.getElementById("location");
    const prazo = document.getElementById("term");
    const afetados = document.getElementById("affected");
    const custo = document.getElementById("cost");
    const descricao = document.getElementById("texto-descricao");
    const nota_descricao = document.getElementById("texto-nota-descricao");
    const progresso = document.querySelector(".progress-bar");
    const fileInput = document.getElementById("file-input");
    const localImg = document.getElementById("local-imagens");
    const btn_right = document.getElementById("btn-img-right");
    const btn_left = document.getElementById("btn-img-left");
    const modal = document.getElementById("modal");
    const fade = document.getElementById("fade");
    const btn_close_modal = document.getElementById("btn-close-modal");
    const inputDate = document.getElementById("input-date");
    const inputCost = document.getElementById("input-cost");
    const btnStart = document.getElementById("btn-start");
    const btnExit = document.getElementById("btn-exit");
    const btn_avanca = document.getElementById("btn-avanca");
    const btn_retorna = document.getElementById("btn-retorna");
    const btn_editar = document.getElementById("btn-editar-info");
    const btn_confirma = document.getElementById("btn-confirm");
    const btn_acompanha = document.getElementById("btn-follow");
    const btn_desacompanha = document.getElementById("btn-unfollow");
    const form = document.getElementById("formPrev");
    const avatars = document.querySelectorAll(".avatar");
    const conteudo_comentarios = document.getElementById("conteudo-comentarios");
    const inputComentarios = document.getElementById("input-comentario");
    const btn_comentario = document.getElementById("btn-comentario");

    // Função auxiliar para persistir alterações na denúncia
    async function salvarDenuncia() {
        await fetch(`${BASE_URL}/denuncias/${dados_denuncia.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados_denuncia)
        });
    }

 //----------------------------------------------------IMAGENS DA DENÚNCIA-------------------------------------------------------//
    // Lógica das imagens da denúncia
    const dados_denuncia = data.denuncias[0];
    const imagens_denuncia = dados_denuncia.imagens;
        // Lógica para alocar imagens em suas divs
    for(let i=0; i<imagens_denuncia.length; i++){
        const divImg = document.createElement("div");
        divImg.id = `img${i+1}`;
        localImg.appendChild(divImg);
        const img = document.createElement("img");
        img.classList.add("img-details");
        img.src = imagens_denuncia[i];
        img.classList.add("rounded-2");
        divImg.appendChild(img);
    };
        // Lógica para 5 ou mais imagens (Inclui botões de navegação)
    if(imagens_denuncia.length>=5){
        btn_right.classList.remove("d-none");
        btn_left.classList.remove("d-none");
        localImg.classList.remove("mx-3");
    };
        // Função para atualizar as imagens visíveis
    let inicio_img = 1;
    function atualiza_img(){
        for(let i = 0; i<imagens_denuncia.length; i++){
            const divImg_visivel = document.getElementById(`img${i+1}`);
            divImg_visivel.classList.add("d-none");
        };
        if(imagens_denuncia.length>4){
            for(let i=inicio_img; i<(inicio_img+4); i++){
                const div_visivel = document.getElementById(`img${i}`);
                div_visivel.classList.remove("d-none");
            }
        }else{  
            for(let i=inicio_img; i<(imagens_denuncia.length+1); i++){
                const div_visivel = document.getElementById(`img${i}`);
                div_visivel.classList.remove("d-none");
            };
        };
    };
    atualiza_img();

        // Botões de navegação das imagens e setas do teclado
    btn_right.addEventListener("click", () => {
        if(inicio_img<(imagens_denuncia.length-3)){
            inicio_img+=1;
            atualiza_img();
        };
    });
    btn_left.addEventListener("click", () => {
        if(inicio_img>1){
            inicio_img-=1;
            atualiza_img();
        };
    });

    document.addEventListener("keydown", (event) => {
    if(event.key === "ArrowRight"){
        btn_right.click();
    }
    if(event.key === "ArrowLeft"){
        btn_left.click();
    }

/*----------------------------------------------------COMENTÁRIOS--------------------------------------------------------------------*/
    function carregaComentarios(){
        conteudo_comentarios.innerHTML = ""
        data.comentarios.forEach(comentario => {
        let usuario = usuariosMoradores.find(u => Number(u.cpf) === Number(comentario.usuario));
        if(!usuario){
            usuario = usuariosInstituicoes.find(u => Number(u.cpf) === Number(comentario.usuario));
        }
        const card_comentario = document.createElement("div");
        card_comentario.classList.add("comentario");
        const foto = document.createElement("img");
        foto.classList.add("foto-perfil");
        foto.src = `imgs/foto_perfil.jpg`;
        const nome = document.createElement("h4");
        nome.textContent = usuario ? usuario.nome_usuario : "Usuário desconhecido";
        const mensagem = document.createElement("p");
        mensagem.textContent = comentario.mensagem;
        const data = document.createElement("span");
        data.textContent = `${comentario.data} às ${comentario.hora}`;

        card_comentario.appendChild(foto);
        card_comentario.appendChild(nome);
        card_comentario.appendChild(mensagem);
        card_comentario.appendChild(data);
        conteudo_comentarios.appendChild(card_comentario);
    })
}
carregaComentarios()

});
//------------------------------------------------INFORMAÇÕES DA DENÚNCIA-------------------------------------------------------//
//Referências aos objetos e chaves estrangeiras do JSON
const checkpoints_denuncia = dados_denuncia.progresso;
const categoria_denuncia = data.categorias.find(c => Number(c.id) === Number(dados_denuncia.categoria_id));
const urgencia_denuncia = data.urgencias.find(u => Number(u.id) === Number(dados_denuncia.urgencia_id));
const status_denuncia = data.status.find(s => Number(s.id) === Number(dados_denuncia.status_id));
const denunciante = data.usuariosMoradores.find(um => Number(um.cpf) === Number(dados_denuncia.denunciante));
const cpfLogado = data.usuarioLogado.cpf;
const tipoUsuario = data.usuariosInstituicoes.find(u => Number(u.cpf) === Number(cpfLogado)) ? "instituicao": "morador";

//Mostra informações fixas (por enquanto)
date.innerHTML = `Data da denúncia: ${dados_denuncia.data}`;
localizacao.innerHTML = `Localização: ${dados_denuncia.local.cidade}, ${dados_denuncia.local.estado}`;
descricao.innerHTML = `${dados_denuncia.descricaoDenuncia}`;
nota_descricao.innerHTML = `${dados_denuncia.notaOrgao}`;

//Mostra a imagem de perfil dependendo do usuário
caminho_fotoPerfil = ""
if(tipoUsuario==="morador"){
    const perfilMorador = data.infoPerfilMoradores.find(p => Number(p.usuarioMorador_cpf) === Number(cpfLogado));
    caminho_fotoPerfil = perfilMorador.fotoPerfil;
}else{
    const perfilInstituicao = data.infoPerfilInstituicoes.find(p => Number(p.usuarioInstituicao_cpf) === Number(cpfLogado));
    caminho_fotoPerfil = perfilInstituicao.fotoPerfil;
}
avatars.forEach(avatar => {
    avatar.style.backgroundImage = `url(${caminho_fotoPerfil})`
});

//Mostra a localização exata da denúncia no mapa
const mapa = document.getElementById("mapa-detalhes");
const endereco_denuncia = `${dados_denuncia.local.logradouro}, ${dados_denuncia.local.numero}, ${dados_denuncia.local.cidade}, ${dados_denuncia.local.estado}, ${dados_denuncia.local.pais}`;
mapa.src = `https://www.google.com/maps?q=${encodeURIComponent(endereco_denuncia)}&output=embed`;

//Função para atualizar o menu de informações da denúncia
function atualiza_info() {
    const usuarioInstituicao = data.usuariosInstituicoes.find(ui => Number(ui.cpf) === Number(dados_denuncia.usuarioInstituicao_cpf));
    const instituicao = data.instituicao.find(i => Number(i.id) === Number(usuarioInstituicao.instituicao_id));
    document.getElementById("title-details").textContent = `${categoria_denuncia.nome} na ${dados_denuncia.local.logradouro}, ${dados_denuncia.local.numero}`;
    document.getElementById("category").textContent = `Categoria: ${categoria_denuncia.nome}`;
    document.getElementById("urgency").textContent = `Urgência: ${urgencia_denuncia.tipo}`;
    document.getElementById("user").textContent = `Denunciante: ${denunciante.nome_usuario}`
    document.getElementById("resp").textContent = `Responsável:`;
    document.getElementById("organ").textContent = `Instituição:`;
    prazo.innerHTML = `Prazo estimado:`;
    custo.innerHTML = `Custo estimado:`;
    afetados.innerHTML = `Pessoas afetadas: ${dados_denuncia.afetados}`;
    //Alterações quando assume denúncia e quando define prazo e custo    
    if (checkpoints_denuncia[0].concluida === true) {
        document.getElementById("resp").textContent = `Responsável: ${usuarioInstituicao.nome_usuario}`;
        document.getElementById("organ").textContent = `Instituição: ${instituicao.nome}`;
        if(checkpoints_denuncia[2].concluida === true){
            prazo.innerHTML = `Prazo estimado: ${dados_denuncia.prazo}`;
            custo.innerHTML = `Custo estimado: ${dados_denuncia.custo}`;
        };
    }
    // Controla o status da denúncia
    if(dados_denuncia.status_id !== 1){
        if(checkpoints_denuncia[4].concluida === true){
            dados_denuncia.status_id = 4
        } else if(checkpoints_denuncia[0].concluida === true){
            dados_denuncia.status_id = 2
        } else {
            dados_denuncia.status_id = 3
        }
    };

    //Atualiza as informações sobre status (chave estrangeira)
    const status_denuncia = data.status.find(s => Number(s.id) === Number(dados_denuncia.status_id));
    document.getElementById("status").textContent = `Status: ${status_denuncia.status}`;

        //Status da denúncia e a implicação nos botões
    if(dados_denuncia.status_id === 1){
        btnExit.classList.add("d-none")
        btnStart.classList.add("d-none")
    } else if(dados_denuncia.status_id !== 3 && tipoUsuario==="instituicao"){
        btn_editar.classList.remove("d-none");
        btn_avanca.classList.remove("d-none");
        btn_retorna.classList.remove("d-none");
    } else {
        btn_avanca.classList.add("d-none");
        btn_retorna.classList.add("d-none");
        btn_editar.classList.add("d-none");
    };
    if(dados_denuncia.status_id === 2){
        btnStart.classList.add("d-none");
    };
};

if(dados_denuncia.notaOrgao != ""){
    nota_descricao.classList.remove("d-none");
    const nota_titulo = document.getElementById("nota-descricao");
    nota_titulo.classList.remove("d-none");
;}

if(tipoUsuario === "morador"){
    btnStart.classList.add("d-none");
    btn_avanca.classList.add("d-none");
    btn_retorna.classList.add("d-none");
    btn_acompanha.classList.remove("d-none");
    if(checkpoints_denuncia[4].concluida===true && cpfLogado === dados_denuncia.usuarioMorador_cpf){
        btn_confirma.classList.remove("d-none");
    };
}

//-----------------------------------------------ANDAMENTO DA DENÚNCIA----------------------------------------------------------//

//Função para atualizar o status dos checkpoints da denúncia
function renderizar_checkpoints() {
    const usuarioInstituicao = data.usuariosInstituicoes.find(ui => Number(ui.cpf) === Number(dados_denuncia.usuarioInstituicao_cpf));
    const instituicao = data.instituicao.find(i => Number(i.id) === Number(usuarioInstituicao.instituicao_id));
    //Nomeia os checkpoints
    for (let i = 0; i < (checkpoints_denuncia.length); i++) {
        document.querySelector(`#check${i + 1} span`).textContent = `${checkpoints_denuncia[i].etapa} | `;
    };

    for (let i = 0; i < (checkpoints_denuncia.length); i++) {
        const checkpoint_atual = document.querySelector(`#check${i + 1}`);
        if (checkpoints_denuncia[i].concluida === true) {
            document.querySelector(`#check${i + 1} svg circle`).setAttribute("fill", "black");
            checkpoint_atual.classList.remove("bg-ff5900");
            checkpoint_atual.classList.remove("rounded-5");
            checkpoint_atual.classList.remove("pt-1");
            checkpoint_atual.classList.remove("pb-2");
            checkpoint_atual.classList.remove("px-2");
            checkpoint_atual.classList.remove("me-2");
            checkpoint_atual.classList.remove("my-2");
            checkpoint_atual.classList.remove("text-light");
            document.querySelector(`#check${i + 1} svg circle`).setAttribute("stroke", "black");
        };
        if (checkpoints_denuncia[i].concluida === false) {
            if ((i > 0)&&(checkpoints_denuncia[i-1].concluida === true)) {
                document.querySelector(`#check${i + 1} svg circle`).setAttribute("fill", "white");
                checkpoint_atual.classList.add("bg-ff5900");
                checkpoint_atual.classList.add("rounded-5");
                checkpoint_atual.classList.add("pt-1");
                checkpoint_atual.classList.add("pb-2");
                checkpoint_atual.classList.add("px-2");
                checkpoint_atual.classList.add("me-2");
                checkpoint_atual.classList.add("my-2");
                checkpoint_atual.classList.add("text-light");
                document.querySelector(`#check${i + 1} svg circle`).setAttribute("stroke", "white");
            } else {
            document.querySelector(`#check${i + 1} svg circle`).setAttribute("fill", "white");
            checkpoint_atual.classList.remove("bg-ff5900");
            checkpoint_atual.classList.remove("rounded-5");
            checkpoint_atual.classList.remove("pt-1");
            checkpoint_atual.classList.remove("pb-2");
            checkpoint_atual.classList.remove("px-2");
            checkpoint_atual.classList.remove("me-2");
            checkpoint_atual.classList.remove("my-2");
            checkpoint_atual.classList.remove("text-light");
            document.querySelector(`#check${i + 1} svg circle`).setAttribute("stroke", "black");
            };
        };

        const link = document.querySelector(`#check${i + 1} a`);
        // Renderiza arquivos do progresso
        if((checkpoints_denuncia[i].arquivo.nome !== "")&&(checkpoints_denuncia[i].concluida===true)){
            link.href = checkpoints_denuncia[i].arquivo.url;
            link.textContent = checkpoints_denuncia[i].arquivo.nome;
            link.target = "_blank";
        } else {
            link.href = "";
            link.textContent = "";
            link.target = "";
        }
    };
    if(checkpoints_denuncia[0].concluida === true){
        document.querySelector(`#check1 span`).textContent = `Denuncia aceita | ${usuarioInstituicao.nome_usuario}, ${instituicao.nome}`;
    };
};

// Função da lógica da barra de progresso dos checkpoints da denúncia
function renderiza_progresso() {
    let qt_concluidas = 0;
    for (let j = 1; j < checkpoints_denuncia.length; j++) {
        if (checkpoints_denuncia[j].concluida == true) {
            qt_concluidas += 1;
        };
    };
    let porcentagem = qt_concluidas / (checkpoints_denuncia.length - 1) * 100;
    progresso.style.width = `${porcentagem}%`;
};

renderizar_checkpoints();
atualiza_info();
renderiza_progresso();

//Lógica do botão de avança checkpoint + anexa arquivo + modal de custo e prazo
fade.addEventListener("click", () => {
    modal.classList.add("d-none");
    fade.classList.add("d-none");

            });
document.getElementById("btn-avanca").addEventListener("click", () => {
    if(checkpoints_denuncia[4].concluida === false){
        if (checkpoints_denuncia[0].concluida === false) {
            return;
        }

        if(checkpoints_denuncia[1].concluida === true && checkpoints_denuncia[2].concluida === false){
                modal.classList.remove("d-none");
                fade.classList.remove("d-none");
        } else {
            fileInput.click();
        };
    };
});
    
inputCost.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor === "") {
        valor = "0";
    }
    valor = (parseInt(valor) / 100);
    valor = valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
    });
    e.target.value = valor;
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    if(!inputDate.value || !inputCost.value){
        alert("Preencha todos os campos!");
        return;
    };

    modal.classList.add("d-none");
    fade.classList.add("d-none");
    const dataFormatada = inputDate.value.split("-").reverse().join("/");
    dados_denuncia.prazo = dataFormatada;
    dados_denuncia.custo = inputCost.value;
    fileInput.click();
});

fileInput.addEventListener("change", async (event) => {
    const arquivo = event.target.files[0];
    if (!arquivo) {
        return;
    };
    for (let i = 0; i < (checkpoints_denuncia.length); i++) {
        if ((checkpoints_denuncia[i].concluida === false) && (checkpoints_denuncia[0].concluida === true)) {
            checkpoints_denuncia[i].concluida = true;
            const UrlArquivo = URL.createObjectURL(arquivo);
            dados_denuncia.progresso[i].arquivo.url = UrlArquivo
            dados_denuncia.progresso[i].arquivo.nome = arquivo.name
            break;
        };
    };
    await salvarDenuncia();
    renderizar_checkpoints();
    renderiza_progresso();
    atualiza_info();
});

// Lógica do botão retorna checkpoint + remove arquivo
document.getElementById("btn-retorna").addEventListener("click", async () => {
    for (let i = 0; i < (checkpoints_denuncia.length); i++) {
        if ((checkpoints_denuncia[i].concluida === true) && (i===4 || (checkpoints_denuncia[i + 1].concluida === false)) && (checkpoints_denuncia[0].concluida === true) && (i!=0)) {
            checkpoints_denuncia[i].concluida = false;
            checkpoints_denuncia[i].arquivo.url = "";
            checkpoints_denuncia[i].arquivo.nome = "";
            break;
        };
    };
    await salvarDenuncia();
    renderizar_checkpoints();
    renderiza_progresso();
    atualiza_info();
});

// Lógica dos botões de assumir e abandonar ocorrência, confirmar conclusão e acompanhar denúncia
btnStart.addEventListener("click", async () => {
    dados_denuncia.usuarioInstituicao_cpf = cpfLogado
    checkpoints_denuncia[0].concluida = true;
    btnStart.classList.add("d-none");
    btnExit.classList.remove("d-none");
    await salvarDenuncia();
    renderizar_checkpoints();
    atualiza_info();
});
btnExit.addEventListener("click", async () => {
    for(let i = 0; i<checkpoints_denuncia.length; i++){
        checkpoints_denuncia[i].concluida = false;
        checkpoints_denuncia[i].arquivo.url="";
        checkpoints_denuncia[i].arquivo.nome="";
    }
    btnStart.classList.remove("d-none");
    btnExit.classList.add("d-none");
    await salvarDenuncia(); 
    renderizar_checkpoints();
    atualiza_info();
    renderiza_progresso()
});

btn_confirma.addEventListener("click", async () => {
    dados_denuncia.status_id = 1;
    await salvarDenuncia();
    atualiza_info();
    btn_confirma.classList.add("d-none");
})

btn_acompanha.addEventListener("click", async () => {
    dados_denuncia.afetados+=1;
    await salvarDenuncia();
    atualiza_info();
    btn_acompanha.classList.add("d-none");
    btn_desacompanha.classList.remove("d-none");
})

btn_desacompanha.addEventListener("click", async () => {
    dados_denuncia.afetados-=1;
    await salvarDenuncia();
    atualiza_info();
    btn_acompanha.classList.remove("d-none");
    btn_desacompanha.classList.add("d-none");
})
}
init();