import { siteData, demonstrationUrl } from './site-data.js';

const $all = selector => document.querySelectorAll(selector);
const safeUrl = value => { if (typeof value !== 'string' || !value.trim()) return null; try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; } };
for (const [selector, value] of [['[data-name]', siteData.name], ['[data-short-name]', siteData.shortName], ['[data-role]', siteData.role], ['[data-location]', siteData.location], ['[data-bio]', siteData.bio], ['[data-background]', siteData.background], ['[data-email-display]', siteData.email]]) $all(selector).forEach(node => { node.textContent = value; });
const contactUrl = `${siteData.whatsapp}?text=${encodeURIComponent(`Olá, ${siteData.shortName}! Gostaria de conversar sobre uma solução digital para o meu negócio.`)}`;
for (const [selector, value] of [['[data-github-link]', siteData.github], ['[data-linkedin-link]', siteData.linkedin], ['[data-demo-link]', demonstrationUrl()], ['[data-contact-link]', contactUrl], ['[data-instagram-link]', siteData.instagram], ['[data-ritmo-link]', siteData.projects.find(project => project.id === 'ritmo')?.link], ['[data-renditro-link]', siteData.projects.find(project => project.id === 'renditro')?.link]]) {
  const href = safeUrl(value);
  $all(selector).forEach(node => { if (href) node.href = href; else node.hidden = true; });
}
const email = typeof siteData.email === 'string' && /^[^\s@?\r\n]+@[^\s@?\r\n]+\.[^\s@?\r\n]+$/.test(siteData.email) ? siteData.email : null;
$all('[data-email-link]').forEach(node => { if (email) node.href = `mailto:${email}?subject=${encodeURIComponent('Vamos conversar sobre uma solução digital')}`; else node.hidden = true; });
const skillList = document.getElementById('skill-list');
if (skillList) for (const skill of siteData.skills) { const item = document.createElement('span'); item.textContent = skill; skillList.append(item); }

