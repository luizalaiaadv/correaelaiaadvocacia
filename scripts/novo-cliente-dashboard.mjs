#!/usr/bin/env node
// Troca a marca do dashboard de leads ao replicar para outro cliente.
//
// NAO toca em logica nem em variaveis de ambiente: so substitui os textos da
// marca (nome do escritorio, titulos, manifest, salt) nos arquivos do dashboard
// de um repo ja copiado. As imagens (logo, textura, icones) sao manuais.
//
// Uso:
//   node scripts/novo-cliente-dashboard.mjs \
//     --dir "../adv-fernanda-romano" \
//     --nome "Fernanda Romano Advocacia" \
//     --curto "Fernanda Romano" \
//     --sigla "FR" \
//     --slug "fernandaromano"

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key?.startsWith('--')) continue;
    args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const required = ['dir', 'nome', 'curto', 'sigla', 'slug'];
const missing = required.filter((k) => !args[k]);

if (missing.length > 0) {
  console.error(`Faltam argumentos: ${missing.join(', ')}\n`);
  console.error('Uso:');
  console.error('  node scripts/novo-cliente-dashboard.mjs \\');
  console.error('    --dir "../adv-fernanda-romano" \\');
  console.error('    --nome "Fernanda Romano Advocacia" \\');
  console.error('    --curto "Fernanda Romano" \\');
  console.error('    --sigla "FR" \\');
  console.error('    --slug "fernandaromano"');
  process.exit(1);
}

const target = resolve(process.cwd(), args.dir);
if (!existsSync(join(target, 'app', 'dashboard'))) {
  console.error(`"${target}" nao parece ter o dashboard (app/dashboard nao encontrado).`);
  console.error('Copie os arquivos do dashboard para o repo do cliente antes de rodar o script.');
  process.exit(1);
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;');

// Substituicoes do maior para o menor, para o nome curto nao clobberar o completo.
const REPLACEMENTS = [
  ['Correa &amp; Laia Advocacia', escapeHtml(args.nome)],
  ['Correa & Laia Advocacia', args.nome],
  ['Correa &amp; Laia', escapeHtml(args.curto)],
  ['Correa & Laia', args.curto],
  ['C&L Leads', `${args.sigla} Leads`],
  ['correaelaia-dashboard', `${args.slug}-dashboard`],
];

// So os arquivos do dashboard carregam a marca. O site publico nao e tocado.
const FILES = [
  'app/dashboard/dashboard-client.tsx',
  'app/dashboard/login/login-form.tsx',
  'app/dashboard/login/page.tsx',
  'app/dashboard/page.tsx',
  'lib/dashboard-auth.ts',
  'public/manifest.webmanifest',
  'public/offline.html',
];

let totalTrocas = 0;
for (const rel of FILES) {
  const path = join(target, rel);
  if (!existsSync(path)) {
    console.warn(`  aviso: ${rel} nao existe no destino — pulando`);
    continue;
  }
  let content = readFileSync(path, 'utf8');
  let trocasNoArquivo = 0;
  for (const [from, to] of REPLACEMENTS) {
    const parts = content.split(from);
    if (parts.length > 1) {
      trocasNoArquivo += parts.length - 1;
      content = parts.join(to);
    }
  }
  if (trocasNoArquivo > 0) {
    writeFileSync(path, content);
    totalTrocas += trocasNoArquivo;
    console.log(`  ${rel}: ${trocasNoArquivo} troca(s)`);
  }
}

console.log(`\nMarca trocada: ${totalTrocas} substituicao(oes) em ${FILES.length} arquivo(s).`);
console.log('\nAINDA FALTA (manual):');
console.log(`  1. Trocar as imagens em ${args.dir}/public/:`);
console.log('     logofooter.webp, texture-bg.webp, icon-192.png, icon-512.png,');
console.log('     icon-maskable-512.png, apple-touch-icon.png');
console.log('  2. Preencher o .env.local (Typebot, senha, Supabase).');
console.log('  3. Criar a tabela no Supabase:');
console.log('       create table if not exists public.contacted_leads (');
console.log('         lead_id text primary key,');
console.log('         contacted_at timestamptz not null default now()');
console.log('       );');
console.log('       alter table public.contacted_leads enable row level security;');
console.log('  4. Cadastrar as 5 variaveis na Vercel (Production + Preview) e fazer deploy.');
console.log('\nDetalhes: docs/REPLICAR-DASHBOARD.md');
