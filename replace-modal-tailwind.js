const fs = require('fs');
const path = require('path');

// Read the project detail page
const filePath = path.join(__dirname, 'app/projects/project/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Modal Tailwind to custom CSS class mappings
const replacements = [
  // PDF Extractor Modal
  { from: 'className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4"', to: 'className="modal-overlay"' },
  { from: 'className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden"', to: 'className="modal-content"' },
  { from: 'className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200"', to: 'className="modal-header"' },
  { from: 'className="text-lg sm:text-xl font-semibold text-gray-900 truncate"', to: 'className="modal-title"' },
  { from: 'className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]"', to: 'className="modal-body"' },
  
  // Script Analysis Modal
  { from: 'className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden"', to: 'className="modal-content modal-content-large"' },
  
  // Analysis History Modal
  { from: 'className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden"', to: 'className="modal-content"' },
];

// Apply replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Modal Tailwind classes replaced with custom CSS classes!');
