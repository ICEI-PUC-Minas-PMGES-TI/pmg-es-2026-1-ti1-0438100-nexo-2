const PAGE_SIZE = 30;
let denuncias = [];
let filteredDenuncias = [];
let visibleCount = PAGE_SIZE;

let categoriasMap = {};
let urgenciasMap = {};
let statusMap = {};


async function loadDenuncias() {
    try {
        const res = await fetch('http://localhost:3000/denuncias');
        const data = await res.json();
        denuncias = Array.isArray(data) ? data : (data.denuncias || []);
        if (!Array.isArray(data)) {
            categoriasMap = Object.fromEntries(
                (data.categorias || []).map(c => [c.id, c.nome])
            );
            urgenciasMap = Object.fromEntries(
                (data.urgencias || []).map(u => [u.id, u.tipo])
            );
            statusMap = Object.fromEntries(
                (data.status || []).map(s => [s.id, s.status])
            );
        }
        filteredDenuncias = denuncias;
        visibleCount = PAGE_SIZE;
        renderCards(filteredDenuncias);
    } catch (err) {
        console.error('Erro ao carregar denúncias', err);
    }
}

function parseDate(str) {
    if (!str || str === "null") return null;
    const [d, m, y] = str.split('/');
    if (!d || !m || !y) return null;
    return new Date(`${y}-${m}-${d}`);
}

function formatDate(str) {
    const date = parseDate(str);
    return date ? date.toLocaleDateString('pt-BR') : '—';
}

function updateLoadMore(total) {
    const wrapper = document.getElementById('loadMoreWrapper');
    const text = document.getElementById('loadMoreText');
    const button = document.getElementById('loadMoreBtn');

    if (!wrapper || !text || !button) return;

    if (total > visibleCount) {
        const remaining = total - visibleCount;
        text.textContent = `Existem mais ${remaining} denúncia${remaining === 1 ? '' : 's'}. Clique em carregar mais.`;
        wrapper.hidden = false;
        button.disabled = false;
    } else {
        wrapper.hidden = true;
    }
}

function renderCards(list) {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';

    if (!list.length) {
        grid.innerHTML = `
            <div class="col-12">
                <p class="text-center text-muted">Nenhuma denúncia encontrada.</p>
            </div>
        `;
        updateLoadMore(0);
        return;
    }

    const visibleList = list.slice(0, visibleCount);

    visibleList.forEach(item => {
        const statusStr = statusMap[item.status_id] || 'Em aberto';
        const urgLabel = urgenciasMap[item.urgencia_id] || '—';
        const dataStr = formatDate(item.dataPublicacao);

        let statusLabel = statusStr;
        let statusColor = '#f59e0b';

        if (statusStr.toLowerCase().includes('andamento')) {
            statusLabel = 'Em andamento';
            statusColor = '#FF5900';
        } 
        else if (
            statusStr.toLowerCase().includes('conclu') ||
            statusStr.toLowerCase().includes('final')
        ) {
            statusLabel = 'Concluída';
            statusColor = '#22c55e';
        }

        const col = document.createElement('div');
        col.className = 'col-lg-6 col-md-12';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm border-0';
        card.style.cssText = 'background-color:#eaeaea;border-radius:18px;box-shadow:0 22px 40px rgba(0,0,0,.5)';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex gap-3';
        cardBody.style.padding = '0.5rem';

        const imgDiv = document.createElement('div');
        imgDiv.style.cssText = 'width:190px;height:110px;flex-shrink:0';

        if (item.imagens?.length) {
            const img = document.createElement('img');
            img.src = item.imagens[0];
            img.alt = item.titulo || 'denúncia';
            img.style.cssText = 'width:190px;height:110px;object-fit:cover;border-radius:12px';
            imgDiv.appendChild(img);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex-grow-1 d-flex flex-column';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'd-flex justify-content-between align-items-start gap-2 mb-1';

        const locationText = document.createElement('span');
        locationText.className = 'badge bg-light text-dark border';
        locationText.innerHTML = `
            📍 ${item.local?.logradouro || 'Local'}
        `;

        const badge = document.createElement('span');
        badge.className = 'badge text-white';
        badge.style.cssText = `
            font-size:14px;
            padding:0.5rem 0.75rem;
            background:${statusColor};
        `;
        badge.textContent = statusLabel;

        headerDiv.appendChild(locationText);
        headerDiv.appendChild(badge);

        const title = document.createElement('h6');
        title.className = 'fw-bold mb-1 text-dark';
        title.textContent = item.titulo || item.descricaoDenuncia;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'd-flex gap-2 mb-1';

        const chipDate = document.createElement('span');
        chipDate.className = 'badge bg-light text-dark border';
        chipDate.textContent = dataStr;

        const chipUrg = document.createElement('span');
        chipUrg.className = 'badge bg-light text-dark border';
        chipUrg.textContent = urgLabel;

        metaDiv.appendChild(chipDate);
        metaDiv.appendChild(chipUrg);

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'mt-auto d-flex justify-content-end';

        detailsDiv.innerHTML = `
            <a href="/modulos/detalhes/detalhes.html?id=${item.id}" class="text-decoration-none small" style="color:black">
                Ver detalhes
            </a>
        `;

        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(title);
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

        const hay = [
            d.titulo,
            d.descricaoDenuncia,
            d.local?.logradouro,
            d.local?.cidade
        ].filter(Boolean).join(' ').toLowerCase();

        const matchesQuery = q ? hay.includes(q) : true;

        // 🔥 AGORA COMPARA ID DIRETO (CORRETO)
        const matchesCat = categoria
            ? String(d.categoria_id) === String(categoria)
            : true;

        const matchesUrg = urgencia
            ? String(d.urgencia_id) === String(urgencia)
            : true;

        return matchesQuery && matchesCat && matchesUrg;
    });

    if (dateOrder === 'newest') {
        filtered.sort((a, b) =>
            parseDate(b.dataPublicacao) - parseDate(a.dataPublicacao)
        );
    } else if (dateOrder === 'oldest') {
        filtered.sort((a, b) =>
            parseDate(a.dataPublicacao) - parseDate(b.dataPublicacao)
        );
    }

    filteredDenuncias = filtered;
    visibleCount = PAGE_SIZE;

    renderCards(filteredDenuncias);
}

function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    loadDenuncias();

    document.getElementById('globalSearch')
        .addEventListener('input', debounce(applyFilters, 250));

    document.querySelectorAll('.filter-select')
        .forEach(el => el.addEventListener('change', applyFilters));
});