const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'daveb', 'Documents', 'Programming', 'Personal Project', 'Aura\'s', 'Aura-3', 'src', 'components', 'DailyPickModal.tsx');
const content = fs.readFileSync(filePath);
console.log("First 100 bytes in hex:");
console.log(content.slice(0, 100).toString('hex'));
console.log("First 100 characters:");
console.log(content.slice(0, 100).toString('utf8'));
