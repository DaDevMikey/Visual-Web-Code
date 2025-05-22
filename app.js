// Project state management
const projectState = {
  files: {},
  openFiles: [],
  activeFile: null,
  projectStructure: null
};

// Set up theme handling
document.addEventListener('DOMContentLoaded', () => {
  loadProjectFromStorage();
  setupThemeToggle();
  setupEditor();
  setupTerminal();
  setupSplitPanels();
  setupFileExplorer();
  setupMenus();
  setupPanelTabs();
  setupContextMenus();
  setupModals();
  setupKeyboardShortcuts();
});

// Load project from localStorage
function loadProjectFromStorage() {
  try {
    const savedState = localStorage.getItem('visualWebCodeState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      
      // Restore files content
      if (parsedState.files) {
        projectState.files = parsedState.files;
      }
      
      // Restore open files
      if (parsedState.openFiles) {
        projectState.openFiles = parsedState.openFiles;
      }
      
      // Restore active file
      if (parsedState.activeFile) {
        projectState.activeFile = parsedState.activeFile;
      }
      
      // Restore project structure (folders and files)
      if (parsedState.projectStructure) {
        projectState.projectStructure = parsedState.projectStructure;
        
        // Rebuild the file explorer UI based on the saved structure
        rebuildFileExplorer(parsedState.projectStructure);
      }
    }
  } catch (err) {
    console.error('Error loading project from storage:', err);
    showNotification('Error loading project');
  }
}

// Save project to localStorage
function saveProjectToStorage() {
  try {
    // Capture current editor content before saving
    if (window.editor && projectState.activeFile) {
      projectState.files[projectState.activeFile] = window.editor.getValue();
    }
    
    // Create a snapshot of the file structure
    projectState.projectStructure = captureFileStructure();
    
    localStorage.setItem('visualWebCodeState', JSON.stringify(projectState));
  } catch (err) {
    console.error('Error saving project to storage:', err);
    showNotification('Error saving project');
  }
}

// Capture the current file structure from the DOM
function captureFileStructure() {
  const projectRoot = document.getElementById('project-root');
  return serializeFileExplorer(projectRoot);
}

// Recursively serialize the file explorer structure
function serializeFileExplorer(element) {
  const result = [];
  
  const items = element.children;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.classList.contains('folder')) {
      // It's a folder
      const folderName = item.querySelector('.folder-header span:last-child').textContent;
      const isOpen = item.classList.contains('open');
      const children = serializeFileExplorer(item.querySelector('ul'));
      
      result.push({
        type: 'folder',
        name: folderName,
        isOpen: isOpen,
        children: children
      });
    } else if (item.classList.contains('file')) {
      // It's a file
      const fileName = item.querySelector('span:last-child').textContent;
      const filePath = item.getAttribute('data-file-path') || fileName;
      
      result.push({
        type: 'file',
        name: fileName,
        path: filePath
      });
    }
  }
  
  return result;
}

// Rebuild file explorer from saved structure
function rebuildFileExplorer(structure) {
  const projectRoot = document.getElementById('project-root');
  projectRoot.innerHTML = '';
  
  // Create the project folder
  const projectFolder = document.createElement('li');
  projectFolder.className = 'folder open';
  projectFolder.innerHTML = `
    <div class="folder-header">
      <span class="material-symbols-rounded">expand_more</span>
      <span class="material-symbols-rounded">folder_open</span>
      <span>project</span>
    </div>
    <ul></ul>
  `;
  
  // Add the folder header click event
  const folderHeader = projectFolder.querySelector('.folder-header');
  folderHeader.addEventListener('click', toggleFolder);
  
  // Add the project folder to the root
  projectRoot.appendChild(projectFolder);
  
  // Fill in the project folder with saved structure
  const projectFolderContent = projectFolder.querySelector('ul');
  buildFileStructure(structure, projectFolderContent);
  
  // Set up the click handlers for the rebuilt structure
  setupFileClickHandlers();
}

// Recursively build file structure
function buildFileStructure(items, parentElement) {
  items.forEach(item => {
    if (item.type === 'folder') {
      const folderElement = document.createElement('li');
      folderElement.className = 'folder' + (item.isOpen ? ' open' : '');
      folderElement.innerHTML = `
        <div class="folder-header">
          <span class="material-symbols-rounded">${item.isOpen ? 'expand_more' : 'chevron_right'}</span>
          <span class="material-symbols-rounded">${item.isOpen ? 'folder_open' : 'folder'}</span>
          <span>${item.name}</span>
        </div>
        <ul></ul>
      `;
      
      // Add the folder header click event
      const folderHeader = folderElement.querySelector('.folder-header');
      folderHeader.addEventListener('click', toggleFolder);
      
      // Add the folder to parent
      parentElement.appendChild(folderElement);
      
      // Build children recursively
      buildFileStructure(item.children, folderElement.querySelector('ul'));
    } else if (item.type === 'file') {
      // Determine icon based on file extension
      let iconName = 'description';
      const extension = item.name.split('.').pop().toLowerCase();
      
      if (extension === 'js') iconName = 'javascript';
      else if (extension === 'html') iconName = 'html';
      else if (extension === 'css') iconName = 'css';
      else if (['jpg', 'png', 'gif', 'svg'].includes(extension)) iconName = 'image';
      
      const fileElement = document.createElement('li');
      fileElement.className = 'file';
      fileElement.setAttribute('data-file-path', item.path);
      fileElement.innerHTML = `
        <span class="material-symbols-rounded">${iconName}</span>
        <span>${item.name}</span>
      `;
      
      // Add the file to parent
      parentElement.appendChild(fileElement);
    }
  });
}

