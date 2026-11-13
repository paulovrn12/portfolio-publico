const STORAGE_KEY = 'cafe-aurora-demo-menu-v1';
const initialItems = [
  { id: 'espresso', name: 'Espresso da casa', description: 'Intenso, encorpado e com uma crema que faz toda a diferença.', price: 7, category: 'coffee', art: 'cup', label: 'O CLÁSSICO', color: 0 },
  { id: 'cappuccino', name: 'Cappuccino', description: 'Café, leite cremoso e uma delicada finalização de cacau.', price: 14, category: 'coffee', art: 'cup', label: 'QUERIDINHO', color: 1 },
  { id: 'latte', name: 'Latte de baunilha', description: 'A suavidade do leite com um toque doce de baunilha.', price: 17, category: 'special', art: 'glass', label: 'PARA DESACELERAR', color: 2 },
  { id: 'croissant', name: 'Croissant artesanal', description: 'Folhado por fora, macio por dentro. Uma boa companhia.', price: 12, category: 'bakery', art: 'bread', label: 'DA PADARIA', color: 3 },
  { id: 'coado', name: 'Café coado', description: 'Uma xícara leve e aromática para esticar a conversa.', price: 9, category: 'coffee', art: 'cup', label: 'SEM PRESSA', color: 3 },
  { id: 'mocha', name: 'Mocha gelado', description: 'Café, chocolate e leite numa combinação refrescante.', price: 19, category: 'special', art: 'glass', label: 'UMA NOVA PAUSA', color: 0 },
  { id: 'pao', name: 'Pão de queijo', description: 'Douradinho, leve e perfeito para acompanhar seu café.', price: 8, category: 'bakery', art: 'cheese', label: 'AFETO EM FORMA DE PÃO', color: 1 },
  { id: 'bolo', name: 'Bolo de laranja', description: 'Uma fatia de aconchego com sabor de receita de casa.', price: 13, category: 'bakery', art: 'cake', label: 'UM TOQUE DE DOÇURA', color: 2 },
].map(item => ({ ...item, available: true }));

const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const $ = selector => document.querySelector(selector);
let menu = loadMenu();
let category = 'all';
let search = '';
const cart = new Map();
const dialogTriggers = new WeakMap();
let toastTimeout;

function loadMenu() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!Array.isArray(stored)) return initialItems.map(item => ({ ...item }));
    return initialItems.map(item => {
      const value = stored.find(row => row?.id === item.id);
      return { ...item, price: typeof value?.price === 'number' && Number.isFinite(value.price) && value.price >= 0.5 && value.price <= 1000 ? Math.round(value.price * 100) / 100 : item.price, available: typeof value?.available === 'boolean' ? value.available : true };
    });
  } catch { return initialItems.map(item => ({ ...item })); }
}

function showToast(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimeout = setTimeout(() => { $('#toast').hidden = true; }, 3600);
}

function openDialog(id, trigger = document.activeElement) {
  const dialog = document.getElementById(id);
  if (!dialog || dialog.open) return;
  dialogTriggers.set(dialog, trigger);
  dialog.showModal();
  dialog.querySelector('[data-close]')?.focus();
}

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => dialogTriggers.get(dialog)?.focus());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.open, button)));

