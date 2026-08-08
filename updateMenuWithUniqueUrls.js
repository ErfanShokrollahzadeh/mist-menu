const fs = require('fs');
const path = require('path');

const menuPath = path.join(__dirname, 'src/data/menu.js');
let menuContent = fs.readFileSync(menuPath, 'utf8');

const categoryMap = {
  "Kahvaltı": "breakfast",
  "Omlet": "omelette",
  "Menemen": "eggs,tomato",
  "Gözleme": "crepe,pancake",
  "Tost": "toast",
  "Bowl": "salad,bowl",
  "Salatalar": "salad",
  "Sandviç": "sandwich",
  "Wrap & Quesedilla": "wrap,mexican",
  "Vegan": "vegan,food",
  "Aperatifler": "snack,fries",
  "Burgerler": "burger",
  "Makarna & Noodes": "pasta,noodles",
  "Pizzalar": "pizza",
  "Beyaz Etler": "chicken,meal",
  "Kırmızı Etler": "meat,steak",
  "Tatlılar": "dessert,cake",
  "Çay": "tea",
  "Soft İçecekler": "soda,drink",
  "Espresso Bazlı Kahveler": "espresso",
  "Filtre Kahveler": "coffee",
  "Redbull Kokteylleri": "cocktail,drink",
  "Sıcak İçecekler": "hot,drink",
  "Soğuk Kahveler": "iced,coffee",
  "Ev Yapımı Sıkmalar": "juice,drink",
  "Türk Kahveleri": "turkish,coffee",
  "Milkshake": "milkshake",
  "Frozen": "frozen,drink",
  "Smoothie Çeşitleri": "smoothie",
  "Mist Özel Kokteyller": "cocktail",
  "Nargileler": "hookah,shisha"
};

let globalIndex = 1;

let chunks = menuContent.split('category: "');
for (let i = 1; i < chunks.length; i++) {
  let chunk = chunks[i];
  let categoryName = chunk.substring(0, chunk.indexOf('"'));
  let keyword = categoryMap[categoryName] || "food";
  
  // Replace each item image in this category chunk
  chunk = chunk.replace(/image:\s*"[^"]+"/g, (match) => {
    let newUrl = `https://loremflickr.com/600/400/${keyword}?lock=${globalIndex++}`;
    return `image: "${newUrl}"`;
  });
  
  chunks[i] = chunk;
}

const finalContent = chunks.join('category: "');
fs.writeFileSync(menuPath, finalContent);

console.log(`Updated menu.js with ${globalIndex - 1} unique images.`);