// Theme toggle functionality
function setupThemeToggle() {
  // Check for system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Check for saved preference
  const savedTheme = localStorage.getItem('visualWebCodeTheme');
  
  // Set initial theme based on saved preference or system preference
  if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    // Update the theme toggle in settings if it exists
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.checked = true;
  }
  
  // Set up theme toggle in settings modal
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark';
    
    themeToggle.addEventListener('change', () => {
      if (themeToggle.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('visualWebCodeTheme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('visualWebCodeTheme', 'light');
      }
      
      // Update the editor theme if initialized
      if (window.editor) {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' 
          ? 'vs-dark' 
          : 'vs';
        window.monaco.editor.setTheme(theme);
      }
    });
  }
}

// Setup Monaco Editor
function setupEditor() {
  require.config({ 
    paths: { 
      'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.39.0/min/vs' 
    }
  });
  
  require(['vs/editor/editor.main'], function() {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' 
      ? 'vs-dark' 
      : 'vs';
    
    window.monaco = monaco;
    
    // Use saved content for the active file or fallback to default
    let initialContent = '';
    let language = 'javascript';
    
    if (projectState.activeFile && projectState.files[projectState.activeFile]) {
      initialContent = projectState.files[projectState.activeFile];
      const extension = projectState.activeFile.split('.').pop().toLowerCase();
      if (extension === 'html') language = 'html';
      else if (extension === 'css') language = 'css';
      else if (extension === 'js') language = 'javascript';
    } else {
      initialContent = [
        '// Welcome to Visual Web Code',
        '',
        'function helloWorld() {',
        '  console.log("Hello, world!");',
        '}',
        '',
        'helloWorld();',
        '',
        '// Features:',
        '// - Syntax highlighting',
        '// - Code completion',
        '// - Error checking',
        '// - And much more!'
      ].join('\n');
    }
    
    window.editor = monaco.editor.create(document.getElementById('editor'), {
      value: initialContent,
      language: language,
      theme: theme,
      minimap: { enabled: true },
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      roundedSelection: true,
      padding: { top: 12 }
    });
    
    // Save file on Ctrl+S
    window.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
      saveCurrentFile();
    });
    
    // Auto-save on content change (debounced)
    let saveTimeout;
    window.editor.onDidChangeModelContent(() => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (projectState.activeFile) {
          projectState.files[projectState.activeFile] = window.editor.getValue();
          saveProjectToStorage();
        }
      }, 1000);
    });
    
    // Update status bar with cursor position
    window.editor.onDidChangeCursorPosition(e => {
      const statusItem = document.querySelector('.status-right .status-item:nth-last-child(2)');
      if (statusItem) {
        statusItem.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
      }
    });
    
    // Activate the proper file based on the saved state
    if (projectState.activeFile) {
      activateFile(projectState.activeFile);
    }
  });
}

// Save current file
function saveCurrentFile() {
  if (!projectState.activeFile) return;
  
  if (window.editor) {
    projectState.files[projectState.activeFile] = window.editor.getValue();
    saveProjectToStorage();
    showNotification(`Saved: ${projectState.activeFile}`);
  }
}

