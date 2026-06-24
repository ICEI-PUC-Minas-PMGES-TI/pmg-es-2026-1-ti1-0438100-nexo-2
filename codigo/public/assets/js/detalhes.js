const BASE_URL = "http://localhost:3000";
const params = new URLSearchParams(window.location.search);
const denunciaId = params.get("id");

async function init() {
    // Busca todos os objetos
    const [denuncias, categorias, urgencias, status, usuariosMoradores, usuariosInstituicoes, instituicoes, usuarioLogado, infoPerfilMoradores, infoPerfilInstituicoes] = await Promise.all([
        fetch(`${BASE_URL}/denuncias`).then(res => res.json()),
        fetch(`${BASE_URL}/categorias`).then(res => res.json()),
        fetch(`${BASE_URL}/urgencias`).then(res => res.json()),
        fetch(`${BASE_URL}/status`).then(res => res.json()),
        fetch(`${BASE_URL}/usuariosMoradores`).then(res => res.json()),
        fetch(`${BASE_URL}/usuariosInstituicoes`).then(res => res.json()),
        fetch(`${BASE_URL}/instituicoes`).then(res => res.json()),
        fetch(`${BASE_URL}/usuarioLogado`).then(res => res.json()),
        fetch(`${BASE_URL}/infoPerfilMoradores`).then(res => res.json()),
        fetch(`${BASE_URL}/infoPerfilInstituicoes`).then(res => res.json()),
    ]);
    const data = { denuncias, categorias, urgencias, status, usuariosMoradores, usuariosInstituicoes, instituicoes, usuarioLogado, infoPerfilMoradores, infoPerfilInstituicoes };
    const url_DataMsg = "http://localhost:3000/mensagensChat";

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
    const modal_previsao = document.getElementById("modal-previsao");
    const modal_avaliacao = document.getElementById("modal-avaliacao");
    const fade = document.getElementById("fade");
    const btn_close_modal_prev = document.getElementById("btn-close-modal-prev");
    const btn_close_modal_aval = document.getElementById("btn-close-modal-aval");
    const btnCancelarAval = document.getElementById("btn-cancelar-aval");
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
    const form_prev = document.getElementById("formPrev");
    const form_aval = document.getElementById("formAval");
    const range5 = document.getElementById("range5");
    const textAvaliacao = document.getElementById("text-avaliacao");
    const avatars = document.querySelectorAll(".avatar");
    const conteudo_comentarios = document.getElementById("conteudo-comentarios");
    const inputComentarios = document.getElementById("input-comentario");
    const btn_comentario = document.getElementById("btn-comentario");
    const inputChat = document.getElementById("input-chat");
    const btn_chat = document.getElementById("btn-chat");
    const sendMsg = document.getElementById("send-msg")
    const sendCom = document.getElementById("novo-comentario")
    const nav1 = document.querySelectorAll(".nav-link-1")
    const nav2 = document.querySelectorAll(".nav-link-2")
    const nav3 = document.querySelectorAll(".nav-link-3")
    const nav4 = document.querySelectorAll(".nav-link-4")
    const footerlink4 = document.querySelector(".footer-link-4")
    const iconlink2 = document.querySelector(".icon-link-2")
    const iconNotaCusto = document.getElementById("icon-nota-custo");

    // Função auxiliar para persistir alterações na denúncia
    async function salvarDenuncia() {
        await fetch(`${BASE_URL}/denuncias/${dados_denuncia.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados_denuncia)
        });
    }

    async function concluirDenuncia() {
        const todosConcluidos = checkpoints_denuncia.every(c => c.concluida);
        if (!todosConcluidos){
            return;
        }
        dados_denuncia.status_id = 1;
        await salvarDenuncia();
        atualiza_info();
        modal_avaliacao.classList.add("d-none");
        fade.classList.add("d-none");
        btn_confirma.classList.add("d-none");
    }

    //Referências aos objetos e chaves estrangeiras do JSON
    const dados_denuncia = data.denuncias.find(d => String(d.id) === denunciaId);
    const cpfLogado = data.usuarioLogado.cpf;
    const imagens_denuncia = dados_denuncia.imagens;
    const checkpoints_denuncia = dados_denuncia.progresso;
    const comentarios_denuncia = dados_denuncia.comentarios;
    const categoria_denuncia = data.categorias.find(c => Number(c.id) === Number(dados_denuncia.categoria_id));
    const urgencia_denuncia = data.urgencias.find(u => Number(u.id) === Number(dados_denuncia.urgencia_id));
    const status_denuncia = data.status.find(s => Number(s.id) === Number(dados_denuncia.status_id));
    const denunciante = data.usuariosMoradores.find(um => Number(um.cpf) === Number(dados_denuncia.denunciante));
    const tipoUsuario = data.usuariosInstituicoes.find(u => Number(u.cpf) === Number(cpfLogado)) ? "instituicao" : "morador";

    if (tipoUsuario === "morador"){
        nav1[0].textContent = "Início"
        nav2[0].textContent = "Faça sua denúncia"
        iconlink2.classList.remove("bi-buildings-fill")
        iconlink2.classList.add("bi-plus-circle")
        nav3[0].textContent = "Minhas denúncias"
        nav4[0].classList.remove("d-none")
        nav4[0].textContent = "Outras denúncias"
        nav1[1].textContent = "Início"
        nav2[1].textContent = "Faça sua denúncia"
        nav3[1].textContent = "Minhas denúncias"
        nav4[1].classList.remove("d-none")
        footerlink4.classList.remove("d-none")
        nav4[1].textContent = "Outras denúncias"
    } else {
        nav1[0].textContent = "Início"
        nav2[0].textContent = "Denúncias"
        iconlink2.classList.add("bi-buildings-fill")
        iconlink2.classList.remove("bi-plus-circle")
        nav3[0].textContent = "Minhas obras"
        nav4[0].classList.add("d-none")
        nav1[1].textContent = "Início"
        nav2[1].textContent = "Denúncias"
        nav3[1].textContent = "Minhas obras"
        nav4[1].classList.add("d-none")
        footerlink4.classList.add("d-none")
    }

    //----------------------------------------------------IMAGENS DA DENÚNCIA-------------------------------------------------------//
    // Lógica das imagens da denúncia

    // Lógica para alocar imagens em suas divs
    for (let i = 0; i < imagens_denuncia.length; i++) {
        const divImg = document.createElement("div");
        divImg.id = `img${i + 1}`;
        localImg.appendChild(divImg);
        const img = document.createElement("img");
        img.classList.add("img-details");
        img.src = imagens_denuncia[i];
        img.classList.add("rounded-2");
        divImg.appendChild(img);
    };
    // Lógica para 5 ou mais imagens (Inclui botões de navegação)
    if (imagens_denuncia.length >= 5) {
        btn_right.classList.remove("d-none");
        btn_left.classList.remove("d-none");
        localImg.classList.remove("mx-3");
    };
    // Função para atualizar as imagens visíveis
    const mediaQuery992 = window.matchMedia("(min-width: 992px)");
    const mediaQuery768 = window.matchMedia("(min-width: 768px)");
    const mediaQuery576 = window.matchMedia("(min-width: 576px)");
    let inicio_img = 1;

    function getQtdImgs() {
        if (mediaQuery992.matches) {
            return 4;
        }
        if (mediaQuery768.matches) {
            return 3;
        }
        if (mediaQuery576.matches) {
            return 2;
        }
        return 1;
    }

    function atualiza_img() {
        for (let i = 0; i < imagens_denuncia.length; i++) {
            const divImg_visivel = document.getElementById(`img${i + 1}`);
            if(divImg_visivel){
                divImg_visivel.classList.add("d-none");
            }
        };
        const qtd = getQtdImgs();
        const maxInicio = imagens_denuncia.length - qtd + 1;
        if (inicio_img > maxInicio){
            inicio_img = Math.max(1, maxInicio)
        }
        for (let i = inicio_img; i < (inicio_img + qtd); i++){
            const div_visivel = document.getElementById(`img${i}`);
            if (div_visivel) {
                div_visivel.classList.remove("d-none");
            }
        }
    };
    atualiza_img();
    mediaQuery992.addEventListener("change", () => {atualiza_img();});
    mediaQuery768.addEventListener("change", () => {atualiza_img();});
    mediaQuery576.addEventListener("change", () => {atualiza_img();});

    // Botões de navegação das imagens e setas do teclado
    btn_right.addEventListener("click", () => {
        if (inicio_img < (imagens_denuncia.length - getQtdImgs() + 1)) {
            inicio_img += 1;
            atualiza_img();
        };
    });
    btn_left.addEventListener("click", () => {
        if (inicio_img > 1) {
            inicio_img -= 1;
            atualiza_img();
        };
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
            btn_right.click();
        }
        if (event.key === "ArrowLeft") {
            btn_left.click();
        }
    });

    //-----------------------------------------------------COMENTÁRIOS---------------------------------------------------------------//
    async function visibilidade_comentario(){  
        const ehInstituicaoResponsavel = tipoUsuario === "instituicao" && Number(cpfLogado) === Number(dados_denuncia.usuarioInstituicao_cpf);
        const ehMorador = tipoUsuario === "morador";

        if (ehInstituicaoResponsavel) {
            sendCom.classList.remove("d-none");
            return;
        }  
        if (!ehMorador) {
            sendCom.classList.add("d-none");
            return;
        }
        const perfis = await getPerfisMoradores();
        const perfil = perfis.find(
            p => Number(p.usuarioMorador_cpf) === Number(cpfLogado)
        );

        const acompanhadas = perfil?.denuncias_acompanhadas ?? [];

        const ehDenunciante = Number(cpfLogado) === Number(dados_denuncia.denunciante);
        const estaAcompanhando = acompanhadas.includes(String(denunciaId));

        if (ehDenunciante || estaAcompanhando){
            sendCom.classList.remove("d-none");
        } else {
            sendCom.classList.add("d-none");
        }
    }

    await visibilidade_comentario()

    let editingComId = null;
    let editingCom = false
    async function carregaComentarios() {
        const perfisMoradores = await getPerfisMoradores();
        const perfisInstituicoes = await getPerfisInstituicoes();
        const comentarios = dados_denuncia.comentarios;
        conteudo_comentarios.innerHTML = ""
        if (comentarios.length === 0) {
            const msg = document.createElement("p");
            msg.textContent = "Nenhum comentário enviado.";
            msg.classList.add("text-center", "text-muted", "my-3");

            conteudo_comentarios.appendChild(msg);
            return;
        }
        comentarios.forEach(comentario => {
            let usuario = usuariosMoradores.find(u => Number(u.cpf) === Number(comentario.usuario));
            if (!usuario) {
                usuario = usuariosInstituicoes.find(u => Number(u.cpf) === Number(comentario.usuario));
            }
            let infoPerfil = perfisMoradores.find(u => Number(u.usuarioMorador_cpf) === Number(comentario.usuario));
            if (!infoPerfil) {
                infoPerfil = perfisInstituicoes.find(u => Number(u.usuarioInstituicao_cpf) === Number(comentario.usuario));
            }
            const card_comentario = document.createElement("div");
            card_comentario.classList.add("comentario");
            const foto_comentario = document.createElement("img");
            foto_comentario.classList.add("foto-perfil");
            foto_comentario.src = ` ${infoPerfil.fotoPerfil}`;
            const nome = document.createElement("h4");
            nome.textContent = usuario.nome_usuario;
            const mensagem = document.createElement("p");
            mensagem.textContent = comentario.mensagem;
            const data = document.createElement("span");
            data.textContent = `${comentario.data} às ${comentario.hora}`;
            if (comentario.editado === true){
                data.textContent += ` - Editado`
            }
            const trashCom = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            trashCom.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            trashCom.setAttribute("viewBox", "0 0 640 640");
            trashCom.setAttribute("width", "20px");
            trashCom.setAttribute("height", "20px");
            trashCom.setAttribute("id", `trashCom-${comentario.id}`)
            trashCom.classList.add("trashCom");
            const pathTrash = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathTrash.setAttribute("d", "M232.7 69.9C237.1 56.8 249.3 48 263.1 48L377 48C390.8 48 403 56.8 407.4 69.9L416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L224 96L232.7 69.9zM128 208L512 208L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 208zM216 272C202.7 272 192 282.7 192 296L192 488C192 501.3 202.7 512 216 512C229.3 512 240 501.3 240 488L240 296C240 282.7 229.3 272 216 272zM320 272C306.7 272 296 282.7 296 296L296 488C296 501.3 306.7 512 320 512C333.3 512 344 501.3 344 488L344 296C344 282.7 333.3 272 320 272zM424 272C410.7 272 400 282.7 400 296L400 488C400 501.3 410.7 512 424 512C437.3 512 448 501.3 448 488L448 296C448 282.7 437.3 272 424 272z");
            trashCom.appendChild(pathTrash);

            const editCom = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            editCom.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            editCom.setAttribute("viewBox", "0 0 640 640");
            editCom.setAttribute("width", "20px");
            editCom.setAttribute("height", "20px");
            editCom.setAttribute("id", `editCom-${comentario.id}`);
            editCom.classList.add("editCom");
            const pathEdit = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathEdit.setAttribute("d", "M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z");
            editCom.appendChild(pathEdit);

            if (usuario.cpf !== cpfLogado) {
                trashCom.classList.add("d-none")
                editCom.classList.add("d-none")
            } else {
                trashCom.classList.remove("d-none")
                editCom.classList.remove("d-none")
            }

            const divEd = document.createElement("div")
            divEd.classList.add("d-flex", "flex-column", "ms-auto")
            divEd.appendChild(trashCom)
            divEd.appendChild(editCom)
            card_comentario.appendChild(foto_comentario);
            card_comentario.appendChild(nome);
            card_comentario.appendChild(data);
            card_comentario.appendChild(divEd);
            card_comentario.appendChild(mensagem);
            conteudo_comentarios.appendChild(card_comentario);

            trashCom.addEventListener("click", async () => {
                const confirmar = confirm("Deseja realmente excluir este comentário?");
                if (!confirmar) {
                    return;
                }
                dados_denuncia.comentarios = dados_denuncia.comentarios.filter(c => c.id !== comentario.id);
                await salvarDenuncia();
                carregaComentarios();
            })

            editCom.addEventListener("click", () => {
                if (editingCom === false){
                    inputComentarios.value = comentario.mensagem;
                    inputComentarios.focus();
                    editingComId = comentario.id;
                } else {
                    inputComentarios.value = "";
                    editingComId = null;
                }
                editingCom = !editingCom
            })
        })
    }
    carregaComentarios()

    //-----------------------------------------------CHAT PORTA-VOZ-----------------------------------------------------------------//
    let editingMsgId = null;
    let editingMsg = false
    const ehDenunciante = Number(cpfLogado) === Number(dados_denuncia.denunciante);
    const ehInstituicao = Number(cpfLogado) === Number(dados_denuncia.usuarioInstituicao_cpf);
    if (!ehDenunciante && !ehInstituicao) {
        sendMsg.classList.add("d-none");
    } else {
        sendMsg.classList.remove("d-none");
    }
    async function loadMessages() {
        const res = await fetch(url_DataMsg);
        const messages = await res.json();
        const perfisMoradores = await getPerfisMoradores();
        const perfisInstituicoes = await getPerfisInstituicoes();
        const areaMsg = document.getElementById("area-msg");
        areaMsg.innerHTML = "";
        const mensagensDaDenuncia = messages.filter(msg => String(msg.denunciaId) === String(denunciaId));
        if (mensagensDaDenuncia.length === 0) {
            const msg = document.createElement("p");
            msg.textContent = "Nenhuma mensagem enviada.";
            msg.classList.add("text-center", "text-muted", "my-3");
            areaMsg.appendChild(msg);
            return;
        }
        mensagensDaDenuncia.forEach(msg => {
            if (String(msg.denunciaId) === String(denunciaId)) {
                let user = usuariosMoradores.find(u => Number(u.cpf) === Number(msg.usuario));
                if (!user) {
                    user = usuariosInstituicoes.find(u => Number(u.cpf) === Number(msg.usuario));
                };
                let infoPerfil = perfisMoradores.find(u => Number(u.usuarioMorador_cpf) === Number(user.cpf));
                if (!infoPerfil) {
                    infoPerfil = perfisInstituicoes.find(u => Number(u.usuarioInstituicao_cpf) === Number(user.cpf));
                }
                const div = document.createElement("div")
                div.classList.add("d-flex", "gap-2", "ps-2", "mb-3")
                const foto_mensagem = document.createElement("img")
                const headerMsg = document.createElement("div");
                headerMsg.classList.add("d-flex", "justify-content-between", "align-items-center", "px-1");
                const msgContent = document.createElement("div");
                msgContent.classList.add("msg");
                const spanName = document.createElement("span")
                const spanTime = document.createElement("span")
                const textMsg = document.createElement("div")
                const textEdit = document.createElement("small")
                const divEd = document.createElement("div")
                textEdit.textContent = "Editado"
                const trashMsg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                trashMsg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                trashMsg.setAttribute("viewBox", "0 0 640 640");
                trashMsg.setAttribute("width", "20px");
                trashMsg.setAttribute("height", "20px");
                trashMsg.setAttribute("id", `trashMsg-${msg.id}`)
                trashMsg.classList.add("trashMsg");
                const pathTrash = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pathTrash.setAttribute("d", "M232.7 69.9C237.1 56.8 249.3 48 263.1 48L377 48C390.8 48 403 56.8 407.4 69.9L416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L224 96L232.7 69.9zM128 208L512 208L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 208zM216 272C202.7 272 192 282.7 192 296L192 488C192 501.3 202.7 512 216 512C229.3 512 240 501.3 240 488L240 296C240 282.7 229.3 272 216 272zM320 272C306.7 272 296 282.7 296 296L296 488C296 501.3 306.7 512 320 512C333.3 512 344 501.3 344 488L344 296C344 282.7 333.3 272 320 272zM424 272C410.7 272 400 282.7 400 296L400 488C400 501.3 410.7 512 424 512C437.3 512 448 501.3 448 488L448 296C448 282.7 437.3 272 424 272z");
                trashMsg.appendChild(pathTrash);

                const editMsg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                editMsg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                editMsg.setAttribute("viewBox", "0 0 640 640");
                editMsg.setAttribute("width", "20px");
                editMsg.setAttribute("height", "20px");
                editMsg.setAttribute("id", `editMsg-${msg.id}`);
                editMsg.classList.add("editMsg");
                const pathEdit = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pathEdit.setAttribute("d", "M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z");
                editMsg.appendChild(pathEdit);

                if (user.cpf === cpfLogado) {
                    textMsg.classList.add("msg-send")
                    div.classList.add("flex-row-reverse")
                    headerMsg.classList.add("flex-row-reverse")
                    trashMsg.classList.remove("d-none")
                    editMsg.classList.remove("d-none")
                } else {
                    textMsg.classList.add("msg-receive")
                    trashMsg.classList.add("d-none")
                    editMsg.classList.add("d-none")
                }

                if(msg.editada === true){
                    textEdit.classList.remove("d-none")
                    foto_mensagem.classList.add("mb-4")
                    divEd.classList.add("mb-4")
                } else {
                    textEdit.classList.add("d-none")
                }
                spanName.textContent = user.nome_usuario;
                spanName.classList.add("fw-bold")
                spanTime.textContent = `${msg.data} ${msg.hora}`
                spanTime.setAttribute("style", "font-size: 75%")
                textMsg.textContent = msg.mensagem
                headerMsg.appendChild(spanName)
                headerMsg.appendChild(spanTime)
                msgContent.appendChild(headerMsg)
                msgContent.appendChild(textMsg)
                msgContent.appendChild(textEdit)
                msgContent.setAttribute("style", "width: 75%")
                foto_mensagem.classList.add("foto-perfil", "mt-auto");
                foto_mensagem.src = ` ${infoPerfil.fotoPerfil}`;
                div.appendChild(foto_mensagem)
                div.appendChild(msgContent)
                divEd.classList.add("d-flex", "flex-column", "align-self-end", "divEd-msg")
                divEd.appendChild(trashMsg)
                divEd.appendChild(editMsg)
                div.appendChild(divEd)
                areaMsg.appendChild(div);

                trashMsg.addEventListener("click", async () => {
                const confirmar = confirm("Deseja realmente excluir esta mensagem?");
                if (!confirmar) {
                    return;
                }
                    await fetch(`${url_DataMsg}/${msg.id}`, {
                        method: "DELETE"
                    })
                    loadMessages();
                })
                editMsg.addEventListener("click", () => {
                    if(editingMsg === false){
                        inputChat.value = msg.mensagem;
                        inputChat.focus();
                        editingMsgId = msg.id;
                    } else {
                        inputChat.value = "";
                        editingMsgId = null;
                    }
                    editingMsg = !editingMsg
                })
            }
        });
        //areaMsg.scrollTop = areaMsg.scrollHeight;
    }
    setInterval(loadMessages, 2000);
    loadMessages();



    //------------------------------------------------INFORMAÇÕES DA DENÚNCIA-------------------------------------------------------//

    //Mostra informações fixas (por enquanto)
    date.innerHTML = `Data da denúncia: ${dados_denuncia.dataPublicacao}`;
    localizacao.innerHTML = `Localização: ${dados_denuncia.local.cidade}, ${dados_denuncia.local.estado}`;
    descricao.innerHTML = `${dados_denuncia.descricaoDenuncia}`;
    nota_descricao.innerHTML = `${dados_denuncia.notaOrgao}`;

    //Mostra a imagem de perfil dependendo do usuário
    caminho_fotoPerfil = ""
    if (tipoUsuario === "morador") {
        const perfilMorador = data.infoPerfilMoradores.find(p => Number(p.usuarioMorador_cpf) === Number(cpfLogado));
        caminho_fotoPerfil = perfilMorador.fotoPerfil;
    } else {
        const perfilInstituicao = data.infoPerfilInstituicoes.find(p => Number(p.usuarioInstituicao_cpf) === Number(cpfLogado));
        caminho_fotoPerfil = perfilInstituicao.fotoPerfil;
    }
    avatars.forEach(avatar => {
        avatar.src = caminho_fotoPerfil
    });

    //Mostra a localização exata da denúncia no mapa
    const mapa = document.getElementById("mapa-detalhes");
    const endereco_denuncia = `${dados_denuncia.local.logradouro}, ${dados_denuncia.local.numero}, ${dados_denuncia.local.cidade}, ${dados_denuncia.local.estado}, ${dados_denuncia.local.pais}`;
    mapa.src = `https://www.google.com/maps?q=${encodeURIComponent(endereco_denuncia)}&output=embed`;

    //Função para atualizar o menu de informações da denúncia
    function atualiza_info() {
        const usuarioInstituicao = data.usuariosInstituicoes.find(ui => Number(ui.cpf) === Number(dados_denuncia.usuarioInstituicao_cpf));
        const instituicao = usuarioInstituicao
            ? data.instituicoes.find(i => String(i.id) === String(usuarioInstituicao.instituicao_id))
            : null;

        document.getElementById("title-details").textContent = `${categoria_denuncia.nome} na ${dados_denuncia.local.logradouro}, ${dados_denuncia.local.numero}`;
        document.getElementById("category").textContent = `Categoria: ${categoria_denuncia.nome}`;
        document.getElementById("urgency").textContent = `Urgência: ${urgencia_denuncia.tipo}`;
        document.getElementById("user").textContent = `Denunciante: ${denunciante.nome_usuario}`
        document.getElementById("resp").textContent = `Responsável:`;
        document.getElementById("organ").textContent = `Instituição:`;
        prazo.innerHTML = `Prazo estimado:`;
        custo.innerHTML = `Custo estimado:`;
        afetados.innerHTML = `Pessoas afetadas: ${dados_denuncia.afetados}`;

        const primeiro = checkpoints_denuncia[0];
        const ultimo = checkpoints_denuncia.at(-1);
        const planejamento = checkpoints_denuncia.find(c =>
            c.etapa === "Planejamento e previsões"
        );

        // Responsável e instituição
        if (primeiro?.concluida && usuarioInstituicao && instituicao) {
            document.getElementById("resp").textContent = `Responsável: ${usuarioInstituicao.nome_usuario}`;
            document.getElementById("organ").textContent = `Instituição: ${instituicao.nome}`;
        }

        // Prazo e custo
        if (planejamento?.concluida) {
            prazo.innerHTML = `Prazo estimado: ${dados_denuncia.prazo}`;
            custo.innerHTML = `Custo estimado: ${dados_denuncia.custo}`;
            if (dados_denuncia.notaCusto && dados_denuncia.notaCusto.trim() !== "") {
                iconNotaCusto.classList.remove("d-none");
                iconNotaCusto.setAttribute("title", dados_denuncia.notaCusto);
                const tooltipExistente = bootstrap.Tooltip.getInstance(iconNotaCusto);
                if (tooltipExistente) {
                    tooltipExistente.setContent({".tooltip-inner": dados_denuncia.notaCusto});
                } else {
                    new bootstrap.Tooltip(iconNotaCusto);
                }
            } else {
                iconNotaCusto.classList.add("d-none");
            }
        }

        //Atualiza as informações sobre status (chave estrangeira)
        const status_denuncia = data.status.find(s => Number(s.id) === Number(dados_denuncia.status_id));
        document.getElementById("status").textContent = `Status: ${status_denuncia.status}`;

        //Status da denúncia e a implicação nos botões
        if (dados_denuncia.status_id === 1) {

            btnStart.classList.add("d-none")
            btnExit.classList.add("d-none")
            btn_avanca.classList.add("d-none");
            btn_retorna.classList.add("d-none");
            btn_editar.classList.add("d-none");
            btn_confirma.classList.add("d-none")

        } else if (dados_denuncia.status_id === 2 && tipoUsuario === "instituicao") {
                if (Number(cpfLogado) === Number(dados_denuncia.usuarioInstituicao_cpf)) {

                    btnStart.classList.add("d-none")
                    btnExit.classList.remove("d-none")
                    btn_avanca.classList.remove("d-none");
                    btn_retorna.classList.remove("d-none");
                    btn_editar.classList.remove("d-none")

                } else {

                    // Outra instituição: esconde tudo
                    btnStart.classList.add("d-none")
                    btnExit.classList.add("d-none")
                    btn_avanca.classList.add("d-none");
                    btn_retorna.classList.add("d-none");
                    btn_editar.classList.add("d-none")
                }
        } else if (dados_denuncia.status_id === 4 && tipoUsuario === "instituicao") {
            btnStart.classList.add("d-none")
            btnExit.classList.add("d-none")
            btn_avanca.classList.add("d-none");
            if (Number(cpfLogado) === Number(dados_denuncia.usuarioInstituicao_cpf)) {
                btn_retorna.classList.remove("d-none");

            } else {
                btn_retorna.classList.add("d-none");
            }
            btn_editar.classList.add("d-none")

        } else if (dados_denuncia.status_id === 3 && tipoUsuario === "instituicao") {

            btnStart.classList.remove("d-none")
            btnExit.classList.add("d-none")
            btn_avanca.classList.add("d-none");
            btn_retorna.classList.add("d-none");
            btn_editar.classList.add("d-none")
        }
    };

    if (dados_denuncia.notaOrgao != "") {
        nota_descricao.classList.remove("d-none");
        const nota_titulo = document.getElementById("nota-descricao");
        nota_titulo.classList.remove("d-none");
        ;
    }

    if (tipoUsuario === "morador") {
        btnStart.classList.add("d-none");
        btn_avanca.classList.add("d-none");
        btn_retorna.classList.add("d-none");
        const usuario = usuariosMoradores.find(um => Number(um.cpf) === Number(cpfLogado));
        const acompanhadas = usuario?.denuncias_acompanhadas ?? [];
        const ehDenunciante = Number(cpfLogado) === Number(dados_denuncia.denunciante);
        if (ehDenunciante){
            btn_acompanha.classList.add("d-none")
            btn_desacompanha.classList.add("d-none")
        } else {
            if (acompanhadas.includes(String(dados_denuncia.id))) {
                btn_acompanha.classList.add("d-none")
                btn_desacompanha.classList.remove("d-none")
            } else {
                btn_acompanha.classList.remove("d-none")
                btn_desacompanha.classList.add("d-none")
            }
        }
        const ultimo = checkpoints_denuncia.at(-1);
        if (ultimo?.concluida && ehDenunciante) {
            btn_confirma.classList.remove("d-none");
        }
    } else {
        btn_acompanha.classList.add("d-none")
        btn_desacompanha.classList.add("d-none")
    }

    //-----------------------------------------------ANDAMENTO DA DENÚNCIA----------------------------------------------------------//
    function getUltimoConcluido() {
        for (let i = checkpoints_denuncia.length - 1; i >= 0; i--) {
            if (checkpoints_denuncia[i].concluida) {
                return i;
            }
        }
        return -1;
    }
    function getProximoCheckpoint() {
        return checkpoints_denuncia.findIndex(c => !c.concluida);
    }

    async function calcularStatus() {
        const primeiro = checkpoints_denuncia[0];
        const ultimo = checkpoints_denuncia.at(-1);
        const todosMenosUltimoConcluidos = checkpoints_denuncia.slice(0, -1).every(c => c.concluida);

        if (dados_denuncia.status_id === 1) {
            return;
        }
        if (ultimo?.concluida) {
            dados_denuncia.status_id = 4;
        } else if (primeiro?.concluida) {
            dados_denuncia.status_id = 2;
        } else {
            dados_denuncia.status_id = 3;
        }
        await salvarDenuncia();
    }

    //Função para atualizar o status dos checkpoints da denúncia
    function renderizar_checkpoints() {
        const usuarioInstituicao = data.usuariosInstituicoes.find(ui => Number(ui.cpf) === Number(dados_denuncia.usuarioInstituicao_cpf));
        const instituicao = usuarioInstituicao
            ? data.instituicoes.find(i => Number(i.id) === Number(usuarioInstituicao.instituicao_id))
            : null;

        const lista = document.getElementById("lista-checkpoints");
        lista.innerHTML = "";

        checkpoints_denuncia.forEach((checkpoint, i) => {
            const li = document.createElement("li");
            li.id = `check${i + 1}`;
            li.classList.add("d-flex", "align-items-center");

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("width", "20px");
            svg.setAttribute("height", "20px");
            svg.setAttribute("viewBox", "0 0 512 512");
            svg.classList.add("me-2");

            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", "256");
            circle.setAttribute("cy", "256");
            circle.setAttribute("r", "220");
            circle.setAttribute("stroke-width", "25px");

            const span = document.createElement("span");
            const link = document.createElement("a");
            span.textContent = `${checkpoint.etapa} | `;

            const isConcluido = checkpoint.concluida;
            const isAnteriorConcluido = i === 0 || checkpoints_denuncia[i - 1].concluida;

            if (isConcluido) {
                circle.setAttribute("fill", "black");
                circle.setAttribute("stroke", "black");
                li.classList.remove("bg-ff5900", "rounded-5", "pt-1", "pb-2", "px-2", "me-2", "my-2", "text-light");

            } else if (isAnteriorConcluido) {
                circle.setAttribute("fill", "white");
                circle.setAttribute("stroke", "white");
                li.classList.add("bg-ff5900", "rounded-5", "pt-1", "pb-2", "px-2", "me-2", "my-2", "text-light");

            } else {
                circle.setAttribute("fill", "white");
                circle.setAttribute("stroke", "black");
                li.classList.remove("bg-ff5900", "rounded-5", "pt-1", "pb-2", "px-2", "me-2", "my-2", "text-light");
            }

            if (isConcluido && checkpoint.arquivo?.nome) {
                link.href = checkpoint.arquivo.url;
                link.textContent = checkpoint.arquivo.nome;
                link.download = checkpoint.arquivo.nome;
                link.removeAttribute("target");
            } else {
                link.textContent = "";
                link.removeAttribute("href");
                link.removeAttribute("download");
                link.removeAttribute("target");
            }
            if (i === 0 && isConcluido && usuarioInstituicao && instituicao) {
                span.textContent = `Denúncia aceita | ${usuarioInstituicao.nome_usuario}, ${instituicao.nome}`;
            }
            
            svg.appendChild(circle);
            li.appendChild(svg);
            li.appendChild(span);
            li.appendChild(link);
            lista.appendChild(li);
        });
    }

    // Função da lógica da barra de progresso dos checkpoints da denúncia
    function renderiza_progresso() {
        const totalEtapas = checkpoints_denuncia.length - 1;
        if (totalEtapas <= 0) {
            progresso.style.width = "0%";
            return;
        }
        const concluidas = checkpoints_denuncia.slice(1).filter(c => c.concluida).length;
        const porcentagem = (concluidas / totalEtapas) * 100;
        progresso.style.width = `${porcentagem}%`;
    };

    renderizar_checkpoints();
    atualiza_info();
    renderiza_progresso();
    await atualizarBotoesAcompanhamento();

    //Lógica do botão de avança checkpoint + anexa arquivo + modal de custo e prazo
    fade.addEventListener("click", async () => {
        modal_previsao.classList.add("d-none");
        fade.classList.add("d-none");
        modal_avaliacao.classList.add("d-none");
        const ultimo = checkpoints_denuncia.at(-1);
        if (ultimo?.concluida) {
            await concluirDenuncia();
        }
    });

    btn_avanca.addEventListener("click", () => {
        const proximo = getProximoCheckpoint();
        if (proximo === -1) {
            return;
        }
        if (proximo === 0) {
            return;
        }
        const checkpoint = checkpoints_denuncia[proximo];
        if (checkpoint.etapa === "Planejamento e previsões") {
            modal_previsao.classList.remove("d-none");
            fade.classList.remove("d-none");
        } else {
            fileInput.click();
        }
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

    form_prev.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!inputDate.value || !inputCost.value) {
            alert("Preencha todos os campos!");
            return;
        };

        modal_previsao.classList.add("d-none");
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
        const LIMITE = 200 * 1024;
        if (arquivo.size > LIMITE) {
            alert("O arquivo deve ter no máximo 200 KB.");
            fileInput.value = "";
            return;
        }
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject("Erro ao ler o arquivo.");
            reader.readAsDataURL(arquivo);
        });

        const proximoCheckpoint = checkpoints_denuncia.find((c, i) =>
            i > 0 && c.concluida === false && checkpoints_denuncia[0].concluida === true
        );
        if (!proximoCheckpoint){
            return;
        }

        proximoCheckpoint.concluida = true;
        proximoCheckpoint.arquivo.url = base64;
        proximoCheckpoint.arquivo.nome = arquivo.name;

        await calcularStatus();
        renderizar_checkpoints();
        renderiza_progresso();
        atualiza_info();
        fileInput.value = "";
    });

    form_aval.addEventListener("submit", async (event) => {
        event.preventDefault();
        const perfilInstituicao = data.infoPerfilInstituicoes.find(p => Number(p.usuarioInstituicao_cpf) === Number(dados_denuncia.usuarioInstituicao_cpf));
        const avaliacao = {
            denunciaId: denunciaId,
            avaliador: cpfLogado,
            nota: Number(range5.value),
            descricao: textAvaliacao.value.trim() || "",
            data: new Date().toLocaleDateString("pt-BR")
        };
        await fetch(`${BASE_URL}/infoPerfilInstituicoes/${perfilInstituicao.id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    avaliacoes: [
                        ...perfilInstituicao.avaliacoes,
                        avaliacao
                    ]
                })
            }
        );

        await salvarDenuncia();
        await concluirDenuncia();      
    });

    // Lógica do botão retorna checkpoint + remove arquivo
    btn_retorna.addEventListener("click", async () => {
        const ultimo = getUltimoConcluido();
        if (ultimo <= 0) {
            return;
        }
        checkpoints_denuncia[ultimo].concluida = false;
        checkpoints_denuncia[ultimo].arquivo.url = "";
        checkpoints_denuncia[ultimo].arquivo.nome = "";

        await calcularStatus();
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
        sendMsg.classList.remove("d-none");
        sendCom.classList.remove("d-none");
        await calcularStatus();
        renderizar_checkpoints();
        atualiza_info();
    });

    btnExit.addEventListener("click", async () => {
        checkpoints_denuncia.forEach(checkpoint => {
            checkpoint.concluida = false;
            checkpoint.arquivo.nome = "";
            checkpoint.arquivo.url = "";
        });

        dados_denuncia.usuarioInstituicao_cpf = "";
        dados_denuncia.prazo = "";
        dados_denuncia.custo = "";

        btnStart.classList.remove("d-none");
        btnExit.classList.add("d-none");
        sendMsg.classList.add("d-none");
        sendCom.classList.add("d-none");

        await calcularStatus();
        renderizar_checkpoints();
        atualiza_info();
        renderiza_progresso()
    });

    modal_avaliacao.addEventListener("hidden.bs.modal", async () => {
        await concluirDenuncia();   
    });

    btn_confirma.addEventListener("click", async () => {
        const ultimo = checkpoints_denuncia.at(-1);
        if (!ultimo?.concluida) return;
        const confirmar = confirm("Tem certeza de que deseja confirmar a conclusão desta obra?");
        if (!confirmar) {
            return;
        }
        modal_avaliacao.classList.remove("d-none");
        fade.classList.remove("d-none");
    })

    btnCancelarAval.addEventListener("click", async () => {
        await concluirDenuncia();
    });

    async function salvarPerfilMorador(perfil) {
        await fetch(`http://localhost:3000/infoPerfilMoradores/${perfil.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(perfil)
        });
    }
    async function getPerfisMoradores() {
        const res = await fetch(`${BASE_URL}/infoPerfilMoradores`);
        return await res.json();
    }

    async function getPerfisInstituicoes() {
        const res = await fetch(`${BASE_URL}/infoPerfilInstituicoes`);
        return await res.json();
    }

    async function getPerfilAtualMorador() {
        const res = await fetch(`${BASE_URL}/infoPerfilMoradores`);
        const perfis = await res.json();

        return perfis.find(p =>
            Number(p.usuarioMorador_cpf) === Number(cpfLogado)
        );
    }

    async function atualizarBotoesAcompanhamento() {
        if (tipoUsuario !== "morador"){
            return;
        }
        const ehDenunciante = Number(cpfLogado) === Number(dados_denuncia.denunciante);
        if (ehDenunciante) {
            btn_acompanha.classList.add("d-none");
            btn_desacompanha.classList.add("d-none");
            return;
        }
        const perfil = await getPerfilAtualMorador();
        const acompanhadas = perfil?.denuncias_acompanhadas ?? [];
        const estaAcompanhando = acompanhadas.includes(String(dados_denuncia.id));
        if (estaAcompanhando) {
            btn_acompanha.classList.add("d-none");
            btn_desacompanha.classList.remove("d-none");
        } else {
            btn_acompanha.classList.remove("d-none");
            btn_desacompanha.classList.add("d-none");
        }
    }

    btn_acompanha.addEventListener("click", async () => {
        dados_denuncia.afetados += 1;
        const perfil = await getPerfilAtualMorador();
        const acompanhadas = perfil?.denuncias_acompanhadas ?? [];
        if (!acompanhadas.includes(String(dados_denuncia.id))) {
            perfil.denuncias_acompanhadas.push(String(dados_denuncia.id));
        }

        btn_acompanha.classList.add("d-none");
        btn_desacompanha.classList.remove("d-none");
        atualiza_info();
        await salvarDenuncia();
        await salvarPerfilMorador(perfil);
        await visibilidade_comentario();
        await atualizarBotoesAcompanhamento();
    })

    btn_desacompanha.addEventListener("click", async () => {
        dados_denuncia.afetados -= 1;
        const perfil = await getPerfilAtualMorador();
        if (!Array.isArray(perfil.denuncias_acompanhadas)) {
            perfil.denuncias_acompanhadas = [];
        }
        perfil.denuncias_acompanhadas = perfil.denuncias_acompanhadas.filter(id => String(id) !== String(dados_denuncia.id));

        btn_desacompanha.classList.add("d-none");
        btn_acompanha.classList.remove("d-none");
        
        atualiza_info();
        await salvarDenuncia();
        await salvarPerfilMorador(perfil);
        await visibilidade_comentario();
        await atualizarBotoesAcompanhamento();
    })

    btn_comentario.addEventListener("click", async () => {
        const textoComentario = inputComentarios.value.trim();
        if (textoComentario === "") {
            return;
        }
        const agora = new Date();
        const dataAtual = agora.toLocaleDateString("pt-BR");
        const horaAtual = agora.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
        });
        if(editingComId){
            const comentario = dados_denuncia.comentarios.find(c => c.id === editingComId);
            comentario.mensagem = textoComentario;
            comentario.data = dataAtual;
            comentario.hora = horaAtual;
            comentario.editado = true;
            await salvarDenuncia()
        } else {
            const novoComentario = {
                id: Date.now(),
                usuario: cpfLogado,
                mensagem: textoComentario,
                data: dataAtual,
                hora: horaAtual,
                editado: false
            };
            const denunciaAtualizada = await fetch(`${BASE_URL}/denuncias/${denunciaId}`).then(res => res.json());
            denunciaAtualizada.comentarios.push(novoComentario);
            dados_denuncia.comentarios.push(novoComentario);
            await salvarDenuncia();
        }
        editingComId = null
        editingCom = false;
        inputComentarios.value = "";
        carregaComentarios();
    })

    btn_chat.addEventListener("click", async () => {
        const textoChat = inputChat.value.trim();
        if (textoChat === "") {
            return;
        }
        const agora = new Date();
        const dataAtual = agora.toLocaleDateString("pt-BR");
        const horaAtual = agora.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
        });
        if(editingMsgId){
            await fetch(`${BASE_URL}/mensagensChat/${editingMsgId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mensagem: textoChat, data: dataAtual, hora: horaAtual, editada: true })
            })
        } else {
            const novaMensagem = {
                denunciaId: denunciaId,
                usuario: cpfLogado,
                mensagem: textoChat,
                data: dataAtual,
                hora: horaAtual,
                editada: false
            };
            await fetch(`${BASE_URL}/mensagensChat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novaMensagem)
            });
        }
        editingMsgId = null;
        inputChat.value = "";
        loadMessages();
    })
}
init();