function productArt(type) {
  const top = '<svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="80" cy="126" rx="50" ry="10" fill="#b6a185" opacity=".18"/>';
  const cup = '<ellipse cx="79" cy="116" rx="55" ry="15" fill="#eee3cc" stroke="#cdbd9d"/><path d="M112 64h12c21 0 22 32 1 36h-17" stroke="#ece0c7" stroke-width="9"/><path d="M39 62h77l-8 44c-5 23-53 23-60 0Z" fill="#f7eedb"/><ellipse cx="78" cy="62" rx="39" ry="15" fill="#ead9b6"/><ellipse cx="78" cy="62" rx="33" ry="11" fill="#9d6037"/><path d="M78 69c-10-5-19-11-11-14 5-2 9 2 11 5 3-7 12-8 13-3 2 5-8 9-13 12Z" fill="#f5e4c5"/><path d="M61 40c-10-12 10-15 0-27m22 26c-7-9 8-13 1-22" stroke="#fff9ec" stroke-width="3" stroke-linecap="round" opacity=".8"/>';
  const glass = '<path d="m48 31 8 87c1 15 46 15 48 0l8-87Z" fill="#e2d8bc" stroke="#c4ad87" stroke-width="2"/><path d="m51 52 6 64c1 13 45 13 46 0l6-64Z" fill="#a37551"/><path d="m55 76 2 40c1 13 45 13 46 0l4-40Z" fill="#d3bb92"/><ellipse cx="80" cy="51" rx="28" ry="8" fill="#f4e8d1"/><ellipse cx="80" cy="31" rx="32" ry="8" fill="#f6ebd4" stroke="#c4ad87"/><path d="m88 44 11-33" stroke="#737b60" stroke-width="5" stroke-linecap="round"/><path d="M65 86v24" stroke="#fff7dc" stroke-width="3" stroke-linecap="round" opacity=".5"/>';
  const bread = '<ellipse cx="80" cy="111" rx="60" ry="19" fill="#f2e8d5" stroke="#d6c8ac"/><path d="M25 99c3-25 17-47 35-47 9 0 13 5 20 7 11-9 19-11 29-5 15 9 27 27 27 43 0 13-15 18-23 9-9 12-21 11-32 4-11 8-23 6-30-5-12 11-25 7-26-6Z" fill="#ce944b"/><path d="M45 101c0-16 4-30 12-41m9 47c-2-16 0-30 3-42m17 45c5-18 7-29 6-43m14 37c6-14 6-23 3-31" stroke="#9b612e" stroke-width="5" stroke-linecap="round" opacity=".8"/><path d="m45 78 6-10m22 0 7-2m20 6 5 4" stroke="#f0ca84" stroke-width="4" stroke-linecap="round"/>';
  const cheese = '<ellipse cx="80" cy="116" rx="58" ry="17" fill="#f0e5d0" stroke="#d3c2a3"/><circle cx="54" cy="91" r="25" fill="#d5a65f"/><circle cx="104" cy="92" r="25" fill="#dbb16f"/><circle cx="79" cy="67" r="26" fill="#e4bf7d"/><path d="m40 87 8-6m18-17 6-6m26 33 7-5" stroke="#f5dfae" stroke-width="5" stroke-linecap="round"/><path d="m52 103 7-3m21-20 6-3m17 21 6-3" stroke="#b58546" stroke-width="4" stroke-linecap="round"/>';
  const cake = '<ellipse cx="80" cy="119" rx="58" ry="16" fill="#f0e5d0" stroke="#d3c2a3"/><path d="m38 77 51-29 34 45-47 27-38-11Z" fill="#d3a055"/><path d="m38 77 38 14 47-27-34-16Z" fill="#e9c989"/><path d="m76 91 47-27v29l-47 27Z" fill="#ddb470"/><path d="m39 78 37 13 47-27" stroke="#faf0d6" stroke-width="5" stroke-linejoin="round"/><path d="m53 93 9 3m30-1 9-5m-12 14 9-5" stroke="#c89c58" stroke-width="2" stroke-linecap="round"/><path d="M86 55c-8-12-21-10-24-1 6 4 12 6 20 3" fill="#7e8a60"/>';
  return top + ({ cup, glass, bread, cheese, cake }[type] || cup) + '</svg>';
}

function renderMenu() {
  const filtered = menu.filter(item => (category === 'all' || item.category === category) && normalize(`${item.name} ${item.description}`).includes(normalize(search)));
  const grid = $('#menu-grid');
  grid.replaceChildren();
  $('#menu-result').textContent = `${filtered.length} ${filtered.length === 1 ? 'item encontrado' : 'itens no cardápio'} · valores ilustrativos`;
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-menu'; empty.textContent = 'Essa pausa ainda não está no cardápio. Tente outro nome ou categoria.'; grid.append(empty); return;
  }
  for (const item of filtered) {
    const card = document.createElement('article');
    card.className = `product-card${item.available ? '' : ' is-unavailable'}`;
    const art = document.createElement('div'); art.className = `product-art variant-${item.color}`;
    // A ilustração é código próprio constante; conteúdo editável nunca entra como HTML.
    art.innerHTML = productArt(item.art);
    const label = document.createElement('span'); label.className = 'product-label'; label.textContent = item.label; art.append(label);
    const content = document.createElement('div'); content.className = 'product-content';
    const heading = document.createElement('h3'); heading.textContent = item.name;
    const description = document.createElement('p'); description.className = 'product-description'; description.textContent = item.description;
    const bottom = document.createElement('div'); bottom.className = 'product-bottom';
    const price = document.createElement('span'); price.className = 'product-price'; price.textContent = money(item.price); bottom.append(price);
    if (item.available) {
      const add = document.createElement('button'); add.className = 'add-button'; add.type = 'button'; add.textContent = '+'; add.setAttribute('aria-label', `Adicionar ${item.name} ao pedido simulado`);
      add.addEventListener('click', () => { changeQuantity(item.id, 1); showToast(`${item.name} adicionado à simulação.`); }); bottom.append(add);
    } else {
      const unavailable = document.createElement('span'); unavailable.className = 'unavailable'; unavailable.textContent = 'Indisponível'; bottom.append(unavailable);
    }
    content.append(heading, description, bottom); card.append(art, content); grid.append(card);
  }
}

function changeQuantity(id, delta) {
  const item = menu.find(item => item.id === id);
  if (!item || !item.available) return;
  const next = Math.max(0, Math.min(20, (cart.get(id) || 0) + delta));
  if (next) cart.set(id, next); else cart.delete(id);
  $('#simulation-result').hidden = true;
  renderCart();
}

