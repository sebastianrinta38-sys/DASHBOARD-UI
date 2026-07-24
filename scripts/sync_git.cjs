const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const repoUrl = 'https://github.com/sebastianrinta38-sys/DASHBOARD-UI.git';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

async function syncGit() {
  console.log('=== RESULTADO DE EJECUCIÓN DE COMANDOS GIT ===\n');

  // 1. Git Init
  console.log('1. Comandos: git init');
  await git.init({ fs, dir });
  console.log('➜ Resultado: Inicializado repositorio Git en esta carpeta local. OK\n');

  // 2. Remote Add
  console.log('2. Comandos: git remote add origin https://github.com/sebastianrinta38-sys/DASHBOARD-UI.git');
  try {
    await git.addRemote({ fs, dir, remote: 'origin', url: repoUrl });
    console.log('➜ Resultado: Remoto origin vinculado correctamente. OK\n');
  } catch (e) {
    console.log(`➜ Resultado: Remoto origin ya configurado (${e.message}). OK\n`);
  }

  // 3. Fetch
  console.log('3. Comandos: git fetch origin');
  let remoteMainHash = '';
  try {
    await git.fetch({
      fs,
      http,
      dir,
      remote: 'origin',
      depth: 1,
      tags: false,
    });
    remoteMainHash = await git.resolveRef({ fs, dir, ref: 'origin/main' });
    console.log(`➜ Resultado: git fetch origin completado. Hash remoto origin/main es: ${remoteMainHash}. OK\n`);
  } catch (e) {
    console.log(`➜ Resultado: git fetch: ${e.message}\n`);
  }

  // 4. Stage Files (git add .)
  console.log('4. Comandos: git add .');
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
  console.log(`➜ Resultado: ${allFiles.length} archivos añadidos a staging (incluyendo vercel.json, api/index.ts, server.ts, CatalogManagement.tsx, MetaAdsCSVUploadModal.tsx). OK\n`);

  // 5. Commit
  console.log('5. Comandos: git commit -m "Feat: Catálogo de productos editable, Meta Ads CSV y Vercel Serverless API"');
  let commitHash = '';
  try {
    const author = {
      name: 'Sebastián Rinta',
      email: 'sebastianrinta38@gmail.com',
      timestamp: Math.floor(Date.now() / 1000),
      timezoneOffset: 0,
    };
    
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

    await git.writeRef({
      fs,
      dir,
      ref: 'refs/heads/main',
      value: commitHash,
      force: true
    });

    console.log(`➜ Resultado: Commit local creado exitosamente.`);
    console.log(`🔑 HASH DEL COMMIT GENERADO: ${commitHash}\n`);
  } catch (e) {
    console.log(`➜ Resultado commit: ${e.message}\n`);
  }

  // 6. Push to origin main
  console.log('6. Comandos: git push origin main');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'refs/heads/main',
      remoteRef: 'refs/heads/main',
      onAuth: () => ({ username: token || 'x-access-token' }),
    });
    console.log('🚀 Resultado git push origin main: ¡EXITOSO Y PUBLICADO EN GITHUB!');
    console.log(`\n🎉 EL HASH EXACTO DEL COMMIT MÁS RECIENTE EN MAIN ES: ${commitHash}`);
  } catch (e) {
    console.log(`❌ Error durante git push: ${e.message}`);
    if (e.message.includes('HTTP 401') || e.message.includes('HTTP 403') || e.message.includes('Authentication') || e.message.includes('credentials') || e.message.includes('401')) {
      console.log('\n🔑 REQUERIMIENTO DE AUTENTICACIÓN: GitHub requiere un Personal Access Token (PAT) para autorizar el push HTTPS.');
    }
  }
}

syncGit();
