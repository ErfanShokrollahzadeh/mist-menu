const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'simplescraper-mistcafe-trqr-com-tr-2026-08-08T15-33-00.json');
const menuPath = path.join(__dirname, 'src/data/menu.js');

const scraperData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Map category-name to formatted image url
const categoryImages = {};
scraperData.forEach(entry => {
  let imgUrl = entry['category-image'];
  // fix the URL format
  imgUrl = imgUrl.replace('https://mistcafe.trqr.com.tr/../', 'https://mistcafe.trqr.com.tr/');
  categoryImages[entry['category-name']] = imgUrl;
});

let menuContent = fs.readFileSync(menuPath, 'utf8');

// The menu content has categories like: category: "Omlet", items: [ { name: "...", price: "...", description: "...", image: "/menu-images/..." }, ... ]
// We need to parse and replace the images. Since doing this with pure regex is tricky across lines, 
// let's split the file by 'category: "' and process each chunk.

let chunks = menuContent.split('category: "');
for (let i = 1; i < chunks.length; i++) {
  let chunk = chunks[i];
  let categoryName = chunk.substring(0, chunk.indexOf('"'));
  let img = categoryImages[categoryName];
  
  if (img) {
    // replace all occurrences of image: "/menu-images/..." with the category image
    chunks[i] = chunk.replace(/image: "\/menu-images\/[^"]+"/g, `image: "${img}"`);
  }
}

const finalContent = chunks.join('category: "');
fs.writeFileSync(menuPath, finalContent);

console.log('Applied scraper images based on categories.');
