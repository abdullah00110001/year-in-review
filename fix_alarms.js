const fs = require('fs');

function replaceContent(file, regex, replacement, name) {
    if (!fs.existsSync(file)) {
        console.log(`❌ ${name}: ফাইলটি পাওয়া যায়নি!`);
        return;
    }
    let code = fs.readFileSync(file, 'utf8');
    if (regex.test(code)) {
        code = code.replace(regex, replacement);
        fs.writeFileSync(file, code, 'utf8');
        console.log(`✅ ${name}: সফলভাবে রিমুভ/আপডেট হয়েছে!`);
    } else {
        console.log(`ℹ️  ${name}: কোডটি ফাইলে নেই (হয়তো আগে থেকেই রিমুভ করা)।`);
    }
}

// 1. Rise.tsx - Setup Button
replaceContent(
    'src/pages/Rise.tsx',
    /\{\s*isNative\s*&&\s*\(\s*<Button[^>]*onClick=\{requestAllRisePermissions\}[^>]*>\s*Setup Alarm Permissions\s*<\/Button>\s*\)\s*\}/g,
    '',
    'Rise.tsx (Setup Button)'
);

// 2. RiseAlarmList.tsx - Warning Card
replaceContent(
    'src/components/rise/RiseAlarmList.tsx',
    /\{\s*!permissionsOk\s*&&\s*\(\s*<Card[^>]*>[\s\S]*?Grant Permissions\s*<\/Button>\s*<\/CardContent>\s*<\/Card>\s*\)\s*\}/g,
    '',
    'RiseAlarmList.tsx (Warning Card)'
);

// 3. RiseAlarmList.tsx - Blocker
replaceContent(
    'src/components/rise/RiseAlarmList.tsx',
    /if\s*\(!permissionsOk\)\s*\{\s*const granted = await requestAllAlarmPermissions\(\);\s*if\s*\(!granted\)\s*\{\s*toast\.error\('Enable permissions from Settings for alarms to work'\);\s*return;\s*\}\s*setPermissionsOk\(true\);\s*\}/g,
    '',
    'RiseAlarmList.tsx (Save Blocker)'
);

// 4. RiseAlarmEditor.tsx - Warning Div
replaceContent(
    'src/components/rise/RiseAlarmEditor.tsx',
    /\{\s*!permissionsOk\s*&&\s*\(\s*<div[^>]*bg-destructive[\s\S]*?Grant Permissions\s*<\/Button>\s*<\/div>\s*\)\s*\}/g,
    '',
    'RiseAlarmEditor.tsx (Warning Div)'
);

// 5. RiseAlarmEditor.tsx - Blocker to Warning Update
const newLogic = `if (!permissionsOk) {\n      toast.warning('Please enable exact alarm permissions for perfect timing!');\n      requestAllAlarmPermissions();\n    }`;
replaceContent(
    'src/components/rise/RiseAlarmEditor.tsx',
    /if\s*\(!permissionsOk\)\s*\{\s*const granted = await requestAllAlarmPermissions\(\);\s*if\s*\(!granted\)\s*\{\s*toast\.error\('Enable permissions from Settings for alarms to work'\);\s*return;\s*\}\s*setPermissionsOk\(true\);\s*\}/g,
    newLogic,
    'RiseAlarmEditor.tsx (Save Logic Update)'
);

console.log('\n🎉 পারমিশন ব্লকারের ঝামেলা শেষ!');
