fetch("detalhes.json").then(res => res.json()).then((data) => {
    const dados = data.denuncias[0];
    const categoria = data.categorias.find(c => c.id === dados.categoria_id);
    const urgencia = data.urgencias.find(u => u.id === dados.urgencia_id);
    const checkpoints = data.progresso;
    const usuarioMorador = data.usuarioMorador.find(um => um.cpf === dados.usuarioMorador_cpf);
    const usuarioInstituicao = data.usuarioInstituicao.find(ui => ui.cpf === dados.usuarioInstituicao_cpf);
    const instituicao = data.instituicao.find(i => i.id === usuarioInstituicao.instituicao_id);

    const date =  document.getElementById("date");
    const localizacao = document.getElementById("location");
    const prazo = document.getElementById("term");
    const afetados = document.getElementById("affected");
    const custo = document.getElementById("cost");
    const descricao = document.getElementById("texto-descricao");
    const progresso = document.querySelector(".progress-bar");

//---------------------------------------------------------FUNÇÕES------------------------------------------------------------------------
    
    //Função para atualizar o menu de informações da denúncia
    function atualiza_info(){
        document.getElementById("title-details").textContent = `${categoria.nome} na ${dados.local.logradouro}`;
        document.getElementById("category").textContent = `Categoria: ${categoria.nome}`;
        document.getElementById("urgency").textContent = `Urgência: ${urgencia.tipo}`;
        document.getElementById("user").textContent = `Denunciante: ${usuarioMorador.nome_usuario}`
    
        if(checkpoints[0].concluida === true){
            document.getElementById("resp").textContent = `Responsável: ${usuarioInstituicao.nome_usuario}`
            document.getElementById("organ").textContent = `Instituição: ${instituicao.nome}`
            prazo.innerHTML = `Prazo estimado: ${dados.prazo}`;
            custo.innerHTML = `Custo estimado: R$${dados.custo}`;
        } else {
            document.getElementById("resp").textContent = `Responsável:`
            document.getElementById("organ").textContent = `Instituição:`
            prazo.innerHTML = `Prazo estimado:`;
            custo.innerHTML = `Custo estimado:`;
        }

        date.innerHTML = `Data da denúncia: ${dados.data}`;
        localizacao.innerHTML = `Localização: ${dados.local.cidade} ${dados.local.estado}`;
        afetados.innerHTML = `Pessoas afetadas: ${dados.afetados}`;
        descricao.innerHTML = `${dados.descricaoDenuncia}`;
    }

    //Função para atualizar o status dos checkpoints da denúncia
    function renderizar_checkpoints(){
        
        for(let i = 0; i< (checkpoints.length) ; i++){
            const atual = document.querySelector(`#check${i+1}`)
            const proximo = document.querySelector(`#check${i+2}`);
            if(checkpoints[i].concluida === true){
                document.querySelector(`#check${i+1} svg circle`).setAttribute("fill", "black")
                atual.classList.remove("bg-ff5900")
                atual.classList.remove("rounded-5")
                atual.classList.remove("pt-1")
                atual.classList.remove("pb-2")
                atual.classList.remove("px-2")
                atual.classList.remove("me-2")
                atual.classList.remove("my-2")
                atual.classList.remove("text-light")
                document.querySelector(`#check${i+1} svg circle`).setAttribute("stroke", "black")
                if(proximo){
                    proximo.classList.add("bg-ff5900")
                    proximo.classList.add("rounded-5")
                    proximo.classList.add("pt-1")
                    proximo.classList.add("pb-2")
                    proximo.classList.add("px-2")
                    proximo.classList.add("me-2")
                    proximo.classList.add("my-2")
                    proximo.classList.add("text-light")
                    document.querySelector(`#check${i+2} svg circle`).setAttribute("stroke", "white")
                }
            }
        }
    }

    // Função da lógica da barra de progresso dos checkpoints da denúncia
    function renderiza_progresso(){
        let qt_concluidas=0
        for(let j = 1; j<checkpoints.length; j++){
            if(checkpoints[j].concluida ==true){
                qt_concluidas +=1
            }
        }
        let porcentagem = qt_concluidas/(checkpoints.length-1)*100
        progresso.style.width = `${porcentagem}%`
    }






    renderizar_checkpoints()
    atualiza_info()

//-------------------------------------------------------ANDAMENTO DA DENÚNCIA-----------------------------------------------------

    
    // Nomeia os checkpoints
    for(let i = 0; i< (checkpoints.length) ; i++){
        document.querySelector(`#check${i+1} span`).textContent = `${checkpoints[i].etapa}`;
    }

    //Lógica do botão de avança checkpoint
    document.getElementById("btn-avanca").addEventListener("click", () => {
        for(let i = 0; i<(checkpoints.length); i++){
            if((checkpoints[i].concluida === false) && (checkpoints[0].concluida === true)){
                checkpoints[i].concluida=true
                break
            }
        }
        renderizar_checkpoints()
        renderiza_progresso()
        atualiza_info()
    })

    // Lógica do botão de assumir ocorrência
    const btnStart = document.getElementById("btn-start");
    btnStart.addEventListener("click", () => {
        checkpoints[0].concluida=true;
        btnStart.classList.add("d-none");
        renderizar_checkpoints();
        atualiza_info()
    })


    

})
