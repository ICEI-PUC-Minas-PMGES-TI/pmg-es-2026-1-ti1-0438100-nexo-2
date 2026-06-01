const PAGE_SIZE = 30;
let denuncias = [];
let filteredDenuncias = [];
let visibleCount = PAGE_SIZE;

async function loadDenuncias() {
	try {
		const res = await fetch('dadostemporario.json');
		const data = await res.json();
		denuncias = data.denuncias || [];
		filteredDenuncias = denuncias;
		visibleCount = PAGE_SIZE;
		renderCards(filteredDenuncias);
	} catch (err) {
		console.error('Erro ao carregar denúncias', err);
	}
}

function formatDate(d) {
	return new Date(d).toLocaleDateString();
}

function updateLoadMore(total) {
	const wrapper = document.getElementById('loadMoreWrapper');
	const text = document.getElementById('loadMoreText');
	const button = document.getElementById('loadMoreBtn');
	if (!wrapper || !text || !button) {
		return;
	}

	if (total > PAGE_SIZE && total > visibleCount) {
		const remaining = total - visibleCount;
		text.textContent = `Existem mais ${remaining} denúncia${remaining === 1 ? '' : 's'}. Clique em carregar mais.`;
		wrapper.hidden = false;
		button.disabled = false;
		return;
	}

	wrapper.hidden = true;
}

function renderCards(list) {
	const grid = document.getElementById('cardsGrid');
	grid.innerHTML = '';
	if (!list.length) {
		grid.innerHTML = '<div class="col-12"><p class="text-center text-muted">Nenhuma denúncia encontrada.</p></div>';
		updateLoadMore(0);
		return;
	}

	const visibleList = list.slice(0, visibleCount);
	visibleList.forEach(item => {
		const col = document.createElement('div');
		col.className = 'col-lg-6 col-md-12';

		const card = document.createElement('div');
		card.className = 'card h-100 shadow-sm border-0';
		card.style.backgroundColor = '#eaeaea';
		card.style.borderRadius = '18px';
		card.style.boxShadow = '0 22px 40px rgba(0, 0, 0, 0.5)';

		const cardBody = document.createElement('div');
		cardBody.className = 'card-body d-flex gap-3';
		cardBody.style.padding = '0.5rem';

		// imagem
		const imgDiv = document.createElement('div');
		imgDiv.className = 'flex-shrink-0';
		imgDiv.style.width = '190px';
		imgDiv.style.height = '110px';
		if (item.imagens && item.imagens[0]) {
			const img = document.createElement('img');
			img.src = item.imagens[0];
			img.alt = (item.titulo || item.descricaoDenuncia) || 'imagem denúncia';
			img.className = 'rounded';
			img.style.width = '190px';
			img.style.height = '110px';
			img.style.objectFit = 'cover';
			img.style.borderRadius = '12px';
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
		const locationIcon = document.createElement('span');
		locationIcon.style.display = 'inline-flex';
		locationIcon.style.alignItems = 'center';
		locationIcon.style.marginRight = '6px';
		locationIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="12" height="12" aria-hidden="true" focusable="false"><path fill="currentColor" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 272a80 80 0 1 1 0-160 80 80 0 1 1 0 160z"/></svg>';
		locationText.appendChild(locationIcon);
		locationText.appendChild(document.createTextNode((item.local && item.local.logradouro) ? item.local.logradouro : 'Local'));

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
		badge.style.border = '1px solid rgba(0, 0, 0, 0.15)';
		badge.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.25)';
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
		const dateIcon = document.createElement('span');
		dateIcon.style.display = 'inline-flex';
		dateIcon.style.alignItems = 'center';
		dateIcon.style.marginRight = '6px';
		dateIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="12" height="12" aria-hidden="true" focusable="false"><path fill="currentColor" d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 32 0c35.3 0 64 28.7 64 64l0 288c0 35.3-28.7 64-64 64l-320 0c-35.3 0-64-28.7-64-64l0-288c0-35.3 28.7-64 64-64l32 0 0-32c0-17.7 14.3-32 32-32zM64 192l0 224 320 0 0-224-320 0z"/></svg>';
		chipDate.appendChild(dateIcon);
		chipDate.appendChild(document.createTextNode(formatDate(item.data)));

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

	updateLoadMore(list.length);
}

function applyFilters() {
	const q = document.getElementById('globalSearch').value.trim().toLowerCase();
	const categoria = document.getElementById('filterCategoria').value;
	const urgencia = document.getElementById('filterUrgencia').value;
	const dateOrder = document.getElementById('filterDate').value;

	let filtered = denuncias.filter(d => {
		let matchesQuery = true;
		if (q) {
			const hay = (d.titulo + ' ' + (d.descricao || '') + ' ' + (d.local && d.local.logradouro ? d.local.logradouro : '') + ' ' + (d.local && d.local.cidade ? d.local.cidade : '')).toLowerCase();
			matchesQuery = hay.includes(q);
		}
		let matchesCat = categoria ? d.categoria === categoria : true;
		let matchesUrg = urgencia ? d.urgencia === urgencia : true;
		return matchesQuery && matchesCat && matchesUrg;
	});

	if (dateOrder === 'newest') {
		filtered.sort((a, b) => new Date(b.data) - new Date(a.data));
	} else if (dateOrder === 'oldest') {
		filtered.sort((a, b) => new Date(a.data) - new Date(b.data));
	}

	filteredDenuncias = filtered;
	visibleCount = PAGE_SIZE;
	renderCards(filteredDenuncias);
}

function debounce(fn, wait = 250) {
	let t;
	return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
}

document.addEventListener('DOMContentLoaded', () => {
	loadDenuncias();

	const searchInput = document.getElementById('globalSearch');
	const selects = Array.from(document.querySelectorAll('.filter-select'));
	const loadMoreBtn = document.getElementById('loadMoreBtn');

	searchInput.addEventListener('input', debounce(() => applyFilters(), 250));
	selects.forEach(s => s.addEventListener('change', applyFilters));
	if (loadMoreBtn) {
		loadMoreBtn.addEventListener('click', () => {
			visibleCount = Math.min(visibleCount + PAGE_SIZE, filteredDenuncias.length);
			renderCards(filteredDenuncias);
		});
	}
});
