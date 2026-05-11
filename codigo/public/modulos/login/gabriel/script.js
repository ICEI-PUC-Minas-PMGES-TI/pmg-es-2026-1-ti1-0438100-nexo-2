let denuncias = [];

async function loadDenuncias() {
	try {
		const res = await fetch('dadostemporario.json');
		const data = await res.json();
		denuncias = data.denuncias || [];
		renderCards(denuncias);
	} catch (err) {
		console.error('Erro ao carregar denúncias', err);
	}
}

function formatDate(d) {
	return new Date(d).toLocaleDateString();
}

function renderCards(list) {
	const grid = document.getElementById('cardsGrid');
	grid.innerHTML = '';
	if (!list.length) {
		grid.innerHTML = '<div class="col-12"><p class="text-center text-muted">Nenhuma denúncia encontrada.</p></div>';
		return;
	}

	list.forEach(item => {
		const col = document.createElement('div');
		col.className = 'col-lg-6 col-md-12';

		const card = document.createElement('div');
		card.className = 'card h-100 shadow-sm border-0';
		card.style.backgroundColor = '#eaeaea';

		const cardBody = document.createElement('div');
		cardBody.className = 'card-body d-flex gap-3';
		cardBody.style.padding = '0.5rem';

		// imagem
		const imgDiv = document.createElement('div');
		imgDiv.className = 'flex-shrink-0';
		imgDiv.style.width = '70px';
		imgDiv.style.height = '45px';
		if (item.imagens && item.imagens[0]) {
			const img = document.createElement('img');
			img.src = item.imagens[0];
			img.alt = (item.titulo || item.descricaoDenuncia) || 'imagem denúncia';
			img.className = 'rounded';
			img.style.width = '70px';
			img.style.height = '45px';
			img.style.objectFit = 'cover';
			imgDiv.appendChild(img);
		}

		const contentDiv = document.createElement('div');
		contentDiv.className = 'flex-grow-1 d-flex flex-column';
		contentDiv.style.backgroundColor = '#eaeaea';

		// localizacao e status
		const headerDiv = document.createElement('div');
		headerDiv.className = 'd-flex justify-content-between align-items-start gap-2 mb-1';
		headerDiv.style.backgroundColor = '#eaeaea';
		headerDiv.style.padding = '0.3rem';

		const locationText = document.createElement('span');
		locationText.className = 'badge bg-light text-dark border border-light-subtle';
		locationText.textContent = (item.local && item.local.logradouro) ? item.local.logradouro : 'Local';

		const badge = document.createElement('span');
		const statusValue = (item.status === 'andamento' || item.status === 'em andamento') ? 'Em andamento' : 'Resolvida';
		badge.className = 'badge text-white flex-shrink-0';
		if (item.status === 'andamento' || item.status === 'em andamento') {
			badge.style.setProperty('background-color', '#FF5900', 'important');
		} else if (item.status === 'resolvida') {
			badge.style.setProperty('background-color', '#22c55e', 'important');
		}
		badge.style.fontSize = '14px';
		badge.style.padding = '0.5rem 0.75rem';
		badge.textContent = statusValue;

		headerDiv.appendChild(locationText);
		headerDiv.appendChild(badge);

		// titulo
		const titleDiv = document.createElement('h6');
		titleDiv.className = 'fw-bold mb-1 text-dark';
		titleDiv.style.backgroundColor = '#eaeaea';
		titleDiv.style.padding = '0.3rem';
		titleDiv.style.fontSize = '0.95rem';
		titleDiv.textContent = item.titulo || item.descricaoDenuncia;

		const metaDiv = document.createElement('div');
		metaDiv.className = 'd-flex gap-2 mb-1';
		metaDiv.style.backgroundColor = '#eaeaea';
		metaDiv.style.padding = '0.3rem';

		const chipDate = document.createElement('span');
		chipDate.className = 'badge bg-light text-dark border border-light-subtle';
		chipDate.textContent = formatDate(item.data);

		const chipUrg = document.createElement('span');
		chipUrg.className = 'badge bg-light text-dark border border-light-subtle';
		const urgenciaMap = { 'baixa': 'Baixa', 'media': 'Média', 'alta': 'Alta' };
		chipUrg.textContent = urgenciaMap[item.urgencia] || (item.urgencia ? item.urgencia : '');

		metaDiv.appendChild(chipDate);
		metaDiv.appendChild(chipUrg);

		// link do ver detalhes
		const detailsDiv = document.createElement('div');
		detailsDiv.className = 'mt-auto d-flex justify-content-end';
		detailsDiv.style.backgroundColor = '#eaeaea';
		detailsDiv.style.padding = '0.3rem';
		detailsDiv.innerHTML = '<a href="#" class="text-decoration-none small" style="color: black;">Ver detalhes </a>';

		contentDiv.appendChild(headerDiv);
		contentDiv.appendChild(titleDiv);
		contentDiv.appendChild(metaDiv);
		contentDiv.appendChild(detailsDiv);

		cardBody.appendChild(imgDiv);
		cardBody.appendChild(contentDiv);

		card.appendChild(cardBody);
		col.appendChild(card);
		grid.appendChild(col);
	});
}

function applyFilters() {
	const q = document.getElementById('globalSearch').value.trim().toLowerCase();
	const urgencia = document.getElementById('filterUrgencia').value;
	const dateOrder = document.getElementById('filterDate').value;

	let filtered = denuncias.filter(d => {
		let matchesQuery = true;
		if (q) {
			const hay = (d.titulo + ' ' + (d.descricao || '') + ' ' + (d.local && d.local.logradouro ? d.local.logradouro : '') + ' ' + (d.local && d.local.cidade ? d.local.cidade : '')).toLowerCase();
			matchesQuery = hay.includes(q);
		}
		let matchesUrg = urgencia ? d.urgencia === urgencia : true;
		return matchesQuery && matchesUrg;
	});

	if (dateOrder === 'newest') {
		filtered.sort((a, b) => new Date(b.data) - new Date(a.data));
	} else if (dateOrder === 'oldest') {
		filtered.sort((a, b) => new Date(a.data) - new Date(b.data));
	}

	renderCards(filtered);
}

function debounce(fn, wait = 250) {
	let t;
	return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
}

document.addEventListener('DOMContentLoaded', () => {
	loadDenuncias();

	const searchInput = document.getElementById('globalSearch');
	const selects = Array.from(document.querySelectorAll('.filter-select'));

	searchInput.addEventListener('input', debounce(() => applyFilters(), 250));
	selects.forEach(s => s.addEventListener('change', applyFilters));
});
