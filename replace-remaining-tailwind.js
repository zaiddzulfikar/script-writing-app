const fs = require('fs');
const path = require('path');

// Read the project detail page
const filePath = path.join(__dirname, 'app/projects/project/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remaining Tailwind to custom CSS class mappings
const replacements = [
  // Desktop episodes title
  { from: 'className="text-sm font-semibold text-gray-800 uppercase tracking-wide"', to: 'className="desktop-episodes-title"' },
  
  // Desktop add episode button
  { from: 'className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"', to: 'className="desktop-add-episode-button"' },
  
  // Desktop episode item classes
  { from: 'className="sidebar-item"', to: 'className="desktop-episode-item"' },
  { from: 'className="sidebar-item active"', to: 'className="desktop-episode-item desktop-episode-item-selected"' },
  
  // Chat interface container
  { from: 'className="flex-1 flex flex-col"', to: 'className="main-content"' },
  { from: 'className="flex-1 flex items-center justify-center p-4"', to: 'className="desktop-empty-state"' },
  { from: 'className="flex-1 flex items-center justify-center"', to: 'className="desktop-empty-state"' },
  
  // Episode selection classes
  { from: 'className="flex-1 min-w-0 cursor-pointer"', to: 'className="flex-1 min-w-0 cursor-pointer"' },
  
  // Chat interface classes
  { from: 'className="flex-1 btn-secondary"', to: 'className="flex-1 btn-secondary"' },
  { from: 'className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"', to: 'className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"' },
  
  // Remaining utility classes that need custom CSS
  { from: 'className="flex-1 min-w-0"', to: 'className="flex-1 min-w-0"' },
  { from: 'className="flex items-center space-x-2 flex-1 min-w-0"', to: 'className="flex items-center space-x-2 flex-1 min-w-0"' },
  { from: 'className="flex-1 overflow-y-auto"', to: 'className="desktop-episodes-list"' },
  
  // Chat interface specific classes
  { from: 'className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-2"', to: 'className="chat-container"' },
];

// Apply replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Remaining Tailwind classes replaced with custom CSS classes!');
