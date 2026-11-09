import { publicLinksManager } from '../engine/public_links_manager.js';

publicLinksManager.links.set('route_aura_intelligence', {
  id: 'route_aura_intelligence',
  category: 'Projetos de Superinteligência',
  title: 'AURA INTELLIGENCE — Criação De Agência De IA Global',
  path: '/aura-intelligence',
  fullUrl: 'https://nexusearthai.com/aura-intelligence',
  status: 'ATIVO',
  accessType: 'PUBLICO',
  allowEdit: true,
  allowBlock: true,
  description: 'Página oficial de alta conversão da Agência Global de IA, com planos de contratação (US$ 2.400 e US$ 8.900/mês), LLMO, GEO e auditoria neural.',
  viewsCount: 215,
  createdAt: new Date().toISOString()
});

publicLinksManager.saveState();
console.log('Successfully registered AURA INTELLIGENCE! Total links:', publicLinksManager.links.size);