const projectGrid = document.getElementById('project-grid');
const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
function professionalArtwork(project) {
  const frame = element('div', `case-window case-${project.visual}`);
  const chrome = element('div', 'case-chrome');
  const dots = element('span', 'code-dots'); for (let i = 0; i < 3; i++) dots.append(element('i'));
  chrome.append(dots, element('span', '', project.visual === 'workers' ? 'AUTOMAÇÃO / ARQUITETURA' : 'PROJETO / VISÃO CONCEITUAL'));
  frame.append(chrome, element('strong', 'case-title', project.visualTitle), element('p', 'case-subtitle', project.visualSubtitle));
  const canvas = element('div', 'case-canvas');
  if (project.visual === 'pipeline') {
    for (const stage of ['Base', 'Contato', 'Proposta']) {
      const column = element('div', 'mini-column'); column.append(element('span', '', stage), element('i'), element('i')); canvas.append(column);
    }
  } else if (project.visual === 'reader') {
    const page = element('div', 'mini-page'); for (let i = 0; i < 5; i++) page.append(element('i'));
    canvas.append(page, element('span', 'mini-annotation', 'PDF / marcar / anotar'));
  } else if (project.visual === 'education') {
    canvas.append(element('span', 'education-word', 'Aprender.\nExplorar.'));
    const tiles = element('div', 'education-tiles'); for (let i = 0; i < 4; i++) tiles.append(element('i')); canvas.append(tiles);
  } else if (project.visual === 'insights') {
    const chart = element('div', 'mini-chart'); for (let i = 0; i < 7; i++) chart.append(element('i'));
    canvas.append(chart, element('span', 'chart-label', 'Indicadores\n& relatórios'));
  } else if (project.visual === 'journey') {
    for (const step of ['Entrada', 'Páginas', 'Jornada']) canvas.append(element('span', 'journey-node', step));
  } else {
    canvas.append(element('span', 'orchestrator-node', 'Orquestrador'));
    const workers = element('div', 'worker-nodes'); for (let i = 0; i < 3; i++) workers.append(element('span', '', 'Worker')); canvas.append(workers);
  }
  frame.append(canvas, element('small', 'case-caption', 'ESQUEMA VISUAL · SEM DADOS REAIS'));
  return frame;
}
function renderProjects(filter = 'all') {
  if (!projectGrid) return;
  projectGrid.replaceChildren();
  const projects = siteData.projects.filter(project => filter === 'all' || project.type === filter);
  const counter = document.getElementById('project-count');
  if (counter) counter.textContent = `${projects.length} ${projects.length === 1 ? 'projeto para explorar' : 'projetos para explorar'}`;
  for (const project of projects) {
    const card = element('article', `project-card project-${project.type}`);
    const artwork = element('div', 'project-art');
    if (project.type === 'professional') {
      artwork.setAttribute('aria-hidden', 'true'); artwork.append(professionalArtwork(project));
    } else if (project.image) {
      const image = element('img'); image.src = new URL(project.image, import.meta.url).href; image.alt = 'Ilustração do conceito fictício Café Aurora'; image.loading = 'lazy'; image.width = 690; image.height = 680; artwork.append(image);
      artwork.append(element('span', 'project-art-title', 'café aurora'));
    } else if (project.type === 'published') {
      const preview = element('div', `app-preview app-${project.visual}`);
      const name = element('strong', '', project.title.toLowerCase());
      preview.append(element('span', 'app-preview-eyebrow', 'UM PROJETO PRÓPRIO'), name, element('p', '', project.id === 'ritmo' ? 'Pequenos hábitos.\nNovas possibilidades.' : 'Informação para\nseguir em frente.'));
      const blocks = element('div', 'app-preview-blocks');
      for (let i = 0; i < 7; i++) blocks.append(element('i'));
      preview.append(blocks, element('span', 'app-preview-caption', 'ABRA A APLICAÇÃO PARA CONHECER')); artwork.append(preview);
    } else {
      const code = element('div', 'code-illustration');
      const dots = element('div', 'code-dots'); for (let i = 0; i < 3; i++) dots.append(element('i')); code.append(dots);
      code.append(element('small', '', 'PAULOVRN12 / GITHUB'), element('strong', '', 'Uma ideia.\nMuitas conexões.'));
      const lines = element('div', 'code-lines'); for (const text of ['automação', 'IA aplicada', 'integrações']) lines.append(element('span', '', text)); code.append(lines); artwork.append(code);
    }
    const content = element('div', 'project-content');
    content.append(element('span', 'project-type', project.label), element('h3', '', project.title));
    if (project.access) content.append(element('span', 'project-access', project.access));
    content.append(element('p', 'project-description', project.description));
    if (project.contribution) {
      const contribution = element('div', 'project-contribution');
      contribution.append(element('small', '', 'MINHA ATUAÇÃO'), element('p', '', project.contribution)); content.append(contribution);
    }
    const tags = element('div', 'project-tags'); for (const tag of project.tags) tags.append(element('span', '', tag)); content.append(tags);
    const href = safeUrl(project.contact ? `${siteData.whatsapp}?text=${encodeURIComponent(`Olá, Paulo! Gostaria de conversar sobre o projeto ${project.title}.`)}` : project.id === 'cafe' ? demonstrationUrl() : project.link);
    const links = element('div', 'project-links');
    if (href) { const link = element('a', 'project-link', `${project.linkLabel} ↗`); link.href = href; link.target = '_blank'; link.rel = 'noreferrer'; links.append(link); }
    const secondaryHref = safeUrl(project.secondaryLink);
    if (secondaryHref) { const link = element('a', 'project-secondary-link', `${project.secondaryLinkLabel} ↗`); link.href = secondaryHref; link.target = '_blank'; link.rel = 'noreferrer'; links.append(link); }
    content.append(links);
    content.append(element('small', 'project-disclaimer', project.note)); card.append(artwork, content); projectGrid.append(card);
  }
}
renderProjects();
$all('[data-filter]').forEach(button => button.addEventListener('click', () => {
  $all('[data-filter]').forEach(other => { const selected = other === button; other.classList.toggle('selected', selected); other.setAttribute('aria-pressed', String(selected)); });
  renderProjects(button.dataset.filter);
}));
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('main-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => { const expanded = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(expanded)); nav.classList.toggle('open', expanded); });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); toggle.focus(); } });
}
