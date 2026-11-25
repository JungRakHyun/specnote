#!/usr/bin/env node
/**
 * SpecNote (스펙노트) — GitHub Pages (gh-pages 브랜치) 자동 빌드 & 배포 스크립트
 * 커스텀 도메인 연결 시 CNAME 환경변수 또는 SITE_URL/BASE_PATH를 지정하면 자동 반영됩니다.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const siteUrl = process.env.SITE_URL || 'https://jungrakhyun.github.io';
const basePath = process.env.BASE_PATH || '/specnote';
const customDomain = process.env.CUSTOM_DOMAIN || '';

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, 'dist');

function run(cmd, cwd = repoRoot, env = process.env) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd, env });
}

// 1. 프로덕션 빌드 (배포 URL/Base 적용)
run('npm run seo:audit');
run('npm run build', repoRoot, {
  ...process.env,
  SITE_URL: siteUrl,
  BASE_PATH: basePath,
});

// 2. GitHub Pages 필수 파일 (.nojekyll, 선택 CNAME)
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
if (customDomain) {
  fs.writeFileSync(path.join(distDir, 'CNAME'), `${customDomain.trim()}\n`);
}

// 3. 원격 URL 확인 후 dist/를 gh-pages 브랜치로 배포
const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
if (!remoteUrl) {
  console.error('❌ origin 원격 저장소가 설정되어 있지 않습니다.');
  process.exit(1);
}

const deployDate = new Date().toISOString().replace('T', ' ').slice(0, 19);
run('git init -b gh-pages', distDir);
run('git add -A', distDir);
run(`git commit -m "deploy: SpecNote site (${deployDate} UTC)"`, distDir);
run(`git push -f "${remoteUrl}" gh-pages:gh-pages`, distDir);

// 임시 dist/.git 정리
fs.rmSync(path.join(distDir, '.git'), { recursive: true, force: true });

const liveUrl = `${siteUrl.replace(/\/+$/, '')}${basePath === '/' ? '/' : `${basePath.replace(/\/+$/, '')}/`}`;
console.log(`\n🚀 배포 완료! 약 20~60초 후 아래 주소에서 확인할 수 있습니다:\n   ${liveUrl}\n`);
