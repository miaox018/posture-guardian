// Chrome扩展诊断工具
const fs = require('fs');
const path = require('path');

console.log('🔍 Chrome扩展诊断开始...\n');

const distPath = path.join(__dirname, '../dist');
const errors = [];
const warnings = [];

// 1. 检查manifest.json
function checkManifest() {
  console.log('📋 检查 manifest.json...');
  
  const manifestPath = path.join(distPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push('manifest.json 不存在');
    return;
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // 检查图标文件
  const icons = manifest.action?.default_icon || {};
  Object.entries(icons).forEach(([size, iconPath]) => {
    const fullPath = path.join(distPath, iconPath);
    if (!fs.existsSync(fullPath)) {
      errors.push(`图标文件不存在: ${iconPath}`);
    }
  });
  
  // 检查Content Script
  const contentScripts = manifest.content_scripts || [];
  contentScripts.forEach(script => {
    script.js.forEach(jsFile => {
      const fullPath = path.join(distPath, jsFile);
      if (!fs.existsSync(fullPath)) {
        errors.push(`Content Script文件不存在: ${jsFile}`);
      }
    });
  });
  
  // 检查Service Worker
  if (manifest.background?.service_worker) {
    const swPath = path.join(distPath, manifest.background.service_worker);
    if (!fs.existsSync(swPath)) {
      errors.push(`Service Worker文件不存在: ${manifest.background.service_worker}`);
    }
  }
  
  console.log('✅ manifest.json 检查完成');
}

// 2. 检查图标一致性
function checkIconConsistency() {
  console.log('🎨 检查图标一致性...');
  
  // 检查background script中的图标路径
  const chunks = fs.readdirSync(path.join(distPath, 'chunks')).filter(f => f.startsWith('index.ts.') && f.endsWith('.js'));
  
  chunks.forEach(chunk => {
    const content = fs.readFileSync(path.join(distPath, 'chunks', chunk), 'utf8');
    
    // 检查是否有.png引用但实际文件是.bmp
    if (content.includes('.png') && content.includes('assets/icons/')) {
      warnings.push(`${chunk} 中发现 .png 图标引用，但实际文件可能是 .bmp`);
    }
  });
  
  console.log('✅ 图标一致性检查完成');
}

// 3. 检查Content Script导出
function checkContentScriptExports() {
  console.log('📜 检查Content Script导出...');
  
  const loaderFiles = fs.readdirSync(path.join(distPath, 'assets')).filter(f => f.includes('loader'));
  
  loaderFiles.forEach(loader => {
    const content = fs.readFileSync(path.join(distPath, 'assets', loader), 'utf8');
    
    if (content.includes('onExecute')) {
      console.log(`✅ ${loader} 包含 onExecute 导出`);
    } else {
      errors.push(`${loader} 缺少 onExecute 导出`);
    }
  });
  
  console.log('✅ Content Script导出检查完成');
}

// 4. 检查构建产物完整性
function checkBuildOutput() {
  console.log('🏗️ 检查构建产物...');
  
  const requiredFiles = [
    'manifest.json',
    'service-worker-loader.js',
    'src/popup/index.html',
    'src/options/index.html'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(distPath, file))) {
      errors.push(`必需文件缺失: ${file}`);
    }
  });
  
  // 检查chunks目录
  if (!fs.existsSync(path.join(distPath, 'chunks'))) {
    errors.push('chunks 目录不存在');
  } else {
    const chunks = fs.readdirSync(path.join(distPath, 'chunks'));
    if (chunks.length === 0) {
      errors.push('chunks 目录为空');
    }
  }
  
  console.log('✅ 构建产物检查完成');
}

// 5. 检查文件权限和可访问性
function checkFilePermissions() {
  console.log('🔒 检查文件权限...');
  
  // 这在Windows上较少见，但在Unix系统上很重要
  try {
    fs.accessSync(distPath, fs.constants.R_OK);
    console.log('✅ dist目录可读');
  } catch (err) {
    errors.push('dist目录不可读');
  }
}

// 执行所有检查
function runDiagnosis() {
  checkManifest();
  checkIconConsistency();
  checkContentScriptExports();
  checkBuildOutput();
  checkFilePermissions();
  
  // 输出结果
  console.log('\n📊 诊断结果:');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('🎉 所有检查通过！扩展应该可以正常工作。');
  } else {
    if (errors.length > 0) {
      console.log(`\n❌ 发现 ${errors.length} 个错误:`);
      errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log(`\n⚠️ 发现 ${warnings.length} 个警告:`);
      warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }
  }
  
  console.log('\n🔧 建议的修复步骤:');
  if (errors.some(e => e.includes('图标'))) {
    console.log('  1. 检查图标文件路径和格式');
  }
  if (errors.some(e => e.includes('onExecute'))) {
    console.log('  2. 确保Content Script正确导出onExecute函数');
  }
  if (errors.some(e => e.includes('Service Worker'))) {
    console.log('  3. 检查Service Worker配置和构建');
  }
}

// 运行诊断
runDiagnosis(); 