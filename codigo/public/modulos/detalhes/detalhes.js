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

//-----------------------------------------------------IMAGENS DA DENÚNCIA-------------------------------------------------------//
        // Lógica das imagens da denúncia
        const imagens = data.denuncias[0].imagens;
            // Lógica para alocar imagens em suas divs
        for(let i=0; i<imagens.length; i++){
            const divImg = document.createElement("div");
            divImg.id = `img${i+1}`;
            localImg.appendChild(divImg);
            const img = document.createElement("img");
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

            // Botões de navegação das imagens
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
//-------------------------------------------------INFORMAÇÕES DA DENÚNCIA-------------------------------------------------------//
        //Referências aos objetos ee chaves estrangeiras do JSON
        const dados = data.denuncias[0];
        const checkpoints = data.progresso;
        const categoria = data.categorias.find(c => c.id === dados.categoria_id);
        const urgencia = data.urgencias.find(u => u.id === dados.urgencia_id);
        const status = data.status.find(s => s.id === dados.status_id);
        const usuarioMorador = data.usuarioMorador.find(um => um.cpf === dados.usuarioMorador_cpf);
        const usuarioInstituicao = data.usuarioInstituicao.find(ui => ui.cpf === dados.usuarioInstituicao_cpf);
        const instituicao = data.instituicao.find(i => i.id === usuarioInstituicao.instituicao_id);
        
        //Mostra informações fixas (por enquanto)
        date.innerHTML = `Data da denúncia: ${dados.data}`;
        localizacao.innerHTML = `Localização: ${dados.local.cidade}, ${dados.local.estado}`;
        afetados.innerHTML = `Pessoas afetadas: ${dados.afetados}`;
        descricao.innerHTML = `${dados.descricaoDenuncia}`;
        nota_descricao.innerHTML = `${dados.notaOrgao}`;

        //Função para atualizar o menu de informações da denúncia
        function atualiza_info() {
            document.getElementById("title-details").textContent = `${categoria.nome} na ${dados.local.logradouro}`;
            document.getElementById("category").textContent = `Categoria: ${categoria.nome}`;
            document.getElementById("urgency").textContent = `Urgência: ${urgencia.tipo}`;
            document.getElementById("user").textContent = `Denunciante: ${usuarioMorador.nome_usuario}`
            document.getElementById("resp").textContent = `Responsável:`;
            document.getElementById("organ").textContent = `Instituição:`;
            prazo.innerHTML = `Prazo estimado:`;
            custo.innerHTML = `Custo estimado:`;
            //Alterações quando assume denúncia e quando define prazo e custo    
            if (checkpoints[0].concluida === true) {
                dados.status_id = 2;
                document.getElementById("resp").textContent = `Responsável: ${usuarioInstituicao.nome_usuario}`;
                document.getElementById("organ").textContent = `Instituição: ${instituicao.nome}`;
                if(checkpoints[2].concluida === true){
                    prazo.innerHTML = `Prazo estimado: ${dados.prazo}`;
                    custo.innerHTML = `Custo estimado: ${dados.custo}`;
                };
            } else {
                //Se a denúncia não foi assumida, o status é "Em aberto"
                dados.status_id = 3;
            };
            //Atualiza as informações sobre status (chave estrangeira)
            const status = data.status.find(s => s.id === dados.status_id);
            document.getElementById("status").textContent = `Status: ${status.status}`;

                //Status da denúncia e a implicação nos botões
            if(dados.status_id === 1){
                btnExit.classList.add("d-none")
            } else if(dados.status_id === 2){
                btn_editar.classList.remove("d-none");
                btn_avanca.classList.remove("d-none");
                btn_retorna.classList.remove("d-none");
            } else {
                btn_avanca.classList.add("d-none");
                btn_retorna.classList.add("d-none");
                btn_editar.classList.add("d-none");
            };
        };

        if(dados.notaOrgao != ""){
            nota_descricao.classList.remove("d-none");
            const nota_titulo = document.getElementById("nota-descricao");
            nota_titulo.classList.remove("d-none");
        ;}

//------------------------------------------------ANDAMENTO DA DENÚNCIA----------------------------------------------------------//
        
        //Função para atualizar o status dos checkpoints da denúncia
        function renderizar_checkpoints() {

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

        //Nomeia os checkpoints
        for (let i = 0; i < (checkpoints.length); i++) {
            document.querySelector(`#check${i + 1} span`).textContent = `${checkpoints[i].etapa} | `;
        };

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

        btn_close_modal.addEventListener("click", () => {
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
                    const UrlAqrquivo = URL.createObjectURL(arquivo);
                    const checkpoint = document.querySelector(`#check${i + 1}`);
                    const link = document.querySelector(`#check${i + 1} a`);
                    link.href = UrlAqrquivo;
                    link.textContent = arquivo.name;
                    link.target = "_blank";
                    checkpoint.appendChild(link);
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
                    const checkpoint = document.querySelector(`#check${i + 1}`);
                    const link = document.querySelector(`#check${i + 1} a`);
                    link.href = "";
                    link.textContent = "";
                    link.target = "";
                    break;
                };
            };
            renderizar_checkpoints();
            renderiza_progresso();
            atualiza_info();
        });

        // Lógica dos botão de assumir e abandonar ocorrência
        btnStart.addEventListener("click", () => {
            checkpoints[0].concluida = true;
            document.querySelector(`#check1 span`).textContent += `${usuarioInstituicao.nome_usuario}, ${instituicao.nome}`;
            btnStart.classList.add("d-none");
            btnExit.classList.remove("d-none");
            renderizar_checkpoints();
            atualiza_info();
        });
        btnExit.addEventListener("click", () => {
            for(let i = 0; i<checkpoints.length; i++){
                checkpoints[i].concluida = false;
                const link = document.querySelector(`#check${i + 1} a`);
                link.href = "";
                link.textContent = "";
                fileInput.value = "";
            }
            document.querySelector(`#check1 span`).textContent = "Denúncia aceita | ";
            btnStart.classList.remove("d-none");
            btnExit.classList.add("d-none");
            renderizar_checkpoints();
            atualiza_info();
            renderiza_progresso()
        });
    });
