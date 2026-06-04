const fs = require('fs');
const path = 'c:/Users/Pc/Documents/Example/Projects/Outreach_AI/Logo/Example.png';
const buffer = fs.readFileSync(path);
const base64 = buffer.toString('base64');
console.log(`data:image/png;base64,${base64}`);
