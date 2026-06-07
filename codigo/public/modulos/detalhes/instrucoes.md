# Zella — Tela de detalhes

## Como rodar o projeto para avaliação

### Pré-requisitos

- Node.js instalado
- JSON Server instalado

### Passo a passo

1. Clone o repositório ou extraia os arquivos do projeto

2. Navegue até a pasta do projeto no terminal (pasta `\codigo`):

> Clique com o botão direito na pasta e selecione "Open in Integrated Terminal" (ou "Abrir no Terminal Integrado"). O caminho exibido no terminal deve terminar com `\codigo`.

3. Instale as dependências:

```bash
npm install
```
4. Inicie o servidor:

```bash
npm start
```
5. Acesse o projeto no navegador:
```text
http://localhost:3000/modulos/detalhes/detalhes.html?id=1  (para a denúncia 1 do JSON)
```

```text
http://localhost:3000/modulos/detalhes/detalhes.html?id=2  (para a denúncia 2 do JSON)
```

```text
http://localhost:3000/modulos/detalhes/detalhes.html?id=3  (para a denúncia 3 do JSON)
```

> O `npm start` sobe o json-server, que serve tanto a API (`db/db.json`) quanto os arquivos estáticos da pasta `public/`.