// Terminal cursor blinking and simulated interaction
function setupTerminal() {
  let commandHistory = [];
  let historyIndex = -1;
  let currentInput = '';
  
  const terminal = document.querySelector('.terminal');
  const currentLine = document.querySelector('.terminal-line.current');
  
  // Simulate typing when clicking in the terminal
  terminal.addEventListener('click', function() {
    // Create fake input element to capture keystrokes
    const input = document.createElement('input');
    input.style.position = 'absolute';
    input.style.opacity = 0;
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    input.focus();
    
    // Listen for keystrokes
    input.addEventListener('keydown', handleTerminalInput);
    
    // Remove input when clicking elsewhere
    document.addEventListener('click', function removeInput(e) {
      if (!terminal.contains(e.target)) {
        document.body.removeChild(input);
        document.removeEventListener('click', removeInput);
      }
    });
  });
  
  function handleTerminalInput(e) {
    const commandSpan = currentLine.querySelector('.command') || 
                        createCommandSpan();
    
    if (e.key === 'Enter') {
      // Process command
      const command = commandSpan.textContent;
      if (command.trim()) {
        commandHistory.push(command);
        historyIndex = commandHistory.length;
        processCommand(command);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      // Navigate history up
      if (historyIndex > 0) {
        historyIndex--;
        commandSpan.textContent = commandHistory[historyIndex];
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      // Navigate history down
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        commandSpan.textContent = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        commandSpan.textContent = currentInput;
      }
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      if (commandSpan.textContent.length > 0) {
        commandSpan.textContent = commandSpan.textContent.slice(0, -1);
      }
      e.preventDefault();
    } else if (e.key.length === 1) {
      // Add character to command
      commandSpan.textContent += e.key;
      currentInput = commandSpan.textContent;
      e.preventDefault();
    }
  }
  
  function createCommandSpan() {
    const commandSpan = document.createElement('span');
    commandSpan.className = 'command';
    currentLine.appendChild(commandSpan);
    currentLine.querySelector('.cursor')?.remove();
    
    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'cursor';
    currentLine.appendChild(cursorSpan);
    
    return commandSpan;
  }
  
  function processCommand(command) {
    // Clone current line and make it a "past" command
    const pastLine = currentLine.cloneNode(true);
    pastLine.classList.remove('current');
    pastLine.querySelector('.cursor')?.remove();
    terminal.insertBefore(pastLine, currentLine);
    
    // Process command (simulated)
    if (command === 'clear') {
      // Clear terminal
      const allLines = terminal.querySelectorAll('.terminal-line:not(.current)');
      allLines.forEach(line => terminal.removeChild(line));
    } else if (command === 'help') {
      addOutputLine('Available commands: clear, help, ls, echo, npm');
    } else if (command === 'ls') {
      addOutputLine('app.js  index.html  styles.css  package.json  node_modules/');
    } else if (command.startsWith('echo ')) {
      addOutputLine(command.substring(5));
    } else if (command.startsWith('npm ')) {
      addOutputLine('Simulating npm command...');
      setTimeout(() => {
        addOutputLine('Operation completed successfully');
      }, 1000);
    } else {
      addOutputLine(`Command not found: ${command}`);
    }
    
    // Reset current line
    const commandSpan = currentLine.querySelector('.command');
    if (commandSpan) commandSpan.textContent = '';
    
    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight;
  }
  
  function addOutputLine(text) {
    const outputLine = document.createElement('div');
    outputLine.className = 'terminal-line output';
    outputLine.innerHTML = `<span>${text}</span>`;
    terminal.insertBefore(outputLine, currentLine);
  }
}

// Setup split panels functionality
function setupSplitPanels() {
  // Setup split between editor and terminal panel
  Split(['.editor-area', '.panel-container'], {
    direction: 'vertical',
    sizes: [70, 30],
    minSize: [200, 100],
    gutterSize: 4,
    onDragEnd: function() {
      if (window.editor) {
        window.editor.layout();
      }
    }
  });
}

// Setup file explorer interactions
function setupFileExplorer() {
  // Toggle folders
  const folderHeaders = document.querySelectorAll('.folder-header');
  folderHeaders.forEach(header => {
    header.addEventListener('click', toggleFolder);
  });
  
  // Set up click handlers for files
  setupFileClickHandlers();
  
  // Add New File button functionality
  const newFileButton = document.getElementById('new-file-btn');
  if (newFileButton) {
    newFileButton.addEventListener('click', createNewFilePrompt);
  }
  
  // Add New Folder button functionality
  const newFolderButton = document.getElementById('new-folder-btn');
  if (newFolderButton) {
    newFolderButton.addEventListener('click', createNewFolderPrompt);
  }
  
  // Collapse All button functionality
  const collapseAllButton = document.getElementById('collapse-all-btn');
  if (collapseAllButton) {
    collapseAllButton.addEventListener('click', () => {
      const folders = document.querySelectorAll('.folder');
      folders.forEach(folder => {
        folder.classList.remove('open');
        const folderIcon = folder.querySelector('.folder-header .material-symbols-rounded:nth-child(2)');
        if (folderIcon) folderIcon.textContent = 'folder';
        const expandIcon = folder.querySelector('.folder-header .material-symbols-rounded:first-child');
        if (expandIcon) expandIcon.textContent = 'chevron_right';
      });
      saveProjectToStorage();
    });
  }
  
  // Refresh button functionality
  const refreshButton = document.getElementById('refresh-explorer-btn');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      loadProjectFromStorage();
      showNotification('File explorer refreshed');
    });
  }
}

// Toggle folder open/closed state
function toggleFolder(event) {
  const folder = this.parentElement;
  folder.classList.toggle('open');
  
  // Toggle folder icon
  const folderIcon = this.querySelector('.material-symbols-rounded:nth-child(2)');
  if (folder.classList.contains('open')) {
    folderIcon.textContent = 'folder_open';
    this.querySelector('.material-symbols-rounded:first-child').textContent = 'expand_more';
  } else {
    folderIcon.textContent = 'folder';
    this.querySelector('.material-symbols-rounded:first-child').textContent = 'chevron_right';
  }
  
  // Save the updated folder state
  saveProjectToStorage();
}

// Set up click handlers for files
function setupFileClickHandlers() {
  const files = document.querySelectorAll('.file');
  files.forEach(file => {
    file.addEventListener('click', function() {
      const filePath = this.getAttribute('data-file-path') || 
                       this.querySelector('span:last-child').textContent;
      activateFile(filePath);
    });
    
    // Set up context menu for files
    file.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      
      const contextMenu = document.getElementById('file-context-menu');
      if (contextMenu) {
        // Position the context menu
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
        
        // Show the context menu
        contextMenu.classList.add('visible');
        
        // Set the current file for context operations
        contextMenu.setAttribute('data-target-file', this.getAttribute('data-file-path') || 
                                                  this.querySelector('span:last-child').textContent);
      }
    });
  });
}

