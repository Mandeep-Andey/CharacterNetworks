
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/combined_chapters_all_books_1_86_merged_final.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const keys = Object.keys(rawData);
console.log('Total keys:', keys.length);
console.log('Sample keys:', keys.slice(0, 10));
console.log('Does "Chapter 2" exist?', keys.includes("Chapter 2"));
console.log('Does "Chapter 13" exist?', keys.includes("Chapter 13"));

// Check for any weird keys
const weirdKeys = keys.filter(k => !k.match(/^Chapter \d+$/));
if (weirdKeys.length > 0) {
    console.log('Weird keys:', weirdKeys);
} else {
    console.log('All keys match "Chapter \\d+" format.');
}
