fetch("detalhes.json").then(res => res.json()).then((data) => {
    const dados = data.denuncias[0];
    const categoria = data.categorias.find(c => c.id === dados.categoria_id);
    document.getElementById("category").textContent = `Categoria: ${categoria.nome}`;
    const urgencia = data.urgencias.find(u => u.id === dados.urgencia_id);
    document.getElementById("urgency").textContent = `Urgência: ${urgencia.tipo}`



    const date =  document.getElementById("date");
    date.innerHTML = `Data da denúncia: ${dados.data}`;
    const denunciante = document.getElementById("user");
    denunciante.innerHTML = `Denunciante: ${dados.denunciante_cpf}`
    const localizacao = document.getElementById("location");
    localizacao.innerHTML = `Localização: ${dados.local.cidade}, ${dados.local.estado}`
    const instituicao = document.getElementById("organ");
    instituicao.innerHTML = `Órgão resp.: ${dados.instituicao}`
    const prazo = document.getElementById("term");
    prazo.innerHTML = `Prazo estimado: ${dados.prazo}`
    const afetados = document.getElementById("affected");
    afetados.innerHTML = `Pessoas afetadas: ${dados.afetados}`
    const custo = document.getElementById("cost")
    custo.innerHTML = `Custo estimado: R$${dados.custo}`
})