// Activate a file (open in editor)
function activateFile(filePath) {
  // Remove active class from all files
  document.querySelectorAll('.file').forEach(f => f.classList.remove('active'));
  
  // Add active class to clicked file
  const fileElement = document.querySelector(`.file[data-file-path="${filePath}"]`) || 
                     document.querySelector(`.file:has(span:last-child:contains("${filePath}"))`);
  if (fileElement) {
    fileElement.classList.add('active');
  }
  
  // Update editor tabs
  const fileName = filePath.split('/').pop();
  let fileIcon = 'description';
  let language = 'text';
  
  const extension = fileName.split('.').pop().toLowerCase();
  if (extension === 'js') {
    fileIcon = 'javascript';
    language = 'javascript';
  } else if (extension === 'html') {
    fileIcon = 'html';
    language = 'html';
  } else if (extension === 'css') {
    fileIcon = 'css';
    language = 'css';
  } else if (['jpg', 'png', 'gif', 'svg'].includes(extension)) {
    fileIcon = 'image';
  }
  
  // Update tabs
  const tabs = document.querySelectorAll('.editor-tabs .tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Find or create tab
  let tab = Array.from(tabs).find(t => t.getAttribute('data-file-path') === filePath);
  
  if (!tab) {
    // Create new tab
    tab = document.createElement('div');
    tab.className = 'tab';
    tab.setAttribute('data-file-path', filePath);
    tab.innerHTML = `
      <span class="material-symbols-rounded">${fileIcon}</span>
      <span>${fileName}</span>
      <button class="tab-close">
        <span class="material-symbols-rounded">close</span>
      </button>
    `;
    
    document.getElementById('editor-tabs').appendChild(tab);
    
    // Add to open files list if not already there
    if (!projectState.openFiles.includes(filePath)) {
      projectState.openFiles.push(filePath);
    }
    
    // Add close handler
    tab.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Remove from open files
      const index = projectState.openFiles.indexOf(filePath);
      if (index > -1) {
        projectState.openFiles.splice(index, 1);
      }
      
      tab.remove();
      
      // Activate another tab if available
      const remainingTabs = document.querySelectorAll('.editor-tabs .tab');
      if (remainingTabs.length > 0) {
        const nextTab = remainingTabs[0];
        nextTab.classList.add('active');
        activateFile(nextTab.getAttribute('data-file-path'));
      } else {
        projectState.activeFile = null;
      }
      
      saveProjectToStorage();
    });
    
    // Add click handler to activate tab
    tab.addEventListener('click', () => {
      activateFile(filePath);
    });
  }
  
  tab.classList.add('active');
  
  // Save current file content before switching
  if (projectState.activeFile && window.editor) {
    projectState.files[projectState.activeFile] = window.editor.getValue();
  }
  
  // Update active file reference
  projectState.activeFile = filePath;
  
  // Update editor content
  if (window.editor) {
    // Set the language
    window.monaco.editor.setModelLanguage(window.editor.getModel(), language);
    
    // Use saved content for the file or default content
    let content = '';
    
    if (projectState.files[filePath]) {
      content = projectState.files[filePath];
    } else {
      // Default content based on file type
      if (extension === 'js') {
        content = [
          `// ${fileName}`,
          '',
          'function init() {',
          '  console.log("File initialized");',
          '}',
          '',
          'init();'
        ].join('\n');
      } else if (extension === 'html') {
        content = [
          '<!DOCTYPE html>',
          '<html lang="en">',
          '<head>',
          '  <meta charset="UTF-8">',
          '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
          `  <title>${fileName}</title>`,
          '  <link rel="stylesheet" href="styles.css">',
          '</head>',
          '<body>',
          '  <div id="app">',
          `    <h1>${fileName}</h1>`,
          '  </div>',
          '  ',
          '  <script src="app.js"></script>',
          '</body>',
          '</html>'
        ].join('\n');
      } else if (extension === 'css') {
        content = [
          `/* Styles for ${fileName} */`,
          '',
          'body {',
          '  font-family: Arial, sans-serif;',
          '  margin: 0;',
          '  padding: 20px;',
          '}',
          '',
          '#app {',
          '  max-width: 800px;',
          '  margin: 0 auto;',
          '}'
        ].join('\n');
      } else {
        content = `// ${fileName}`;
      }
      
      // Store the default content
      projectState.files[filePath] = content;
    }
    
    window.editor.setValue(content);
  }
  
  // Update status items
  document.querySelector('.status-right .status-item:first-child').textContent = 
    language.charAt(0).toUpperCase() + language.slice(1);
  
  // Save the updated state
  saveProjectToStorage();
}

// Helper function to create a new file in the UI
function createNewFilePrompt() {
  // Create a simple prompt
  const fileName = prompt('Enter file name:');
  if (fileName && fileName.trim()) {
    createNewFile(fileName.trim());
  }
}

function createNewFile(fileName, targetFolder = null) {
  // Find target folder, default to the first open folder
  let folder = targetFolder || document.querySelector('.folder.open > ul');
  if (!folder) {
    showNotification('No open folder to create file in');
    return;
  }
  
  // Determine file path
  let filePath = fileName;
  const parentFolderPath = getParentFolderPath(folder);
  if (parentFolderPath) {
    filePath = `${parentFolderPath}/${fileName}`;
  }
  
  // Check if file already exists
  const existingFile = folder.querySelector(`li.file[data-file-path="${filePath}"]`);
  if (existingFile) {
    showNotification(`File ${fileName} already exists`);
    return;
  }
  
  // Determine icon based on file extension
  let iconName = 'description';
  const extension = fileName.split('.').pop().toLowerCase();
  
  if (extension === 'js') iconName = 'javascript';
  else if (extension === 'html') iconName = 'html';
  else if (extension === 'css') iconName = 'css';
  else if (['jpg', 'png', 'gif', 'svg'].includes(extension)) iconName = 'image';
  
  // Create new file element
  const fileElement = document.createElement('li');
  fileElement.className = 'file';
  fileElement.setAttribute('data-file-path', filePath);
  fileElement.innerHTML = `
    <span class="material-symbols-rounded">${iconName}</span>
    <span>${fileName}</span>
  `;
  
  // Add click handler
  fileElement.addEventListener('click', function() {
    activateFile(filePath);
  });
  
  // Add context menu handler
  fileElement.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    
    const contextMenu = document.getElementById('file-context-menu');
    if (contextMenu) {
      contextMenu.style.left = `${e.pageX}px`;
      contextMenu.style.top = `${e.pageY}px`;
      contextMenu.classList.add('visible');
      contextMenu.setAttribute('data-target-file', filePath);
    }
  });
  
  folder.appendChild(fileElement);
  
  // Create default content based on file type
  let defaultContent = '';
  if (extension === 'js') {
    defaultContent = [
      `// ${fileName}`,
      '',
      'function init() {',
      '  console.log("File initialized");',
      '}',
      '',
      'init();'
    ].join('\n');
  } else if (extension === 'html') {
    defaultContent = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      `  <title>${fileName}</title>`,
      '  <link rel="stylesheet" href="styles.css">',
      '</head>',
      '<body>',
      '  <div id="app">',
      `    <h1>${fileName}</h1>`,
      '  </div>',
      '  ',
      '  <script src="app.js"></script>',
      '</body>',
      '</html>'
    ].join('\n');
  } else if (extension === 'css') {
    defaultContent = [
      `/* Styles for ${fileName} */`,
      '',
      'body {',
      '  font-family: Arial, sans-serif;',
      '  margin: 0;',
      '  padding: 20px;',
      '}',
      '',
      '#app {',
      '  max-width: 800px;',
      '  margin: 0 auto;',
      '}'
    ].join('\n');
  }
  
  // Store the file content
  projectState.files[filePath] = defaultContent;
  
  // Open the file
  activateFile(filePath);
  
  showNotification(`Created file: ${fileName}`);
  saveProjectToStorage();
}