function renderCart() {
  const activeControl = document.activeElement;
  const restoreCartFocus = $('#cart-dialog').contains(activeControl);
  const activeLabel = activeControl?.getAttribute('aria-label');
  const container = $('#cart-items'); container.replaceChildren();
  let total = 0, count = 0;
  for (const [id, quantity] of cart) {
    const item = menu.find(item => item.id === id);
    if (!item || !item.available) { cart.delete(id); continue; }
    count += quantity; total += item.price * quantity;
    const row = document.createElement('div'); row.className = 'cart-row';
    const info = document.createElement('div'); const name = document.createElement('h3'); name.textContent = item.name;
    const value = document.createElement('small'); value.textContent = `${money(item.price)} por unidade · ${money(item.price * quantity)}`; info.append(name, value);
    const controls = document.createElement('div'); controls.className = 'quantity-controls';
    for (const [text, delta] of [['−', -1], ['+', 1]]) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = text; button.setAttribute('aria-label', `${delta === 1 ? 'Aumentar' : 'Diminuir'} quantidade de ${item.name}`);
      button.disabled = delta === 1 && quantity >= 20;
      button.addEventListener('click', () => { changeQuantity(id, delta); }); controls.append(button);
      if (delta === -1) { const label = document.createElement('span'); label.textContent = quantity; label.setAttribute('aria-label', `${quantity} unidades`); controls.append(label); }
    }
    row.append(info, controls); container.append(row);
  }
  if (!count) { const empty = document.createElement('p'); empty.className = 'empty-cart'; empty.textContent = 'Sua pausa começa com uma escolha no cardápio.'; container.append(empty); }
  $('#cart-count').textContent = count;
  $('#cart-total').textContent = money(total);
  $('#finish-simulation').disabled = count === 0;
  if (restoreCartFocus) {
    const replacement = [...container.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === activeLabel && !button.disabled);
    (replacement || $('#cart-dialog [data-close]')).focus();
  }
}

document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
  renderMenu();
}));
$('#menu-search').addEventListener('input', event => { search = event.target.value; renderMenu(); });
$('#cart-open').addEventListener('click', event => { renderCart(); openDialog('cart-dialog', event.currentTarget); });
$('#finish-simulation').addEventListener('click', () => { $('#simulation-result').hidden = false; $('#finish-simulation').disabled = true; });

function renderManage() {
  const fields = $('#manage-fields'); fields.replaceChildren();
  $('#manage-error').hidden = true;
  for (const item of menu) {
    const row = document.createElement('div'); row.className = 'manage-row';
    const name = document.createElement('span'); name.textContent = item.name;
    const label = document.createElement('label'); label.className = 'price-input'; label.textContent = 'R$';
    const input = document.createElement('input'); input.type = 'number'; input.min = '0.50'; input.max = '1000'; input.step = '0.01'; input.required = true; input.value = item.price.toFixed(2); input.name = `price-${item.id}`; input.setAttribute('aria-label', `Preço ilustrativo de ${item.name}`); label.append(input);
    const availability = document.createElement('label'); availability.className = 'availability-input';
    const check = document.createElement('input'); check.type = 'checkbox'; check.name = `available-${item.id}`; check.checked = item.available; availability.append(check, document.createTextNode('Disponível')); check.setAttribute('aria-label', `${item.name} disponível`);
    row.append(name, label, availability); fields.append(row);
  }
}
$('#manage-open').addEventListener('click', event => { renderManage(); openDialog('manage-dialog', event.currentTarget); });
$('#manage-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const next = menu.map(item => {
      const price = Number(form.elements.namedItem(`price-${item.id}`).value);
      if (!Number.isFinite(price) || price < 0.5 || price > 1000) throw new Error('Informe preços entre R$ 0,50 e R$ 1.000,00.');
      return { ...item, price: Math.round(price * 100) / 100, available: form.elements.namedItem(`available-${item.id}`).checked };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map(({ id, price, available }) => ({ id, price, available }))));
    menu = next; renderMenu(); renderCart(); $('#manage-dialog').close(); showToast('Exemplo atualizado somente neste navegador.');
  } catch (error) {
    $('#manage-error').textContent = error.name === 'QuotaExceededError' || error.name === 'SecurityError' ? 'O navegador bloqueou o armazenamento local. Nenhuma alteração foi salva.' : error.message;
    $('#manage-error').hidden = false;
  }
});
$('#reset-menu').addEventListener('click', () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch { $('#manage-error').textContent = 'Não foi possível restaurar o armazenamento local.'; $('#manage-error').hidden = false; return; }
  menu = initialItems.map(item => ({ ...item })); cart.clear(); renderMenu(); renderCart(); renderManage(); showToast('O exemplo original foi restaurado neste navegador.');
});
$('#copy-project').addEventListener('click', async () => {
  const text = 'Tenho interesse em um site com cardápio digital. Quero conversar sobre meu fluxo atual, páginas necessárias, quem atualizará o conteúdo, prazo, orçamento e manutenção. A referência é a demonstração fictícia Café Aurora, sem pedidos ou pagamentos reais.';
  try { await navigator.clipboard.writeText(text); $('#copy-feedback').textContent = 'Roteiro copiado. Nenhuma mensagem foi enviada.'; }
  catch { $('#copy-feedback').textContent = text; }
  $('#copy-feedback').hidden = false;
});
renderMenu(); renderCart();
