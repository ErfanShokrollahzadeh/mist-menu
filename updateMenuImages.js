const fs = require('fs');
const path = require('path');

const menuPath = path.join(__dirname, 'src/data/menu.js');
let menuContent = fs.readFileSync(menuPath, 'utf8');

const imageDir = path.join(__dirname, 'public/menu-images');
const images = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg'));

if (images.length === 0) {
  console.log('No images found in public/menu-images');
  process.exit(1);
}

let imgIndex = 0;
const updatedContent = menuContent.replace(/{ name: "([^"]+)", price: "([^"]+)", description: "([^"]*)" }/g, (match, name, price, description) => {
  const img = images[imgIndex % images.length];
  imgIndex++;
  return `{ name: "${name}", price: "${price}", description: "${description}", image: "/menu-images/${img}" }`;
});

fs.writeFileSync(menuPath, updatedContent);
console.log(`Updated menu.js with ${imgIndex} images.`);