// Helper function to get the full path of a folder
function getParentFolderPath(folderElement) {
  // Start with the current folder element
  let current = folderElement;
  let path = '';
  
  // Traverse up the DOM to build the path
  while (current) {
    if (current.parentElement && current.parentElement.classList.contains('folder')) {
      const folderName = current.parentElement.querySelector('.folder-header span:last-child').textContent;
      path = folderName + (path ? '/' + path : '');
    }
    
    current = current.parentElement;
    
    // Stop if we reach the project root
    if (current && current.id === 'project-root') {
      break;
    }
  }
  
  return path;
}

// Helper function to create a new folder in the UI
function createNewFolderPrompt() {
  const folderName = prompt('Enter folder name:');
  if (folderName && folderName.trim()) {
    createNewFolder(folderName.trim());
  }
}

function createNewFolder(folderName, targetFolder = null) {
  // Find target folder, default to the first open folder
  let folder = targetFolder || document.querySelector('.folder.open > ul');
  if (!folder) {
    showNotification('No open folder to create folder in');
    return;
  }
  
  // Check if folder already exists
  const existingFolder = Array.from(folder.querySelectorAll('.folder')).find(
    f => f.querySelector('.folder-header span:last-child').textContent === folderName
  );
  
  if (existingFolder) {
    showNotification(`Folder ${folderName} already exists`);
    return;
  }
  
  // Create new folder element
  const folderElement = document.createElement('li');
  folderElement.className = 'folder';
  folderElement.innerHTML = `
    <div class="folder-header">
      <span class="material-symbols-rounded">chevron_right</span>
      <span class="material-symbols-rounded">folder</span>
      <span>${folderName}</span>
    </div>
    <ul></ul>
  `;
  
  // Add click handler
  folderElement.querySelector('.folder-header').addEventListener('click', toggleFolder);
  
  folder.appendChild(folderElement);
  showNotification(`Created folder: ${folderName}`);
  saveProjectToStorage();
}

// Setup menu interactions
function setupMenus() {
  // Top menu buttons
  const menuButtons = {
    'file-menu-btn': 'file-menu',
    'edit-menu-btn': 'edit-menu',
    'view-menu-btn': 'view-menu',
    'run-menu-btn': 'run-menu',
    'terminal-menu-btn': 'terminal-menu',
    'help-menu-btn': 'help-menu'
  };
  
  // Set up each menu button
  Object.keys(menuButtons).forEach(buttonId => {
    const button = document.getElementById(buttonId);
    const menuId = menuButtons[buttonId];
    
    if (button && document.getElementById(menuId)) {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu(menuId);
      });
    }
  });
  
  // Close dropdown when clicking elsewhere
  document.addEventListener('click', function() {
    closeAllMenus();
  });
  
  // Set up dropdown menu items
  setupDropdownMenuHandlers();
}

// Toggle menu visibility
function toggleMenu(menuId) {
  // Close all other menus first
  closeAllMenus();
  
  // Toggle the target menu
  const menu = document.getElementById(menuId);
  if (menu) {
    // Position the menu under its button
    const button = document.getElementById(`${menuId.replace('menu', 'menu-btn')}`);
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      menu.style.top = `${buttonRect.bottom}px`;
      menu.style.left = `${buttonRect.left}px`;
    }
    
    menu.classList.add('visible');
  }
}

// Close all open menus
function closeAllMenus() {
  const menus = document.querySelectorAll('.dropdown-menu');
  menus.forEach(menu => menu.classList.remove('visible'));
  
  const contextMenus = document.querySelectorAll('.context-menu');
  contextMenus.forEach(menu => menu.classList.remove('visible'));
}

