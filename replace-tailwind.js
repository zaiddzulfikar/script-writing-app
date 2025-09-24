const fs = require('fs');
const path = require('path');

// Read the project detail page
const filePath = path.join(__dirname, 'app/projects/project/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Tailwind to custom CSS class mappings
const replacements = [
  // Layout
  { from: 'className="flex items-center justify-between mb-4"', to: 'className="flex items-center justify-between mb-4"' },
  { from: 'className="text-sm text-gray-600 space-y-4"', to: 'className="text-sm text-gray-600 space-y-4"' },
  { from: 'className="flex flex-wrap gap-3"', to: 'className="flex flex-wrap gap-3"' },
  { from: 'className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200"', to: 'className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200"' },
  { from: 'className="text-xs font-semibold text-gray-500 uppercase tracking-wide"', to: 'className="text-xs font-semibold text-gray-500 uppercase tracking-wide"' },
  { from: 'className="text-sm font-medium text-gray-700"', to: 'className="text-sm font-medium text-gray-700"' },
  { from: 'className="mt-4 space-y-3"', to: 'className="mt-4 space-y-3"' },
  { from: 'className="grid grid-cols-2 gap-2"', to: 'className="grid grid-cols-2 gap-2"' },
  
  // Complex button classes
  { from: 'className="group flex items-center justify-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl px-3 py-3 transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"', to: 'className="mobile-action-button mobile-action-button-blue"' },
  { from: 'className="group flex items-center justify-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-purple-700 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl px-3 py-3 transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"', to: 'className="mobile-action-button mobile-action-button-purple"' },
  { from: 'className="group flex items-center justify-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-green-700 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl px-3 py-3 transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"', to: 'className="mobile-action-button mobile-action-button-green"' },
  { from: 'className="group flex items-center justify-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-orange-700 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 rounded-xl px-3 py-3 transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"', to: 'className="mobile-action-button mobile-action-button-orange"' },
  
  // Icon classes
  { from: 'className="h-4 w-4 text-gray-500 group-hover:text-blue-600"', to: 'className="h-4 w-4 text-gray-500 group-hover:text-blue-600"' },
  { from: 'className="h-4 w-4 text-gray-500 group-hover:text-purple-600"', to: 'className="h-4 w-4 text-gray-500 group-hover:text-purple-600"' },
  { from: 'className="h-4 w-4 text-gray-500 group-hover:text-green-600"', to: 'className="h-4 w-4 text-gray-500 group-hover:text-green-600"' },
  { from: 'className="h-4 w-4 text-gray-500 group-hover:text-orange-600"', to: 'className="h-4 w-4 text-gray-500 group-hover:text-orange-600"' },
  
  // Text classes
  { from: 'className="whitespace-nowrap"', to: 'className="whitespace-nowrap"' },
  
  // Episode list classes
  { from: 'className="mobile-episodes-list"', to: 'className="mobile-episodes-list"' },
  { from: 'className="mobile-episodes-title"', to: 'className="mobile-episodes-title"' },
  { from: 'className="mobile-episode-item"', to: 'className="mobile-episode-item"' },
  { from: 'className="mobile-episode-item-selected"', to: 'className="mobile-episode-item-selected"' },
  { from: 'className="mobile-episode-item-unselected"', to: 'className="mobile-episode-item-unselected"' },
  { from: 'className="mobile-episode-number"', to: 'className="mobile-episode-number"' },
  { from: 'className="mobile-episode-title"', to: 'className="mobile-episode-title"' },
  { from: 'className="mobile-episode-delete"', to: 'className="mobile-episode-delete"' },
  
  // Create episode button
  { from: 'className="mobile-create-episode"', to: 'className="mobile-create-episode"' },
  
  // Empty state
  { from: 'className="mobile-empty-state"', to: 'className="mobile-empty-state"' },
  { from: 'className="mobile-empty-icon"', to: 'className="mobile-empty-icon"' },
  { from: 'className="mobile-empty-title"', to: 'className="mobile-empty-title"' },
  { from: 'className="mobile-empty-description"', to: 'className="mobile-empty-description"' },
  
  // Chat interface container
  { from: 'className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-2"', to: 'className="chat-container"' },
  
  // Desktop layout
  { from: 'className="hidden md:flex md:w-80 md:flex-col md:border-r md:border-gray-200"', to: 'className="desktop-sidebar"' },
  { from: 'className="flex flex-1 flex-col overflow-hidden"', to: 'className="main-content"' },
  { from: 'className="flex flex-1 flex-col overflow-hidden"', to: 'className="main-content"' },
  
  // Desktop header
  { from: 'className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8"', to: 'className="desktop-header"' },
  { from: 'className="flex items-center justify-between"', to: 'className="flex items-center justify-between"' },
  { from: 'className="flex items-center space-x-4"', to: 'className="flex items-center space-x-4"' },
  { from: 'className="text-2xl font-bold text-gray-900"', to: 'className="text-2xl font-bold text-gray-900"' },
  { from: 'className="text-sm text-gray-500"', to: 'className="text-sm text-gray-500"' },
  { from: 'className="flex items-center space-x-2"', to: 'className="flex items-center space-x-2"' },
  
  // Desktop sidebar content
  { from: 'className="flex flex-1 flex-col overflow-y-auto"', to: 'className="desktop-sidebar-content"' },
  { from: 'className="flex-1 space-y-1 px-2 py-4"', to: 'className="desktop-episodes-list"' },
  { from: 'className="text-sm font-medium text-gray-500 px-2 py-2"', to: 'className="desktop-episodes-title"' },
  
  // Desktop episode item
  { from: 'className="group flex items-center px-2 py-2 text-sm font-medium rounded-md"', to: 'className="desktop-episode-item"' },
  { from: 'className="group flex items-center px-2 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-700"', to: 'className="desktop-episode-item desktop-episode-item-selected"' },
  { from: 'className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"', to: 'className="desktop-episode-item desktop-episode-item-unselected"' },
  { from: 'className="flex-1 truncate"', to: 'className="flex-1 truncate"' },
  { from: 'className="ml-2 flex-shrink-0"', to: 'className="ml-2 flex-shrink-0"' },
  { from: 'className="h-4 w-4"', to: 'className="h-4 w-4"' },
  
  // Desktop create episode button
  { from: 'className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"', to: 'className="desktop-create-episode"' },
  
  // Desktop empty state
  { from: 'className="text-center py-6"', to: 'className="desktop-empty-state"' },
  { from: 'className="mx-auto h-12 w-12 text-gray-400"', to: 'className="desktop-empty-icon"' },
  { from: 'className="mt-2 text-sm font-medium text-gray-900"', to: 'className="desktop-empty-title"' },
  { from: 'className="mt-1 text-sm text-gray-500"', to: 'className="desktop-empty-description"' },
  
  // Motion classes
  { from: 'className="motion-fade-initial motion-fade-animate motion-fade-exit"', to: 'className="motion-fade-initial motion-fade-animate motion-fade-exit"' },
  { from: 'className="motion-slide-left-initial motion-slide-left-animate motion-slide-left-exit motion-slide-left-transition"', to: 'className="motion-slide-left-initial motion-slide-left-animate motion-slide-left-exit motion-slide-left-transition"' },
  { from: 'className="motion-slide-initial motion-slide-animate motion-slide-transition"', to: 'className="motion-slide-initial motion-slide-animate motion-slide-transition"' },
  { from: 'className="motion-expand-initial motion-expand-animate motion-expand-exit motion-expand-transition"', to: 'className="motion-expand-initial motion-expand-animate motion-expand-exit motion-expand-transition"' },
  { from: 'className="motion-scale-initial motion-scale-animate motion-scale-exit"', to: 'className="motion-scale-initial motion-scale-animate motion-scale-exit"' },
  
  // Touch feedback
  { from: 'className="touch-feedback"', to: 'className="touch-feedback"' },
];

// Apply replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Tailwind classes replaced with custom CSS classes!');
