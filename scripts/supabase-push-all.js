#!/usr/bin/env node
/**
 * Tüm local migration'ları Supabase remote veritabanına uygular.
 * Çalıştırmadan önce: npx supabase login ve npx supabase link --project-ref <PROJECT_REF>
 *
 * Kullanım: node scripts/supabase-push-all.js
 * veya:     npm run supabase:push
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

function run(cmd, options = {}) {
  const defaultOptions = { stdio: 'inherit', cwd: projectRoot, shell: isWindows };
  return spawnSync(cmd, [], { ...defaultOptions, ...options });
}

function runCapture(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: projectRoot, shell: isWindows });
  } catch (e) {
    return e.stderr?.toString() || e.stdout?.toString() || e.message || '';
  }
}

console.log('Supabase: Tüm migration\'lar remote\'a uygulanıyor...\n');

// 1. CLI kontrolü
const versionOut = runCapture('npx supabase --version 2>&1');
if (!versionOut || versionOut.includes('not found') || versionOut.includes('Cannot find module')) {
  console.error('Hata: Supabase CLI bulunamadı. Önce çalıştırın: npm install -g supabase');
  process.exit(1);
}
console.log('Supabase CLI:', versionOut.trim());

// 2. Link kontrolü (config veya .temp ile)
const configPath = path.join(projectRoot, 'supabase', '.temp', 'project-ref');
let linked = false;
try {
  const fs = require('fs');
  if (fs.existsSync(configPath)) linked = true;
  const configToml = path.join(projectRoot, 'supabase', 'config.toml');
  if (fs.existsSync(configToml)) linked = true;
} catch (_) {}

// 3. db push (include-all: remote geçmişinde olmayan tüm migration'ları uygula)
const pushResult = run('npx supabase db push --include-all', { stdio: 'inherit', shell: true });

if (pushResult.status !== 0) {
  const msg = String(pushResult.stderr || pushResult.stdout || '');
  if (
    msg.includes('not linked') ||
    msg.includes('linked project') ||
    msg.includes('link') ||
    msg.includes('project ref') ||
    msg.includes('Could not find')
  ) {
    console.error('\n---');
    console.error('Proje henüz linkli değil. Önce şunları çalıştırın:');
    console.error('  npx supabase login');
    console.error('  npx supabase link --project-ref itvrvouaxcutpetyzhvg');
    console.error('Sonra bu script\'i tekrar çalıştırın: npm run supabase:push');
    console.error('---\n');
  }
  process.exit(pushResult.status);
}

console.log('\nTamamlandı. Tüm migration\'lar Supabase\'e uygulandı.');