// Set up dropdown menu item handlers
function setupDropdownMenuHandlers() {
  // File menu
  document.getElementById('new-file')?.addEventListener('click', createNewFilePrompt);
  document.getElementById('new-folder')?.addEventListener('click', createNewFolderPrompt);
  document.getElementById('save-file')?.addEventListener('click', saveCurrentFile);
  document.getElementById('save-all')?.addEventListener('click', function() {
    // Save all open files
    projectState.openFiles.forEach(filePath => {
      if (filePath === projectState.activeFile && window.editor) {
        projectState.files[filePath] = window.editor.getValue();
      }
    });
    saveProjectToStorage();
    showNotification('All files saved');
  });
  
  // Edit menu
  document.getElementById('undo')?.addEventListener('click', function() {
    if (window.editor) window.editor.trigger('keyboard', 'undo', null);
  });
  document.getElementById('redo')?.addEventListener('click', function() {
    if (window.editor) window.editor.trigger('keyboard', 'redo', null);
  });
  document.getElementById('cut')?.addEventListener('click', function() {
    if (window.editor) window.editor.trigger('keyboard', 'cut', null);
  });
  document.getElementById('copy')?.addEventListener('click', function() {
    if (window.editor) window.editor.trigger('keyboard', 'copy', null);
  });
  document.getElementById('paste')?.addEventListener('click', function() {
    if (window.editor) window.editor.trigger('keyboard', 'paste', null);
  });
  
  // View menu
  document.getElementById('toggle-sidebar')?.addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('collapsed');
  });
  document.getElementById('toggle-terminal')?.addEventListener('click', function() {
    document.querySelector('.panel-container').classList.toggle('hidden');
  });
  document.getElementById('zoom-in')?.addEventListener('click', function() {
    if (window.editor) {
      const currentFontSize = window.editor.getOption(monaco.editor.EditorOption.fontSize);
      window.editor.updateOptions({ fontSize: currentFontSize + 1 });
    }
  });
  document.getElementById('zoom-out')?.addEventListener('click', function() {
    if (window.editor) {
      const currentFontSize = window.editor.getOption(monaco.editor.EditorOption.fontSize);
      if (currentFontSize > 8) {
        window.editor.updateOptions({ fontSize: currentFontSize - 1 });
      }
    }
  });
  
  // Run menu
  document.getElementById('run-project')?.addEventListener('click', function() {
    runProject(false);
  });
  document.getElementById('debug-project')?.addEventListener('click', function() {
    runProject(true);
  });
  document.getElementById('run-in-new-tab')?.addEventListener('click', function() {
    runProjectInNewTab(false);
  });
  document.getElementById('debug-in-new-tab')?.addEventListener('click', function() {
    runProjectInNewTab(true);
  });
  
  // Terminal menu
  document.getElementById('new-terminal')?.addEventListener('click', function() {
    const terminal = document.getElementById('terminal-panel');
    if (terminal) {
      const newLine = document.createElement('div');
      newLine.className = 'terminal-line current';
      newLine.innerHTML = `<span class="prompt">$</span><span class="cursor"></span>`;
      terminal.appendChild(newLine);
      terminal.scrollTop = terminal.scrollHeight;
    }
  });
  document.getElementById('clear-terminal')?.addEventListener('click', function() {
    const terminal = document.getElementById('terminal-panel');
    if (terminal) {
      const currentLine = terminal.querySelector('.terminal-line.current');
      terminal.innerHTML = '';
      if (currentLine) terminal.appendChild(currentLine);
    }
  });
  
  // Help menu
  document.getElementById('documentation')?.addEventListener('click', function() {
    window.open('https://code.visualstudio.com/docs', '_blank');
  });
  document.getElementById('keyboard-shortcuts')?.addEventListener('click', function() {
    showNotification('Keyboard shortcuts: Ctrl+S to save, Ctrl+F to search');
  });
  document.getElementById('about')?.addEventListener('click', function() {
    showNotification('Visual Web Code - A web-based code editor');
  });
}

// Setup panel tabs
function setupPanelTabs() {
  const panelTabs = document.querySelectorAll('.panel-tabs .tab');
  const panelViews = document.querySelectorAll('.panel-view');
  
  panelTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs and panels
      panelTabs.forEach(t => t.classList.remove('active'));
      panelViews.forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show corresponding panel
      const panelId = tab.getAttribute('data-panel');
      const panel = document.getElementById(`${panelId}-panel`);
      if (panel) panel.classList.add('active');
    });
  });
}

