const fs = require('fs');
const path = require('path');

const indexContent = fs.readFileSync('index.html', 'utf8');

// Regex to extract the full header block from index.html
// From <!-- Desktop Header & Navigation Wrapper --> up to </nav> \n    </div>
const headerRegex = /<!-- Desktop Header & Navigation Wrapper -->[\s\S]*?<\/nav>\s*<\/div>/;
const match = indexContent.match(headerRegex);

if (!match) {
    console.error("Could not find new header in index.html to copy!");
    process.exit(1);
}

const newHeader = match[0];

const filesToUpdate = [
    'about-us.html',
    'cart.html',
    'contact.html',
    'fresh-fruits.html',
    'fresh-veggies.html',
    'ice-cream-parlour.html',
    'orders.html',
    'payment.html',
    'profile.html'
];

filesToUpdate.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let updatedContent = content;
        
        // Find existing header and replace
        // It could be <!-- Topbar --> ... </nav>
        // Or <!-- Main Header --> ... </nav>
        // Or <!-- Simple Header --> ... </header>
        // Or <!-- Desktop Header & Navigation Wrapper --> ... </nav> </div>
        
        let oldHeaderRegex1 = /<!-- Topbar -->[\s\S]*?<\/nav>(\s*<\/div>)?/;
        let oldHeaderRegex2 = /<!-- Main Header -->[\s\S]*?<\/nav>(\s*<\/div>)?/;
        let oldHeaderRegex3 = /<!-- Desktop Header & Navigation Wrapper -->[\s\S]*?<\/nav>\s*<\/div>/;
        
        if (oldHeaderRegex1.test(content)) {
            updatedContent = content.replace(oldHeaderRegex1, newHeader);
        } else if (oldHeaderRegex2.test(content)) {
            updatedContent = content.replace(oldHeaderRegex2, newHeader);
        } else if (oldHeaderRegex3.test(content)) {
            updatedContent = content.replace(oldHeaderRegex3, newHeader);
        } else {
            console.log(`Could not find a valid header to replace in ${file}`);
        }
        
        if (content !== updatedContent) {
            fs.writeFileSync(file, updatedContent, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});

console.log("Done updating headers!");
