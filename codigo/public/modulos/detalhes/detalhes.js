    fetch("detalhes.json").then(res => res.json()).then((data) => {
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

//----------------------------------------------------IMAGENS DA DENÚNCIA-------------------------------------------------------//
        // Lógica das imagens da denúncia
        const dados = data.denuncias[0];
        const imagens = dados.imagens;
            // Lógica para alocar imagens em suas divs
        for(let i=0; i<imagens.length; i++){
            const divImg = document.createElement("div");
            divImg.id = `img${i+1}`;
            localImg.appendChild(divImg);
            const img = document.createElement("img");
            img.classList.add("img-details");
            img.src = imagens[i];
            img.classList.add("rounded-2");
            divImg.appendChild(img);
        };
            // Lógica para 5 ou mais imagens (Inclui botões de navegação)
        if(imagens.length>=5){
            btn_right.classList.remove("d-none");
            btn_left.classList.remove("d-none");
            localImg.classList.remove("mx-3");
        };
            // Função para atualizar as imagens visíveis
        let inicio_img = 1;
        function atualiza_img(){
            for(let i = 0; i<imagens.length; i++){
                const divImg_visivel = document.getElementById(`img${i+1}`);
                divImg_visivel.classList.add("d-none");
            };
            if(imagens.length>4){
                for(let i=inicio_img; i<(inicio_img+4); i++){
                    const div_visivel = document.getElementById(`img${i}`);
                    div_visivel.classList.remove("d-none");
                }
            }else{  
                for(let i=inicio_img; i<(imagens.length+1); i++){
                    const div_visivel = document.getElementById(`img${i}`);
                    div_visivel.classList.remove("d-none");
                };
            };
        };
        atualiza_img();

            // Botões de navegação das imagens e setas do teclado
        btn_right.addEventListener("click", () => {
            if(inicio_img<(imagens.length-3)){
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

});
//------------------------------------------------INFORMAÇÕES DA DENÚNCIA-------------------------------------------------------//
        //Referências aos objetos ee chaves estrangeiras do JSON
        const checkpoints = dados.progresso;
        const categoria = data.categorias.find(c => c.id === dados.categoria_id);
        const urgencia = data.urgencias.find(u => u.id === dados.urgencia_id);
        const status = data.status.find(s => s.id === dados.status_id);
        const usuarioMorador = data.usuarioMorador.find(um => um.cpf === dados.usuarioMorador_cpf);
        const cpfLogado = data.usuarioLogado.cpf;
        const tipoUsuario = data.usuarioInstituicao.find(u => u.cpf === cpfLogado) ? "instituicao": "morador";

        //Mostra informações fixas (por enquanto)
        date.innerHTML = `Data da denúncia: ${dados.data}`;
        localizacao.innerHTML = `Localização: ${dados.local.cidade}, ${dados.local.estado}`;
        descricao.innerHTML = `${dados.descricaoDenuncia}`;
        nota_descricao.innerHTML = `${dados.notaOrgao}`;

        const mapa = document.getElementById("mapa-detalhes");
        const endereco = `${dados.local.logradouro}, ${dados.local.numero}, ${dados.local.cidade}, ${dados.local.estado}, ${dados.local.pais}`;

        mapa.src = `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`;

        //Função para atualizar o menu de informações da denúncia
        function atualiza_info() {
            const usuarioInstituicao = data.usuarioInstituicao.find(ui => ui.cpf === dados.usuarioInstituicao_cpf);
            const instituicao = data.instituicao.find(i => i.id === usuarioInstituicao.instituicao_id);
            document.getElementById("title-details").textContent = `${categoria.nome} na ${dados.local.logradouro}, ${dados.local.numero}`;
            document.getElementById("category").textContent = `Categoria: ${categoria.nome}`;
            document.getElementById("urgency").textContent = `Urgência: ${urgencia.tipo}`;
            document.getElementById("user").textContent = `Denunciante: ${usuarioMorador.nome_usuario}`
            document.getElementById("resp").textContent = `Responsável:`;
            document.getElementById("organ").textContent = `Instituição:`;
            prazo.innerHTML = `Prazo estimado:`;
            custo.innerHTML = `Custo estimado:`;
            afetados.innerHTML = `Pessoas afetadas: ${dados.afetados}`;
            //Alterações quando assume denúncia e quando define prazo e custo    
            if (checkpoints[0].concluida === true) {
                document.getElementById("resp").textContent = `Responsável: ${usuarioInstituicao.nome_usuario}`;
                document.getElementById("organ").textContent = `Instituição: ${instituicao.nome}`;
                if(checkpoints[2].concluida === true){
                    prazo.innerHTML = `Prazo estimado: ${dados.prazo}`;
                    custo.innerHTML = `Custo estimado: ${dados.custo}`;
                };
            }
            // Controla o status da denúncia
            if(dados.status_id !== 1){
                if(checkpoints[4].concluida === true){
                    dados.status_id = 4
                } else if(checkpoints[0].concluida === true){
                    dados.status_id = 2
                } else {
                    dados.status_id = 3
                }
            };

            //Atualiza as informações sobre status (chave estrangeira)
            const status = data.status.find(s => s.id === dados.status_id);
            document.getElementById("status").textContent = `Status: ${status.status}`;

                //Status da denúncia e a implicação nos botões
            if(dados.status_id === 1){
                btnExit.classList.add("d-none")
                btnStart.classList.add("d-none")
            } else if(dados.status_id !== 3 && tipoUsuario==="instituicao"){
                btn_editar.classList.remove("d-none");
                btn_avanca.classList.remove("d-none");
                btn_retorna.classList.remove("d-none");
            } else {
                btn_avanca.classList.add("d-none");
                btn_retorna.classList.add("d-none");
                btn_editar.classList.add("d-none");
            };
            if(dados.status_id === 2){
                btnStart.classList.add("d-none");
            };
        };

        if(dados.notaOrgao != ""){
            nota_descricao.classList.remove("d-none");
            const nota_titulo = document.getElementById("nota-descricao");
            nota_titulo.classList.remove("d-none");
        ;}

        if(tipoUsuario === "morador"){
            btnStart.classList.add("d-none");
            btn_avanca.classList.add("d-none");
            btn_retorna.classList.add("d-none");
            btn_acompanha.classList.remove("d-none");
            if(checkpoints[4].concluida===true && cpfLogado === dados.usuarioMorador_cpf){
                btn_confirma.classList.remove("d-none");
            };
        }

//-----------------------------------------------ANDAMENTO DA DENÚNCIA----------------------------------------------------------//
        
        //Função para atualizar o status dos checkpoints da denúncia
        function renderizar_checkpoints() {
            const usuarioInstituicao = data.usuarioInstituicao.find(ui => ui.cpf === dados.usuarioInstituicao_cpf);
            const instituicao = data.instituicao.find(i => i.id === usuarioInstituicao.instituicao_id);
            //Nomeia os checkpoints
            for (let i = 0; i < (checkpoints.length); i++) {
                document.querySelector(`#check${i + 1} span`).textContent = `${checkpoints[i].etapa} | `;
            };

            for (let i = 0; i < (checkpoints.length); i++) {
                const checkpoint_atual = document.querySelector(`#check${i + 1}`);
                if (checkpoints[i].concluida === true) {
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
                if (checkpoints[i].concluida === false) {
                    if ((i > 0)&&(checkpoints[i-1].concluida === true)) {
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
                if((checkpoints[i].arquivo.nome !== "")&&(checkpoints[i].concluida===true)){
                    link.href = checkpoints[i].arquivo.url;
                    link.textContent = checkpoints[i].arquivo.nome;
                    link.target = "_blank";
                } else {
                    link.href = "";
                    link.textContent = "";
                    link.target = "";
                }
            };
            if(checkpoints[0].concluida === true){
                document.querySelector(`#check1 span`).textContent = `Denuncia aceita | ${usuarioInstituicao.nome_usuario}, ${instituicao.nome}`;
            };
        };

        // Função da lógica da barra de progresso dos checkpoints da denúncia
        function renderiza_progresso() {
            let qt_concluidas = 0;
            for (let j = 1; j < checkpoints.length; j++) {
                if (checkpoints[j].concluida == true) {
                    qt_concluidas += 1;
                };
            };
            let porcentagem = qt_concluidas / (checkpoints.length - 1) * 100;
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
            if(checkpoints[4].concluida === false){
                if (checkpoints[0].concluida === false) {
                    return;
                }

                if(checkpoints[1].concluida === true && checkpoints[2].concluida === false){
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
            dados.prazo = dataFormatada;
            dados.custo = inputCost.value;
            fileInput.click();
        });

        fileInput.addEventListener("change", (event) => {
            const arquivo = event.target.files[0];
            if (!arquivo) {
                return;
            };
            for (let i = 0; i < (checkpoints.length); i++) {
                if ((checkpoints[i].concluida === false) && (checkpoints[0].concluida === true)) {
                    checkpoints[i].concluida = true;
                    const UrlArquivo = URL.createObjectURL(arquivo);
                    dados.progresso[i].arquivo.url = UrlArquivo
                    dados.progresso[i].arquivo.nome = arquivo.name
                    break;
                };
            };
            renderizar_checkpoints();
            renderiza_progresso();
            atualiza_info();
        });

        // Lógica do botão retorna checkpoint + remove arquivo
        document.getElementById("btn-retorna").addEventListener("click", () => {
            for (let i = 0; i < (checkpoints.length); i++) {
                if ((checkpoints[i].concluida === true) && (i===4 || (checkpoints[i + 1].concluida === false)) && (checkpoints[0].concluida === true) && (i!=0)) {
                    checkpoints[i].concluida = false;
                    checkpoints[i].arquivo.url = "";
                    checkpoints[i].arquivo.nome = "";
                    break;
                };
            };
            renderizar_checkpoints();
            renderiza_progresso();
            atualiza_info();
        });

        // Lógica dos botões de assumir e abandonar ocorrência, confirmar conclusão e acompanhar denúncia
        btnStart.addEventListener("click", () => {
            dados.usuarioInstituicao_cpf = cpfLogado
            checkpoints[0].concluida = true;
            btnStart.classList.add("d-none");
            btnExit.classList.remove("d-none");
            renderizar_checkpoints();
            atualiza_info();
        });
        btnExit.addEventListener("click", () => {
            for(let i = 0; i<checkpoints.length; i++){
                checkpoints[i].concluida = false;
                checkpoints[i].arquivo.url="";
                checkpoints[i].arquivo.nome="";
            }
            btnStart.classList.remove("d-none");
            btnExit.classList.add("d-none");
            renderizar_checkpoints();
            atualiza_info();
            renderiza_progresso()
        });

        btn_confirma.addEventListener("click", () => {
            dados.status_id = 1;
            atualiza_info();
            btn_confirma.classList.add("d-none");
        })

        btn_acompanha.addEventListener("click", () => {
            dados.afetados+=1;
            atualiza_info();
            btn_acompanha.classList.add("d-none");
            btn_desacompanha.classList.remove("d-none");
        })

        btn_desacompanha.addEventListener("click", () => {
            dados.afetados-=1;
            atualiza_info();
            btn_acompanha.classList.remove("d-none");
            btn_desacompanha.classList.add("d-none");
        })
    });