// Setup context menus
function setupContextMenus() {
  // Close context menu when clicking elsewhere
  document.addEventListener('click', function() {
    const contextMenus = document.querySelectorAll('.context-menu');
    contextMenus.forEach(menu => menu.classList.remove('visible'));
  });
  
  // Prevent context menu click from propagating
  const contextMenus = document.querySelectorAll('.context-menu');
  contextMenus.forEach(menu => {
    menu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
  
  // Setup file context menu handlers
  document.getElementById('context-open')?.addEventListener('click', function() {
    const contextMenu = document.getElementById('file-context-menu');
    const filePath = contextMenu.getAttribute('data-target-file');
    if (filePath) {
      activateFile(filePath);
    }
    contextMenu.classList.remove('visible');
  });
  
  document.getElementById('context-rename')?.addEventListener('click', function() {
    const contextMenu = document.getElementById('file-context-menu');
    const filePath = contextMenu.getAttribute('data-target-file');
    if (filePath) {
      const fileName = filePath.split('/').pop();
      const newName = prompt(`Rename ${fileName}:`, fileName);
      if (newName && newName.trim() && newName !== fileName) {
        renameFile(filePath, newName.trim());
      }
    }
    contextMenu.classList.remove('visible');
  });
  
  document.getElementById('context-delete')?.addEventListener('click', function() {
    const contextMenu = document.getElementById('file-context-menu');
    const filePath = contextMenu.getAttribute('data-target-file');
    if (filePath) {
      const fileName = filePath.split('/').pop();
      if (confirm(`Are you sure you want to delete ${fileName}?`)) {
        deleteFile(filePath);
      }
    }
    contextMenu.classList.remove('visible');
  });
  
  document.getElementById('context-copy-path')?.addEventListener('click', function() {
    const contextMenu = document.getElementById('file-context-menu');
    const filePath = contextMenu.getAttribute('data-target-file');
    if (filePath) {
      navigator.clipboard.writeText(filePath).then(() => {
        showNotification(`Copied path: ${filePath}`);
      });
    }
    contextMenu.classList.remove('visible');
  });
}

// Rename a file
function renameFile(filePath, newName) {
  // Find the file element
  const fileElement = document.querySelector(`.file[data-file-path="${filePath}"]`);
  if (!fileElement) return;
  
  // Get the parent path
  const lastSlashIndex = filePath.lastIndexOf('/');
  const parentPath = lastSlashIndex >= 0 ? filePath.substring(0, lastSlashIndex) : '';
  const newPath = parentPath ? `${parentPath}/${newName}` : newName;
  
  // Update the file element
  fileElement.setAttribute('data-file-path', newPath);
  fileElement.querySelector('span:last-child').textContent = newName;
  
  // Update file icon based on extension
  const iconElement = fileElement.querySelector('span:first-child');
  const extension = newName.split('.').pop().toLowerCase();
  let iconName = 'description';
  if (extension === 'js') iconName = 'javascript';
  else if (extension === 'html') iconName = 'html';
  else if (extension === 'css') iconName = 'css';
  else if (['jpg', 'png', 'gif', 'svg'].includes(extension)) iconName = 'image';
  iconElement.textContent = iconName;
  
  // Update tab if open
  const tab = document.querySelector(`.editor-tabs .tab[data-file-path="${filePath}"]`);
  if (tab) {
    tab.setAttribute('data-file-path', newPath);
    tab.querySelector('span:nth-child(2)').textContent = newName;
    tab.querySelector('span:first-child').textContent = iconName;
  }
  
  // Update project state
  if (projectState.files[filePath]) {
    projectState.files[newPath] = projectState.files[filePath];
    delete projectState.files[filePath];
  }
  
  // Update open files list
  const openIndex = projectState.openFiles.indexOf(filePath);
  if (openIndex >= 0) {
    projectState.openFiles[openIndex] = newPath;
  }
  
  // Update active file
  if (projectState.activeFile === filePath) {
    projectState.activeFile = newPath;
  }
  
  saveProjectToStorage();
  showNotification(`Renamed to: ${newName}`);
}

// Delete a file
function deleteFile(filePath) {
  // Find the file element
  const fileElement = document.querySelector(`.file[data-file-path="${filePath}"]`);
  if (!fileElement) return;
  
  // Remove the file element
  fileElement.remove();
  
  // Close tab if open
  const tab = document.querySelector(`.editor-tabs .tab[data-file-path="${filePath}"]`);
  if (tab) {
    tab.remove();
    
    // Activate another tab if this was the active one
    if (projectState.activeFile === filePath) {
      const remainingTabs = document.querySelectorAll('.editor-tabs .tab');
      if (remainingTabs.length > 0) {
        const nextTab = remainingTabs[0];
        nextTab.classList.add('active');
        activateFile(nextTab.getAttribute('data-file-path'));
      } else {
        projectState.activeFile = null;
        if (window.editor) {
          window.editor.setValue('');
        }
      }
    }
  }
  
  // Update project state
  if (projectState.files[filePath]) {
    delete projectState.files[filePath];
  }
  
  // Update open files list
  const openIndex = projectState.openFiles.indexOf(filePath);
  if (openIndex >= 0) {
    projectState.openFiles.splice(openIndex, 1);
  }
  
  saveProjectToStorage();
  showNotification(`Deleted: ${filePath.split('/').pop()}`);
}

// Setup modals
function setupModals() {
  // Settings modal
  const settingsButtons = document.querySelectorAll('#settings-btn, #settings-btn-sidebar');
  const settingsModal = document.getElementById('settings-modal');
  const modalCloseButtons = document.querySelectorAll('.modal-close');
  
  settingsButtons.forEach(button => {
    button.addEventListener('click', function() {
      settingsModal.classList.add('visible');
    });
  });
  
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.closest('.modal-overlay').classList.remove('visible');
    });
  });
  
  // Close modal when clicking outside
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('visible');
      }
    });
  });
  
  // Setup settings handlers
  setupSettingsHandlers();
}

// Setup settings handlers
function setupSettingsHandlers() {
  // Font size setting
  const fontSizeSetting = document.getElementById('font-size-setting');
  if (fontSizeSetting && window.editor) {
    fontSizeSetting.addEventListener('change', function() {
      const fontSize = parseInt(this.value);
      window.editor.updateOptions({ fontSize });
      localStorage.setItem('visualWebCodeFontSize', fontSize);
    });
    
    // Initialize from localStorage
    const savedFontSize = localStorage.getItem('visualWebCodeFontSize');
    if (savedFontSize) {
      fontSizeSetting.value = savedFontSize;
      if (window.editor) {
        window.editor.updateOptions({ fontSize: parseInt(savedFontSize) });
      }
    }
  }
  
  // Tab size setting
  const tabSizeSetting = document.getElementById('tab-size-setting');
  if (tabSizeSetting && window.editor) {
    tabSizeSetting.addEventListener('change', function() {
      const tabSize = parseInt(this.value);
      window.editor.updateOptions({ tabSize });
      localStorage.setItem('visualWebCodeTabSize', tabSize);
    });
    
    // Initialize from localStorage
    const savedTabSize = localStorage.getItem('visualWebCodeTabSize');
    if (savedTabSize) {
      tabSizeSetting.value = savedTabSize;
      if (window.editor) {
        window.editor.updateOptions({ tabSize: parseInt(savedTabSize) });
      }
    }
  }
  
  // Word wrap setting
  const wordWrapToggle = document.getElementById('word-wrap-toggle');
  if (wordWrapToggle && window.editor) {
    wordWrapToggle.addEventListener('change', function() {
      const wordWrap = this.checked ? 'on' : 'off';
      window.editor.updateOptions({ wordWrap });
      localStorage.setItem('visualWebCodeWordWrap', wordWrap);
    });
    
    // Initialize from localStorage
    const savedWordWrap = localStorage.getItem('visualWebCodeWordWrap');
    if (savedWordWrap) {
      wordWrapToggle.checked = savedWordWrap === 'on';
      if (window.editor) {
        window.editor.updateOptions({ wordWrap: savedWordWrap });
      }
    }
  }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Ctrl+S: Save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveCurrentFile();
    }
    
    // Ctrl+F: Focus search
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      document.querySelector('.search-container input').focus();
    }
    
    // Escape: Close all menus and modals
    if (e.key === 'Escape') {
      closeAllMenus();
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('visible');
      });
    }
  });
}

