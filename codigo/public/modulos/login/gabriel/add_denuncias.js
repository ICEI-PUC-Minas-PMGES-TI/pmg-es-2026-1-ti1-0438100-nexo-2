const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'dadostemporario.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const categories = ['buraco', 'iluminacao', 'esgoto', 'deslizamento', 'limpeza'];
const urgencias = ['alta', 'media', 'baixa'];
const status = ['andamento', 'resolvida'];
const cidades = ['Belo Horizonte', 'Betim', 'Ribeirão das Neves', 'Contagem', 'Sabará'];
const logradouros = ['Avenida Firmo de Matos', 'Avenida Edmeia', 'Avenida Professor Mário', 'Rua das Flores', 'Avenida Brasil'];
const usuarios = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Luisa', 'Miguel', 'Sofia', 'Lucas', 'Isabela'];

const nextId = Math.max(...data.denuncias.map(d => d.id)) + 1;

for (let i = 0; i < 40; i++) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 60));
  
  data.denuncias.push({
    id: nextId + i,
    status: status[Math.floor(Math.random() * status.length)],
    categoria: categories[Math.floor(Math.random() * categories.length)],
    descricaoDenuncia: 'Descrição da denúncia número ' + (nextId + i) + '...',
    titulo: 'Problema na ' + logradouros[Math.floor(Math.random() * logradouros.length)],
    imagens: ['./img temporario/foto1.jpeg', './img temporario/foto2.webp'],
    urgencia: urgencias[Math.floor(Math.random() * urgencias.length)],
    data: date.toISOString().split('T')[0],
    entidadeDirecionada: ['Prefeitura', 'Empresas', 'Todos'][Math.floor(Math.random() * 3)],
    denunciante: { usuario: usuarios[Math.floor(Math.random() * usuarios.length)] },
    local: {
      cidade: cidades[Math.floor(Math.random() * cidades.length)],
      estado: 'MG',
      logradouro: logradouros[Math.floor(Math.random() * logradouros.length)]
    }
  });
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
console.log('Adicionadas 40 denúncias. Total:', data.denuncias.length);
