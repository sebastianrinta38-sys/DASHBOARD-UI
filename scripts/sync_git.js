import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.js';
import fs from 'fs';
import path from 'path';

const dir = process.cwd();
const repoUrl = 'https://github.com/sebastianrinta38-sys/DASHBOARD-UI.git';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

async function syncGit() {
  console.log('=== INICIANDO SINCRONIZACIÓN CON GITHUB ===\n');

  // 1. Git Init
  console.log('1. Ejecutando git init...');
  await git.init({ fs, dir });
  console.log('✅ git init: OK\n');

  // 2. Remote Add
  console.log('2. Configurando git remote add origin...');
  try {
    await git.addRemote({ fs, dir, remote: 'origin', url: repoUrl });
    console.log('✅ git remote add origin: OK\n');
  } catch (e) {
    console.log(`ℹ️ git remote origin ya existe: ${e.message}\n`);
  }

  // 3. Fetch
  console.log('3. Ejecutando git fetch origin...');
  try {
    await git.fetch({
      fs,
      http,
      dir,
      remote: 'origin',
      depth: 1,
      tags: false,
    });
    console.log('✅ git fetch origin: OK\n');
  } catch (e) {
    console.log(`⚠️ git fetch origin advertencia: ${e.message}\n`);
  }

  // 4. Inspect Remote Main Commit Hash
  let remoteMainHash = '';
  try {
    remoteMainHash = await git.resolveRef({ fs, dir, ref: 'origin/main' });
    console.log(`📌 Hash del commit remoto actual en origin/main: ${remoteMainHash}\n`);
  } catch (e) {
    console.log(`ℹ️ No se pudo resolver origin/main previamente: ${e.message}\n`);
  }

  // 5. Stage Files (git add .)
  console.log('5. Ejecutando git add .');
  const filesToIgnore = ['.env.local', 'node_modules', 'dist', '.gemini', '.git'];

  function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      if (filesToIgnore.includes(file)) return;
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        getAllFiles(fullPath, arrayOfFiles);
      } else {
        const relPath = path.relative(dir, fullPath).replace(/\\/g, '/');
        arrayOfFiles.push(relPath);
      }
    });
    return arrayOfFiles;
  }

  const allFiles = getAllFiles(dir);
  for (const file of allFiles) {
    await git.add({ fs, dir, filepath: file });
  }
  console.log(`✅ git add .: ${allFiles.length} archivos agregados al staging\n`);

  // 6. Commit
  console.log('6. Ejecutando git commit...');
  let commitHash = '';
  try {
    const author = {
      name: 'Sebastián Rinta',
      email: 'sebastianrinta38@gmail.com',
      timestamp: Math.floor(Date.now() / 1000),
      timezoneOffset: 0,
    };
    
    // Check if parent commit exists
    let parent = [];
    if (remoteMainHash) {
      parent = [remoteMainHash];
    }

    commitHash = await git.commit({
      fs,
      dir,
      message: 'Feat: Catálogo de productos editable, Meta Ads CSV y Vercel Serverless API',
      author,
      committer: author,
      parent,
    });

    console.log(`✅ git commit: OK`);
    console.log(`🔑 HASH DEL COMMIT LOCAL GENERADO: ${commitHash}\n`);
  } catch (e) {
    console.log(`⚠️ Error durante git commit: ${e.message}\n`);
  }

  // 7. Push to origin main
  console.log('7. Intentando git push origin main...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      remoteRef: 'refs/heads/main',
      onAuth: () => ({ username: token || 'x-access-token' }),
    });
    console.log('✅ git push origin main: EXITOSO');
    console.log('Resultado:', JSON.stringify(pushResult, null, 2));
    console.log(`\n🎉 EL COMMIT MÁS RECIENTE SUBIDO A MAIN ES: ${commitHash}`);
  } catch (e) {
    console.log(`❌ Error durante git push: ${e.message}`);
    if (e.message.includes('HTTP 401') || e.message.includes('HTTP 403') || e.message.includes('Authentication') || e.message.includes('credentials')) {
      console.log('\n🔒 GitHub requiere un Personal Access Token (PAT) o autenticación para escribir en el repositorio.');
    }
  }
}

syncGit();