// Run project in a sandbox iframe
function runProject(debug = false) {
  // Save all files first
  saveProjectToStorage();
  
  // Find HTML file to run
  const htmlFile = projectState.files['index.html'] || Object.keys(projectState.files)
    .find(path => path.endsWith('.html'));
  
  if (!htmlFile) {
    showNotification('No HTML file found to run');
    return;
  }
  
  // Create output element in output panel
  const outputPanel = document.getElementById('output-panel');
  if (!outputPanel) return;
  
  // Clear previous output
  outputPanel.innerHTML = '';
  
  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  outputPanel.appendChild(iframe);
  
  // Switch to output panel
  document.querySelector('.panel-tabs .tab[data-panel="output"]').click();
  
  // Create HTML content
  const content = buildProjectHTML(debug);
  
  // Set iframe content
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(content);
  iframeDoc.close();
  
  showNotification(debug ? 'Debugging project' : 'Running project');
}

// Run project in a new browser tab
function runProjectInNewTab(debug = false) {
  // Save all files first
  saveProjectToStorage();
  
  // Build HTML content
  const content = buildProjectHTML(debug);
  
  // Open in new tab
  const newTab = window.open('', '_blank');
  if (newTab) {
    newTab.document.write(content);
    newTab.document.close();
    showNotification(debug ? 'Debugging in new tab' : 'Running in new tab');
  } else {
    showNotification('Popup blocked. Please allow popups for this site.');
  }
}

// Build HTML content for running the project
function buildProjectHTML(debug = false) {
  // Find the main HTML file
  let htmlContent = projectState.files['index.html'] || '';
  
  // If no HTML file, create a simple one
  if (!htmlContent) {
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Visual Web Code Project</title>
        <style>${projectState.files['styles.css'] || ''}</style>
      </head>
      <body>
        <div id="app">
          <h1>Visual Web Code Project</h1>
          <p>No index.html file found, using generated HTML.</p>
        </div>
        <script>${projectState.files['app.js'] || ''}</script>
      </body>
      </html>
    `;
  } else {
    // Replace external references with inline content
    Object.keys(projectState.files).forEach(filePath => {
      const fileName = filePath.split('/').pop();
      if (fileName !== 'index.html') {
        const fileContent = projectState.files[filePath];
        const extension = fileName.split('.').pop().toLowerCase();
        
        if (extension === 'js') {
          // Handle JavaScript files
          htmlContent = htmlContent.replace(
            new RegExp(`<script[^>]*src=['"]${fileName}['"][^>]*></script>`, 'g'),
            `<script>${fileContent}</script>`
          );
        } else if (extension === 'css') {
          // Handle CSS files
          htmlContent = htmlContent.replace(
            new RegExp(`<link[^>]*href=['"]${fileName}['"][^>]*>`, 'g'),
            `<style>${fileContent}</style>`
          );
        }
      }
    });
  }
  
  // Add debug code if needed
  if (debug) {
    const debugScript = `
      <script>
        console.originalLog = console.log;
        console.originalError = console.error;
        console.originalWarn = console.warn;
        console.originalInfo = console.info;
        
        console.log = function() {
          console.originalLog.apply(console, arguments);
          window.parent.postMessage({
            type: 'log',
            content: Array.from(arguments).map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
          }, '*');
        };
        
        console.error = function() {
          console.originalError.apply(console, arguments);
          window.parent.postMessage({
            type: 'error',
            content: Array.from(arguments).map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
          }, '*');
        };
        
        console.warn = function() {
          console.originalWarn.apply(console, arguments);
          window.parent.postMessage({
            type: 'warn',
            content: Array.from(arguments).map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
          }, '*');
        };
        
        console.info = function() {
          console.originalInfo.apply(console, arguments);
          window.parent.postMessage({
            type: 'info',
            content: Array.from(arguments).map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
          }, '*');
        };
        
        window.addEventListener('error', function(e) {
          window.parent.postMessage({
            type: 'error',
            content: e.message + ' at ' + e.filename + ':' + e.lineno + ':' + e.colno
          }, '*');
        });
      </script>
    `;
    
    // Insert debug script after <head>
    htmlContent = htmlContent.replace('</head>', debugScript + '</head>');
  }
  
  return htmlContent;
}

// Notification helper
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = 'var(--md-sys-color-primary)';
  notification.style.color = 'var(--md-sys-color-on-primary)';
  notification.style.padding = '8px 16px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = 'var(--md-elevation-level2)';
  notification.style.zIndex = '1000';
  notification.style.transition = 'opacity 0.3s ease-in-out';
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}
