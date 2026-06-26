const PAGE_SIZE = 30;
let denuncias = [];
let filteredDenuncias = [];
let visibleCount = PAGE_SIZE;

const STATUS_MAP    = { 1: 'resolvida', 2: 'andamento' };
const URGENCIA_LABEL = { 1: 'Alta', 2: 'Média', 3: 'Baixa' };
const URGENCIA_KEY  = { 1: 'alta', 2: 'media', 3: 'baixa' };
const CATEGORIA_KEY = {
    1: 'buraco',
    2: 'esgoto',
    3: 'deslizamento',
    4: 'limpeza',
    5: 'iluminacao'
};

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

function parseDate(str) {
    if (!str) return null;
    const [d, m, y] = str.split('/');
    return new Date(`${y}-${m}-${d}`);
}

function formatDate(str) {
    const date = parseDate(str);
    return date ? date.toLocaleDateString('pt-BR') : '—';
}

function updateLoadMore(total) {
    const wrapper = document.getElementById('loadMoreWrapper');
    const text    = document.getElementById('loadMoreText');
    const button  = document.getElementById('loadMoreBtn');
    if (!wrapper || !text || !button) return;

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
        const statusStr  = STATUS_MAP[item.status_id] || 'andamento';
        const urgLabel   = URGENCIA_LABEL[item.urgencia_id] || '';
        const dataStr    = formatDate(item.dataPublicacao);

        const col = document.createElement('div');
        col.className = 'col-lg-6 col-md-12';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm border-0';
        card.style.cssText = 'background-color:#eaeaea;border-radius:18px;box-shadow:0 22px 40px rgba(0,0,0,.5)';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex gap-3';
        cardBody.style.padding = '0.5rem';

        const imgDiv = document.createElement('div');
        imgDiv.className = 'flex-shrink-0';
        imgDiv.style.cssText = 'width:190px;height:110px';
        if (item.imagens && item.imagens[0]) {
            const img = document.createElement('img');
            img.src = item.imagens[0];
            img.alt = item.titulo || 'imagem denúncia';
            img.className = 'rounded';
            img.style.cssText = 'width:190px;height:110px;object-fit:cover;border-radius:12px';
            imgDiv.appendChild(img);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex-grow-1 d-flex flex-column';
        contentDiv.style.backgroundColor = '#eaeaea';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'd-flex justify-content-between align-items-start gap-2 mb-1';
        headerDiv.style.cssText = 'background-color:#eaeaea;padding:0.3rem';

        const locationText = document.createElement('span');
        locationText.className = 'badge bg-light text-dark border border-light-subtle';
        locationText.innerHTML = `<span style="display:inline-flex;align-items:center;margin-right:6px">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="12" height="12"><path fill="currentColor" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 272a80 80 0 1 1 0-160 80 80 0 1 1 0 160z"/></svg>
        </span>${item.local?.logradouro || 'Local'}`;

        const badge = document.createElement('span');
        badge.className = 'badge text-white flex-shrink-0';
        badge.style.cssText = 'font-size:14px;padding:0.5rem 0.75rem;border:1px solid rgba(0,0,0,.15);box-shadow:0 6px 12px rgba(0,0,0,.25)';
        if (statusStr === 'andamento') {
            badge.style.backgroundColor = '#FF5900';
            badge.textContent = 'Em andamento';
        } else {
            badge.style.backgroundColor = '#22c55e';
            badge.textContent = 'Resolvida';
        }

        headerDiv.appendChild(locationText);
        headerDiv.appendChild(badge);

        const titleDiv = document.createElement('h6');
        titleDiv.className = 'fw-bold mb-1 text-dark';
        titleDiv.style.cssText = 'background-color:#eaeaea;padding:0.3rem;font-size:0.95rem';
        titleDiv.textContent = item.titulo || item.descricaoDenuncia;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'd-flex gap-2 mb-1';
        metaDiv.style.cssText = 'background-color:#eaeaea;padding:0.3rem';

        const chipDate = document.createElement('span');
        chipDate.className = 'badge bg-light text-dark border border-light-subtle';
        chipDate.innerHTML = `<span style="display:inline-flex;align-items:center;margin-right:6px">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="12" height="12"><path fill="currentColor" d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 32 0c35.3 0 64 28.7 64 64l0 288c0 35.3-28.7 64-64 64l-320 0c-35.3 0-64-28.7-64-64l0-288c0-35.3 28.7-64 64-64l32 0 0-32c0-17.7 14.3-32 32-32zM64 192l0 224 320 0 0-224-320 0z"/></svg>
        </span>${dataStr}`;

        const chipUrg = document.createElement('span');
        chipUrg.className = 'badge bg-light text-dark border border-light-subtle';
        chipUrg.textContent = urgLabel;

        metaDiv.appendChild(chipDate);
        metaDiv.appendChild(chipUrg);

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'mt-auto d-flex justify-content-end';
        detailsDiv.style.cssText = 'background-color:#eaeaea;padding:0.3rem';
        detailsDiv.innerHTML = '<a href="#" class="text-decoration-none small" style="color:black">Ver detalhes</a>';

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
    const q         = document.getElementById('globalSearch').value.trim().toLowerCase();
    const categoria = document.getElementById('filterCategoria').value;  // ex: "infraestrutura"
    const urgencia  = document.getElementById('filterUrgencia').value;   // ex: "alta"
    const dateOrder = document.getElementById('filterDate').value;

    let filtered = denuncias.filter(d => {
        const hay = [
            d.titulo,
            d.descricaoDenuncia,
            d.local?.logradouro,
            d.local?.cidade
        ].filter(Boolean).join(' ').toLowerCase();

        const matchesQuery    = q ? hay.includes(q) : true;
        const matchesCat      = categoria ? CATEGORIA_KEY[d.categoria_id] === categoria : true;
        const matchesUrg      = urgencia  ? URGENCIA_KEY[d.urgencia_id]  === urgencia  : true;

        return matchesQuery && matchesCat && matchesUrg;
    });

    if (dateOrder === 'newest') {
        filtered.sort((a, b) => parseDate(b.dataPublicacao) - parseDate(a.dataPublicacao));
    } else if (dateOrder === 'oldest') {
        filtered.sort((a, b) => parseDate(a.dataPublicacao) - parseDate(b.dataPublicacao));
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

    document.getElementById('globalSearch')
        .addEventListener('input', debounce(applyFilters, 250));

    document.querySelectorAll('.filter-select')
        .forEach(s => s.addEventListener('change', applyFilters));

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleCount = Math.min(visibleCount + PAGE_SIZE, filteredDenuncias.length);
            renderCards(filteredDenuncias);
        });
    }
});