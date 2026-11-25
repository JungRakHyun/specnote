#!/usr/bin/env node
/**
 * 원클릭 자동 발행 파이프라인:
 * 1) SEO & 공정위 고지 자동 검수 (seo:audit)
 * 2) main 브랜치 변경사항 커밋 & 푸시
 * 3) 프로덕션 빌드 및 gh-pages 브랜치 자동 배포
 * 4) IndexNow 색인 요청 (키 설정 시)
 */
import { execSync } from 'node:child_process';

function run(cmd, options = {}) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...options });
}

const msgArgIndex = process.argv.indexOf('--message');
const commitMsg =
  msgArgIndex !== -1 && process.argv[msgArgIndex + 1]
    ? process.argv[msgArgIndex + 1]
    : `publish: auto update SpecNote posts (${new Date().toISOString().slice(0, 10)})`;

const skipGit = process.argv.includes('--no-git');

run('npm run seo:audit');

if (!skipGit) {
  const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (status) {
    run('git add -A');
    run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
  }
  const remotes = execSync('git remote', { encoding: 'utf8' }).trim();
  if (remotes) {
    run('git push origin main');
    run('npm run deploy');
  } else {
    run('npm run build');
    console.log('\n✅ 로컬 커밋 및 빌드 완료 (원격 저장소 연결 후 자동 배포됩니다).');
  }
} else {
  run('npm run build');
}

run('npm run indexnow');
