const fs = require('fs');
function patch(file) {
  if (!fs.existsSync(file)) return;
  let s = fs.readFileSync(file, 'utf8');

  // أضف 'use client' إن لم تكن موجودة
  if (!/^'use client'/.test(s)) s = `'use client';\n` + s;

  // حوّل named import إلى default أينما وُجد
  s = s.replace(/import\s*\{\s*useMatchingQueue\s*\}\s*from\s*(['"][^'"]*useMatchingQueue[^'"]*['"]);?/g,
                "import useMatchingQueue from $1;");

  // لو ما في أي استيراد، أضفه بعد أول مجموعة import
  if (!/useMatchingQueue\s+from\s+['"]/.test(s)) {
    const idx = s.indexOf('\n', s.lastIndexOf("import "));
    s = s.slice(0, idx+1) + `import useMatchingQueue from '@/hooks/useMatchingQueue';\n` + s.slice(idx+1);
  }

  fs.writeFileSync(file, s);
  console.log('patched', file);
}
['src/app/chat/page.tsx', 'src/app/match-test/page.tsx'].forEach(patch);
console.log('done');
