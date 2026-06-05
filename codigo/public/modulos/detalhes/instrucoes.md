# Zella — Plataforma de Denúncias de Infraestrutura Urbana

## Como rodar o projeto

### Pré-requisitos

- Node.js instalado

### Passo a passo

1. Clone o repositório ou extraia os arquivos do projeto

2. Abra o terminal na raiz do repositório e navegue até a pasta do projeto (pasta `pmg-es-2026-1-ti1-0438100-nexo-2\codigo`):

```bash
cd codigo
```

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