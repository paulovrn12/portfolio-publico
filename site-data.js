// Informações profissionais retiradas do perfil público; revisar antes da primeira publicação.
export const siteData = {
  name: 'Paulo Victor Ribeiro Naves',
  shortName: 'Paulo Victor',
  role: 'Automação, IA aplicada e soluções web',
  location: 'Goiânia, Goiás · Brasil',
  bio: 'Atuo na interseção entre automação de processos, inteligência artificial aplicada, integrações e dados. Meu foco é construir soluções que reduzam trabalho manual, conectem sistemas e tornem a operação mais simples.',
  background: 'Minha experiência também inclui e-commerce, marketplaces e operações digitais. Trabalho com ferramentas como n8n, Python, JavaScript, APIs e dashboards para transformar uma necessidade concreta em uma solução útil.',
  github: 'https://github.com/paulovrn12',
  linkedin: 'https://www.linkedin.com/in/paulo-victor-ribeiro-naves-7531bb1b8',
  email: 'contato@paulovictorrn.tech',
  whatsapp: 'https://wa.me/5562996656392',
  instagram: 'https://www.instagram.com/paulovictorrn/',
  website: 'https://paulovictorrn.tech',
  demoUrl: 'https://cafe-demo.paulovictorrn.tech',
  demoPreviewPath: '/demos/cafe-conceito/',
  skills: ['n8n', 'Python', 'JavaScript', 'TypeScript', 'APIs & webhooks', 'Docker', 'Metabase'],
  projects: [
    { id: 'ritmo', type: 'published', label: 'Aplicação publicada', title: 'Ritmo', description: 'Uma aplicação para organizar e acompanhar hábitos. Um projeto próprio que aproxima interface, rotina e desenvolvimento de produto.', tags: ['React', 'TypeScript', 'Hábitos'], link: 'https://ritmo.forbidone.online/', linkLabel: 'Abrir Ritmo', visual: 'habit', note: 'Explore a aplicação e conheça a experiência.' },
    { id: 'renditro', type: 'published', label: 'Aplicação publicada', title: 'Renditro', description: 'Calculadoras para comparar combustíveis, avaliar flex e estimar custos de viagem. Um projeto próprio para apoiar escolhas do dia a dia.', tags: ['React', 'TypeScript', 'Calculadoras'], link: 'https://renditro.forbidone.online/', linkLabel: 'Abrir Renditro', visual: 'fuel', note: 'Aplicação com acesso público. Os cálculos dependem dos dados informados.' },
    { id: 'cafe', type: 'demo', label: 'Demonstração conceitual', title: 'Café Aurora', description: 'Site e cardápio digital para uma cafeteria fictícia. Explore a busca, as categorias, a sacola simulada e a edição local do cardápio.', tags: ['Site responsivo', 'Cardápio digital', 'JavaScript'], linkLabel: 'Explorar demonstração', image: 'demos/cafe-conceito/coffee-hero.svg', note: 'Negócio fictício. Sem pedidos ou pagamentos reais.' },
    { id: 'github', type: 'profile', label: 'Perfil público', title: 'Código, ferramentas e contexto', description: 'Minha apresentação profissional no GitHub reúne tecnologias, áreas de atuação e contexto sobre os projetos que desenvolvo.', tags: ['GitHub', 'Automação', 'Integrações'], link: 'https://github.com/paulovrn12', linkLabel: 'Conhecer meu GitHub', note: 'Tecnologias, áreas de atuação e contexto profissional.' },
  ],
  source: 'https://github.com/paulovrn12/paulovrn12/blob/main/README.md',
};

export function demonstrationUrl() {
  return ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
    ? new URL(siteData.demoPreviewPath, location.origin).href
    : siteData.demoUrl;
}
