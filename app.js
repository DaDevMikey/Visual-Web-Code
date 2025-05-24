// Project state management
const projectState = {
  files: {},
  openFiles: [],
  activeFile: null,
  projectStructure: null,
  previewMode: false
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
  setupPreviewPanel();
  setupFileDownload();
  setupAnimations();
});

// Load project from localStorage
function loadProjectFromStorage() {
  try {
    const savedState = localStorage.getItem('visualWebCodeState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      
      if (parsedState.files) {
        projectState.files = parsedState.files;
      }
      
      if (parsedState.openFiles) {
        projectState.openFiles = parsedState.openFiles;
      }
      
      if (parsedState.activeFile) {
        projectState.activeFile = parsedState.activeFile;
      }
      
      if (parsedState.projectStructure) {
        projectState.projectStructure = parsedState.projectStructure;
        rebuildFileExplorer(parsedState.projectStructure);
      }
    }
  } catch (err) {
    console.error('Error loading project from storage:', err);
    showNotification('Error loading project', 'error');
  }
}

// Save project to localStorage
function saveProjectToStorage() {
  try {
    if (window.editor && projectState.activeFile) {
      projectState.files[projectState.activeFile] = window.editor.getValue();
    }
    
    projectState.projectStructure = captureFileStructure();
    localStorage.setItem('visualWebCodeState', JSON.stringify(projectState));
  } catch (err) {
    console.error('Error saving project to storage:', err);
    showNotification('Error saving project', 'error');
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
  
  const folderHeader = projectFolder.querySelector('.folder-header');
  folderHeader.addEventListener('click', toggleFolder);
  
  projectRoot.appendChild(projectFolder);
  
  const projectFolderContent = projectFolder.querySelector('ul');
  buildFileStructure(structure, projectFolderContent);
  
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
      
      const folderHeader = folderElement.querySelector('.folder-header');
      folderHeader.addEventListener('click', toggleFolder);
      
      parentElement.appendChild(folderElement);
      
      buildFileStructure(item.children, folderElement.querySelector('ul'));
    } else if (item.type === 'file') {
      let iconName = getFileIcon(item.name);
      
      const fileElement = document.createElement('li');
      fileElement.className = 'file';
      fileElement.setAttribute('data-file-path', item.path);
      fileElement.innerHTML = `
        <span class="material-symbols-rounded">${iconName}</span>
        <span>${item.name}</span>
      `;
      
      parentElement.appendChild(fileElement);
    }
  });
}

// Get appropriate icon for file type
function getFileIcon(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  
  const iconMap = {
    'js': 'javascript',
    'html': 'html',
    'css': 'css',
    'json': 'data_object',
    'md': 'description',
    'txt': 'description',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'svg': 'image',
    'ico': 'image',
    'pdf': 'picture_as_pdf',
    'zip': 'folder_zip',
    'xml': 'code'
  };
  
  return iconMap[extension] || 'description';
}

// Theme toggle functionality
function setupThemeToggle() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('visualWebCodeTheme');
  
  if (savedTheme === 'dark' || (savedTheme === null && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.checked = true;
  }
  
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
      
      if (window.editor) {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' 
          ? 'vs-dark' 
          : 'vs';
        window.monaco.editor.setTheme(theme);
      }
      
      updatePreview();
    });
  }
}

// Setup Monaco Editor with enhanced features
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
    
    let initialContent = '';
    let language = 'javascript';
    
    if (projectState.activeFile && projectState.files[projectState.activeFile]) {
      initialContent = projectState.files[projectState.activeFile];
      language = getLanguageFromFile(projectState.activeFile);
    } else {
      initialContent = getDefaultContent('javascript');
    }
    
    window.editor = monaco.editor.create(document.getElementById('editor'), {
      value: initialContent,
      language: language,
      theme: theme,
      minimap: { enabled: true },
      automaticLayout: true,
      fontSize: parseInt(localStorage.getItem('visualWebCodeFontSize')) || 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      roundedSelection: true,
      padding: { top: 16 },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
      wordWrap: localStorage.getItem('visualWebCodeWordWrap') || 'off',
      tabSize: parseInt(localStorage.getItem('visualWebCodeTabSize')) || 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      suggest: {
        showIcons: true,
        showSnippets: true
      }
    });
    
    // Enhanced keyboard shortcuts
    window.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveCurrentFile);
    window.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, togglePreview);
    window.editor.addCommand(monaco.KeyCode.F5, () => runProject(false));
    window.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F5, () => runProject(true));
    
    // Auto-save with debouncing
    let saveTimeout;
    window.editor.onDidChangeModelContent(() => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (projectState.activeFile) {
          projectState.files[projectState.activeFile] = window.editor.getValue();
          saveProjectToStorage();
          updatePreview();
        }
      }, 1000);
    });
    
    // Update status bar
    window.editor.onDidChangeCursorPosition(e => {
      const statusItem = document.querySelector('.status-right .status-item:nth-last-child(2)');
      if (statusItem) {
        statusItem.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
      }
    });
    
    if (projectState.activeFile) {
      activateFile(projectState.activeFile);
    }
  });
}

// Get default content for different file types
function getDefaultContent(fileType) {
  const templates = {
    'javascript': [
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
      '// - Live preview',
      '// - And much more!'
    ].join('\n'),
    
    'html': [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>My Project</title>',
      '  <link rel="stylesheet" href="styles.css">',
      '</head>',
      '<body>',
      '  <div id="app">',
      '    <h1>Welcome to Visual Web Code</h1>',
      '    <p>Start building something amazing!</p>',
      '  </div>',
      '  ',
      '  <script src="app.js"></script>',
      '</body>',
      '</html>'
    ].join('\n'),
    
    'css': [
      '/* Modern CSS Reset */',
      '*, *::before, *::after {',
      '  box-sizing: border-box;',
      '}',
      '',
      'body {',
      '  font-family: system-ui, -apple-system, sans-serif;',
      '  line-height: 1.6;',
      '  margin: 0;',
      '  padding: 20px;',
      '  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
      '  min-height: 100vh;',
      '}',
      '',
      '#app {',
      '  max-width: 800px;',
      '  margin: 0 auto;',
      '  background: white;',
      '  padding: 2rem;',
      '  border-radius: 12px;',
      '  box-shadow: 0 10px 30px rgba(0,0,0,0.1);',
      '}',
      '',
      'h1 {',
      '  color: #333;',
      '  margin-bottom: 1rem;',
      '}'
    ].join('\n')
  };
  
  return templates[fileType] || '';
}

// Get Monaco language from file extension
function getLanguageFromFile(filePath) {
  const extension = filePath.split('.').pop().toLowerCase();
  
  const languageMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'xml': 'xml',
    'sql': 'sql',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c'
  };
  
  return languageMap[extension] || 'plaintext';
}

// Save current file
function saveCurrentFile() {
  if (!projectState.activeFile) return;
  
  if (window.editor) {
    projectState.files[projectState.activeFile] = window.editor.getValue();
    saveProjectToStorage();
    showNotification(`Saved: ${projectState.activeFile}`, 'success');
  }
}

// Setup preview panel functionality
function setupPreviewPanel() {
  const editorContainer = document.querySelector('.editor-container');
  
  // Create preview panel
  const previewPanel = document.createElement('div');
  previewPanel.className = 'preview-panel';
  previewPanel.innerHTML = `
    <div class="preview-header">
      <span>Live Preview</span>
      <div>
        <button class="icon-button" id="refresh-preview" title="Refresh Preview">
          <span class="material-symbols-rounded">refresh</span>
        </button>
        <button class="icon-button" id="open-preview-tab" title="Open in New Tab">
          <span class="material-symbols-rounded">open_in_new</span>
        </button>
        <button class="icon-button" id="close-preview" title="Close Preview">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
    </div>
    <div class="preview-content">
      <iframe class="preview-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
  `;
  
  editorContainer.appendChild(previewPanel);
  
  // Setup preview controls
  document.getElementById('refresh-preview')?.addEventListener('click', updatePreview);
  document.getElementById('open-preview-tab')?.addEventListener('click', () => runProjectInNewTab(false));
  document.getElementById('close-preview')?.addEventListener('click', togglePreview);
}

// Toggle preview panel
function togglePreview() {
  const previewPanel = document.querySelector('.preview-panel');
  projectState.previewMode = !projectState.previewMode;
  
  if (projectState.previewMode) {
    previewPanel.classList.add('visible');
    updatePreview();
    showNotification('Preview enabled', 'info');
  } else {
    previewPanel.classList.remove('visible');
    showNotification('Preview disabled', 'info');
  }
}

// Update preview content
function updatePreview() {
  if (!projectState.previewMode) return;
  
  const iframe = document.querySelector('.preview-iframe');
  if (!iframe) return;
  
  const content = buildProjectHTML(false);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(content);
  iframeDoc.close();
}

// Setup file download functionality
function setupFileDownload() {
  // Add download button to file context menu
  const contextMenu = document.getElementById('file-context-menu');
  if (contextMenu) {
    const downloadItem = document.createElement('div');
    downloadItem.className = 'context-menu-item';
    downloadItem.id = 'context-download';
    downloadItem.innerHTML = `
      <span class="material-symbols-rounded">download</span>
      <span>Download</span>
    `;
    
    // Insert before the separator
    const separator = contextMenu.querySelector('.context-menu-separator');
    contextMenu.insertBefore(downloadItem, separator);
    
    downloadItem.addEventListener('click', function() {
      const contextMenu = document.getElementById('file-context-menu');
      const filePath = contextMenu.getAttribute('data-target-file');
      if (filePath) {
        downloadFile(filePath);
      }
      contextMenu.classList.remove('visible');
    });
  }
}

// Download file functionality
function downloadFile(filePath) {
  const content = projectState.files[filePath];
  if (!content) {
    showNotification('File content not found', 'error');
    return;
  }
  
  const fileName = filePath.split('/').pop();
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification(`Downloaded: ${fileName}`, 'success');
}

// Download entire project as ZIP
function downloadProject() {
  // This would require a ZIP library like JSZip
  // For now, we'll show a placeholder
  showNotification('Project download feature coming soon!', 'info');
}

// Terminal cursor blinking and simulated interaction
function setupTerminal() {
  let commandHistory = [];
  let historyIndex = -1;
  let currentInput = '';
  
  const terminal = document.querySelector('.terminal');
  const currentLine = document.querySelector('.terminal-line.current');
  
  terminal.addEventListener('click', function() {
    const input = document.createElement('input');
    input.style.position = 'absolute';
    input.style.opacity = 0;
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    input.focus();
    
    input.addEventListener('keydown', handleTerminalInput);
    
    document.addEventListener('click', function removeInput(e) {
      if (!terminal.contains(e.target)) {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
        document.removeEventListener('click', removeInput);
      }
    });
  });
  
  function handleTerminalInput(e) {
    const commandSpan = currentLine.querySelector('.command') || createCommandSpan();
    
    if (e.key === 'Enter') {
      const command = commandSpan.textContent;
      if (command.trim()) {
        commandHistory.push(command);
        historyIndex = commandHistory.length;
        processCommand(command);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      if (historyIndex > 0) {
        historyIndex--;
        commandSpan.textContent = commandHistory[historyIndex];
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
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
    const pastLine = currentLine.cloneNode(true);
    pastLine.classList.remove('current');
    pastLine.querySelector('.cursor')?.remove();
    terminal.insertBefore(pastLine, currentLine);
    
    // Enhanced command processing
    const [cmd, ...args] = command.split(' ');
    
    switch(cmd) {
      case 'clear':
        const allLines = terminal.querySelectorAll('.terminal-line:not(.current)');
        allLines.forEach(line => terminal.removeChild(line));
        break;
        
      case 'help':
        addOutputLine('Available commands:');
        addOutputLine('  clear     - Clear terminal');
        addOutputLine('  help      - Show this help');
        addOutputLine('  ls        - List files');
        addOutputLine('  cat <file> - Show file content');
        addOutputLine('  echo <text> - Echo text');
        addOutputLine('  npm <cmd> - Run npm command');
        addOutputLine('  run       - Run current project');
        addOutputLine('  debug     - Debug current project');
        break;
        
      case 'ls':
        Object.keys(projectState.files).forEach(path => {
          addOutputLine(`  ${path}`);
        });
        break;
        
      case 'cat':
        if (args[0] && projectState.files[args[0]]) {
          const lines = projectState.files[args[0]].split('\n');
          lines.forEach(line => addOutputLine(line));
        } else {
          addOutputLine(`cat: ${args[0] || 'filename'}: No such file`);
        }
        break;
        
      case 'echo':
        addOutputLine(args.join(' '));
        break;
        
      case 'run':
        addOutputLine('Running project...');
        setTimeout(() => runProject(false), 500);
        break;
        
      case 'debug':
        addOutputLine('Starting debug session...');
        setTimeout(() => runProject(true), 500);
        break;
        
      case 'npm':
        addOutputLine(`npm ${args.join(' ')}`);
        setTimeout(() => {
          addOutputLine('✓ Command completed successfully');
        }, 1000);
        break;
        
      default:
        addOutputLine(`Command not found: ${cmd}`);
        addOutputLine('Type "help" for available commands');
    }
    
    const commandSpan = currentLine.querySelector('.command');
    if (commandSpan) commandSpan.textContent = '';
    
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
  Split(['.editor-area', '.panel-container'], {
    direction: 'vertical',
    sizes: [75, 25],
    minSize: [200, 120],
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
  const folderHeaders = document.querySelectorAll('.folder-header');
  folderHeaders.forEach(header => {
    header.addEventListener('click', toggleFolder);
  });
  
  setupFileClickHandlers();
  
  // Button event listeners
  document.getElementById('new-file-btn')?.addEventListener('click', createNewFilePrompt);
  document.getElementById('new-folder-btn')?.addEventListener('click', createNewFolderPrompt);
  document.getElementById('collapse-all-btn')?.addEventListener('click', collapseAllFolders);
  document.getElementById('refresh-explorer-btn')?.addEventListener('click', refreshExplorer);
}

// Collapse all folders
function collapseAllFolders() {
  const folders = document.querySelectorAll('.folder');
  folders.forEach(folder => {
    folder.classList.remove('open');
    const folderIcon = folder.querySelector('.folder-header .material-symbols-rounded:nth-child(2)');
    if (folderIcon) folderIcon.textContent = 'folder';
    const expandIcon = folder.querySelector('.folder-header .material-symbols-rounded:first-child');
    if (expandIcon) expandIcon.textContent = 'chevron_right';
  });
  saveProjectToStorage();
  showNotification('All folders collapsed', 'info');
}

// Refresh explorer
function refreshExplorer() {
  loadProjectFromStorage();
  showNotification('File explorer refreshed', 'success');
}

// Toggle folder open/closed state
function toggleFolder(event) {
  const folder = this.parentElement;
  folder.classList.toggle('open');
  
  const folderIcon = this.querySelector('.material-symbols-rounded:nth-child(2)');
  const expandIcon = this.querySelector('.material-symbols-rounded:first-child');
  
  if (folder.classList.contains('open')) {
    folderIcon.textContent = 'folder_open';
    expandIcon.textContent = 'expand_more';
  } else {
    folderIcon.textContent = 'folder';
    expandIcon.textContent = 'chevron_right';
  }
  
  saveProjectToStorage();
}

// Set up click handlers for files
function setupFileClickHandlers() {
  const files = document.querySelectorAll('.file');
  files.forEach(file => {
    // Remove existing listeners
    file.replaceWith(file.cloneNode(true));
  });
  
  // Re-select files after cloning
  document.querySelectorAll('.file').forEach(file => {
    file.addEventListener('click', function() {
      const filePath = this.getAttribute('data-file-path') || 
                       this.querySelector('span:last-child').textContent;
      activateFile(filePath);
    });
    
    file.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      
      const contextMenu = document.getElementById('file-context-menu');
      if (contextMenu) {
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.classList.add('visible');
        contextMenu.setAttribute('data-target-file', 
          this.getAttribute('data-file-path') || this.querySelector('span:last-child').textContent);
      }
    });
  });
}

// Activate a file (open in editor)
function activateFile(filePath) {
  document.querySelectorAll('.file').forEach(f => f.classList.remove('active'));
  
  const fileElement = document.querySelector(`.file[data-file-path="${filePath}"]`);
  if (fileElement) {
    fileElement.classList.add('active');
  }
  
  const fileName = filePath.split('/').pop();
  const fileIcon = getFileIcon(fileName);
  const language = getLanguageFromFile(filePath);
  
  // Update tabs
  const tabs = document.querySelectorAll('.editor-tabs .tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  
  let tab = Array.from(tabs).find(t => t.getAttribute('data-file-path') === filePath);
  
  if (!tab) {
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
    
    if (!projectState.openFiles.includes(filePath)) {
      projectState.openFiles.push(filePath);
    }
    
    // Tab close handler
    tab.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      
      const index = projectState.openFiles.indexOf(filePath);
      if (index > -1) {
        projectState.openFiles.splice(index, 1);
      }
      
      tab.remove();
      
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
      
      saveProjectToStorage();
    });
    
    // Tab click handler
    tab.addEventListener('click', () => {
      activateFile(filePath);
    });
  }
  
  tab.classList.add('active');
  
  // Save current file before switching
  if (projectState.activeFile && window.editor) {
    projectState.files[projectState.activeFile] = window.editor.getValue();
  }
  
  projectState.activeFile = filePath;
  
  // Update editor content
  if (window.editor) {
    window.monaco.editor.setModelLanguage(window.editor.getModel(), language);
    
    let content = '';
    
    if (projectState.files[filePath]) {
      content = projectState.files[filePath];
    } else {
      content = getDefaultContent(language);
      projectState.files[filePath] = content;
    }
    
    window.editor.setValue(content);
  }
  
  // Update status bar
  const languageDisplay = language.charAt(0).toUpperCase() + language.slice(1);
  document.querySelector('.status-right .status-item:first-child').textContent = languageDisplay;
  
  saveProjectToStorage();
  updatePreview();
}

// Create new file prompt
function createNewFilePrompt() {
  const fileName = prompt('Enter file name:');
  if (fileName && fileName.trim()) {
    createNewFile(fileName.trim());
  }
}

function createNewFile(fileName, targetFolder = null) {
  let folder = targetFolder || document.querySelector('.folder.open > ul');
  if (!folder) {
    showNotification('No open folder to create file in', 'warning');
    return;
  }
  
  let filePath = fileName;
  const parentFolderPath = getParentFolderPath(folder);
  if (parentFolderPath) {
    filePath = `${parentFolderPath}/${fileName}`;
  }
  
  const existingFile = folder.querySelector(`li.file[data-file-path="${filePath}"]`);
  if (existingFile) {
    showNotification(`File ${fileName} already exists`, 'warning');
    return;
  }
  
  const iconName = getFileIcon(fileName);
  
  const fileElement = document.createElement('li');
  fileElement.className = 'file';
  fileElement.setAttribute('data-file-path', filePath);
  fileElement.innerHTML = `
    <span class="material-symbols-rounded">${iconName}</span>
    <span>${fileName}</span>
  `;
  
  // Add event listeners
  fileElement.addEventListener('click', function() {
    activateFile(filePath);
  });
  
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
  
  const language = getLanguageFromFile(filePath);
  const defaultContent = getDefaultContent(language);
  
  projectState.files[filePath] = defaultContent;
  activateFile(filePath);
  
  showNotification(`Created file: ${fileName}`, 'success');
  saveProjectToStorage();
}

// Get parent folder path helper
function getParentFolderPath(folderElement) {
  let current = folderElement;
  let path = '';
  
  while (current) {
    if (current.parentElement && current.parentElement.classList.contains('folder')) {
      const folderName = current.parentElement.querySelector('.folder-header span:last-child').textContent;
      path = folderName + (path ? '/' + path : '');
    }
    
    current = current.parentElement;
    
    if (current && current.id === 'project-root') {
      break;
    }
  }
  
  return path;
}

// Create new folder prompt
function createNewFolderPrompt() {
  const folderName = prompt('Enter folder name:');
  if (folderName && folderName.trim()) {
    createNewFolder(folderName.trim());
  }
}

function createNewFolder(folderName, targetFolder = null) {
  let folder = targetFolder || document.querySelector('.folder.open > ul');
  if (!folder) {
    showNotification('No open folder to create folder in', 'warning');
    return;
  }
  
  const existingFolder = Array.from(folder.querySelectorAll('.folder')).find(
    f => f.querySelector('.folder-header span:last-child').textContent === folderName
  );
  
  if (existingFolder) {
    showNotification(`Folder ${folderName} already exists`, 'warning');
    return;
  }
  
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
  
  folderElement.querySelector('.folder-header').addEventListener('click', toggleFolder);
  
  folder.appendChild(folderElement);
  showNotification(`Created folder: ${folderName}`, 'success');
  saveProjectToStorage();
}

// Setup menu interactions with enhanced functionality
function setupMenus() {
  const menuButtons = {
    'file-menu-btn': 'file-menu',
    'edit-menu-btn': 'edit-menu',
    'view-menu-btn': 'view-menu',
    'run-menu-btn': 'run-menu',
    'terminal-menu-btn': 'terminal-menu',
    'help-menu-btn': 'help-menu'
  };
  
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
  
  document.addEventListener('click', closeAllMenus);
  setupDropdownMenuHandlers();
}

// Toggle menu visibility
function toggleMenu(menuId) {
  closeAllMenus();
  
  const menu = document.getElementById(menuId);
  if (menu) {
    const button = document.getElementById(`${menuId.replace('menu', 'menu-btn')}`);
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      menu.style.top = `${buttonRect.bottom + 4}px`;
      menu.style.left = `${buttonRect.left}px`;
    }
    
    menu.classList.add('visible');
  }
}

// Close all open menus
function closeAllMenus() {
  const menus = document.querySelectorAll('.dropdown-menu, .context-menu');
  menus.forEach(menu => menu.classList.remove('visible'));
}

// Enhanced dropdown menu handlers
function setupDropdownMenuHandlers() {
  // File menu
  document.getElementById('new-file')?.addEventListener('click', createNewFilePrompt);
  document.getElementById('new-folder')?.addEventListener('click', createNewFolderPrompt);
  document.getElementById('save-file')?.addEventListener('click', saveCurrentFile);
  document.getElementById('save-all')?.addEventListener('click', saveAllFiles);
  
  // Edit menu
  document.getElementById('undo')?.addEventListener('click', () => {
    if (window.editor) window.editor.trigger('keyboard', 'undo', null);
  });
  document.getElementById('redo')?.addEventListener('click', () => {
    if (window.editor) window.editor.trigger('keyboard', 'redo', null);
  });
  document.getElementById('cut')?.addEventListener('click', () => {
    if (window.editor) window.editor.trigger('keyboard', 'cut', null);
  });
  document.getElementById('copy')?.addEventListener('click', () => {
    if (window.editor) window.editor.trigger('keyboard', 'copy', null);
  });
  document.getElementById('paste')?.addEventListener('click', () => {
    if (window.editor) window.editor.trigger('keyboard', 'paste', null);
  });
  
  // View menu
  document.getElementById('toggle-sidebar')?.addEventListener('click', toggleSidebar);
  document.getElementById('toggle-terminal')?.addEventListener('click', toggleTerminal);
  document.getElementById('zoom-in')?.addEventListener('click', () => changeFontSize(1));
  document.getElementById('zoom-out')?.addEventListener('click', () => changeFontSize(-1));
  
  // Run menu
  document.getElementById('run-project')?.addEventListener('click', () => runProject(false));
  document.getElementById('debug-project')?.addEventListener('click', () => runProject(true));
  document.getElementById('run-in-new-tab')?.addEventListener('click', () => runProjectInNewTab(false));
  document.getElementById('debug-in-new-tab')?.addEventListener('click', () => runProjectInNewTab(true));
  
  // Terminal menu
  document.getElementById('new-terminal')?.addEventListener('click', createNewTerminal);
  document.getElementById('clear-terminal')?.addEventListener('click', clearTerminal);
  
  // Help menu
  document.getElementById('documentation')?.addEventListener('click', () => {
    window.open('https://code.visualstudio.com/docs', '_blank');
  });
  document.getElementById('keyboard-shortcuts')?.addEventListener('click', showKeyboardShortcuts);
  document.getElementById('about')?.addEventListener('click', showAbout);
}

// Helper functions for menu actions
function saveAllFiles() {
  projectState.openFiles.forEach(filePath => {
    if (filePath === projectState.activeFile && window.editor) {
      projectState.files[filePath] = window.editor.getValue();
    }
  });
  saveProjectToStorage();
  showNotification('All files saved', 'success');
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('collapsed');
  showNotification(sidebar.classList.contains('collapsed') ? 'Sidebar hidden' : 'Sidebar shown', 'info');
}

function toggleTerminal() {
  const panelContainer = document.querySelector('.panel-container');
  panelContainer.style.display = panelContainer.style.display === 'none' ? 'flex' : 'none';
  if (window.editor) {
    setTimeout(() => window.editor.layout(), 100);
  }
}

function changeFontSize(delta) {
  if (window.editor) {
    const currentSize = window.editor.getOption(window.monaco.editor.EditorOption.fontSize);
    const newSize = Math.max(8, Math.min(72, currentSize + delta));
    window.editor.updateOptions({ fontSize: newSize });
    localStorage.setItem('visualWebCodeFontSize', newSize);
    showNotification(`Font size: ${newSize}px`, 'info');
  }
}

function createNewTerminal() {
  const terminal = document.getElementById('terminal-panel');
  if (terminal) {
    const newLine = document.createElement('div');
    newLine.className = 'terminal-line current';
    newLine.innerHTML = `<span class="prompt">$</span><span class="cursor"></span>`;
    terminal.appendChild(newLine);
    terminal.scrollTop = terminal.scrollHeight;
  }
}

function clearTerminal() {
  const terminal = document.getElementById('terminal-panel');
  if (terminal) {
    const currentLine = terminal.querySelector('.terminal-line.current');
    terminal.innerHTML = '';
    if (currentLine) {
      const newCurrentLine = currentLine.cloneNode(true);
      newCurrentLine.querySelector('.command')?.remove();
      terminal.appendChild(newCurrentLine);
    }
  }
}

function showKeyboardShortcuts() {
  const shortcuts = [
    'Ctrl+S - Save file',
    'Ctrl+Shift+P - Toggle preview',
    'F5 - Run project',
    'Ctrl+F5 - Debug project',
    'Ctrl+F - Search',
    'Ctrl+N - New file',
    'Ctrl+` - Toggle terminal',
    'Ctrl+B - Toggle sidebar',
    'Ctrl++ - Zoom in',
    'Ctrl+- - Zoom out'
  ];
  
  showNotification(`Keyboard shortcuts:\n${shortcuts.join('\n')}`, 'info');
}

function showAbout() {
  showNotification('Visual Web Code v1.0\nA modern, web-based code editor with Material 3 design', 'info');
}

// Setup panel tabs
function setupPanelTabs() {
  const panelTabs = document.querySelectorAll('.panel-tabs .tab');
  const panelViews = document.querySelectorAll('.panel-view');
  
  panelTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      panelTabs.forEach(t => t.classList.remove('active'));
      panelViews.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      
      const panelId = tab.getAttribute('data-panel');
      const panel = document.getElementById(`${panelId}-panel`);
      if (panel) panel.classList.add('active');
    });
  });
}

// Setup context menus
function setupContextMenus() {
  document.addEventListener('click', closeAllMenus);
  
  const contextMenus = document.querySelectorAll('.context-menu');
  contextMenus.forEach(menu => {
    menu.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
  
  // Context menu handlers
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
        showNotification(`Copied path: ${filePath}`, 'success');
      });
    }
    contextMenu.classList.remove('visible');
  });
  
  document.getElementById('context-download')?.addEventListener('click', function() {
    const contextMenu = document.getElementById('file-context-menu');
    const filePath = contextMenu.getAttribute('data-target-file');
    if (filePath) {
      downloadFile(filePath);
    }
    contextMenu.classList.remove('visible');
  });
}

// Rename file function
function renameFile(filePath, newName) {
  const fileElement = document.querySelector(`.file[data-file-path="${filePath}"]`);
  if (!fileElement) return;
  
  const lastSlashIndex = filePath.lastIndexOf('/');
  const parentPath = lastSlashIndex >= 0 ? filePath.substring(0, lastSlashIndex) : '';
  const newPath = parentPath ? `${parentPath}/${newName}` : newName;
  
  fileElement.setAttribute('data-file-path', newPath);
  fileElement.querySelector('span:last-child').textContent = newName;
  
  const iconElement = fileElement.querySelector('span:first-child');
  iconElement.textContent = getFileIcon(newName);
  
  const tab = document.querySelector(`.editor-tabs .tab[data-file-path="${filePath}"]`);
  if (tab) {
    tab.setAttribute('data-file-path', newPath);
    tab.querySelector('span:nth-child(2)').textContent = newName;
    tab.querySelector('span:first-child').textContent = getFileIcon(newName);
  }
  
  if (projectState.files[filePath]) {
    projectState.files[newPath] = projectState.files[filePath];
    delete projectState.files[filePath];
  }
  
  const openIndex = projectState.openFiles.indexOf(filePath);
  if (openIndex >= 0) {
    projectState.openFiles[openIndex] = newPath;
  }
  
  if (projectState.activeFile === filePath) {
    projectState.activeFile = newPath;
  }
  
  saveProjectToStorage();
  showNotification(`Renamed to: ${newName}`, 'success');
}

// Delete file function
function deleteFile(filePath) {
  const fileElement = document.querySelector(`.file[data-file-path="${filePath}"]`);
  if (!fileElement) return;
  
  fileElement.remove();
  
  const tab = document.querySelector(`.editor-tabs .tab[data-file-path="${filePath}"]`);
  if (tab) {
    tab.remove();
    
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
  
  if (projectState.files[filePath]) {
    delete projectState.files[filePath];
  }
  
  const openIndex = projectState.openFiles.indexOf(filePath);
  if (openIndex >= 0) {
    projectState.openFiles.splice(openIndex, 1);
  }
  
  saveProjectToStorage();
  showNotification(`Deleted: ${filePath.split('/').pop()}`, 'success');
}

// Setup modals
function setupModals() {
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
  
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('visible');
      }
    });
  });
  
  setupSettingsHandlers();
}

// Setup settings handlers with error handling
function setupSettingsHandlers() {
  const fontSizeSetting = document.getElementById('font-size-setting');
  if (fontSizeSetting) {
    fontSizeSetting.addEventListener('change', function() {
      const fontSize = parseInt(this.value);
      if (window.editor && window.editor.updateOptions) {
        window.editor.updateOptions({ fontSize });
      }
      localStorage.setItem('visualWebCodeFontSize', fontSize);
    });
    
    const savedFontSize = localStorage.getItem('visualWebCodeFontSize');
    if (savedFontSize) {
      fontSizeSetting.value = savedFontSize;
    }
  }
  
  const tabSizeSetting = document.getElementById('tab-size-setting');
  if (tabSizeSetting) {
    tabSizeSetting.addEventListener('change', function() {
      const tabSize = parseInt(this.value);
      if (window.editor && window.editor.updateOptions) {
        window.editor.updateOptions({ tabSize });
      }
      localStorage.setItem('visualWebCodeTabSize', tabSize);
    });
    
    const savedTabSize = localStorage.getItem('visualWebCodeTabSize');
    if (savedTabSize) {
      tabSizeSetting.value = savedTabSize;
    }
  }
  
  const wordWrapToggle = document.getElementById('word-wrap-toggle');
  if (wordWrapToggle) {
    wordWrapToggle.addEventListener('change', function() {
      const wordWrap = this.checked ? 'on' : 'off';
      if (window.editor && window.editor.updateOptions) {
        window.editor.updateOptions({ wordWrap });
      }
      localStorage.setItem('visualWebCodeWordWrap', wordWrap);
    });
    
    const savedWordWrap = localStorage.getItem('visualWebCodeWordWrap');
    if (savedWordWrap) {
      wordWrapToggle.checked = savedWordWrap === 'on';
    }
  }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveCurrentFile();
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      togglePreview();
    }
    
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      document.querySelector('.search-container input').focus();
    }
    
    if (e.key === 'F5') {
      e.preventDefault();
      runProject(false);
    }
    
    if (e.ctrlKey && e.key === 'F5') {
      e.preventDefault();
      runProject(true);
    }
    
    if (e.key === 'Escape') {
      closeAllMenus();
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('visible');
      });
    }
    
    if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      toggleTerminal();
    }
    
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
  });
}

// Setup animations and interactive elements
function setupAnimations() {
  // Add intersection observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observe file explorer items
  document.querySelectorAll('.file, .folder').forEach(item => {
    observer.observe(item);
  });
  
  // Add smooth scrolling behavior
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Add ripple effect to buttons
  document.querySelectorAll('.icon-button, .main-menu button').forEach(button => {
    button.addEventListener('click', createRippleEffect);
  });
}

// Create ripple effect for buttons
function createRippleEffect(e) {
  const button = e.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.classList.add('ripple');
  
  const existingRipple = button.querySelector('.ripple');
  if (existingRipple) {
    existingRipple.remove();
  }
  
  button.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Enhanced run project functionality
function runProject(debug = false) {
  saveProjectToStorage();
  
  const htmlFile = projectState.files['index.html'] || Object.keys(projectState.files)
    .find(path => path.endsWith('.html'));
  
  if (!htmlFile) {
    showNotification('No HTML file found to run', 'warning');
    return;
  }
  
  const outputPanel = document.getElementById('output-panel');
  if (!outputPanel) return;
  
  outputPanel.innerHTML = '';
  
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  outputPanel.appendChild(iframe);
  
  document.querySelector('.panel-tabs .tab[data-panel="output"]').click();
  
  const content = buildProjectHTML(debug);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(content);
  iframeDoc.close();
  
  if (debug) {
    // Listen for console messages from iframe
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type) {
        const terminal = document.getElementById('terminal-panel');
        if (terminal) {
          const logLine = document.createElement('div');
          logLine.className = 'terminal-line output';
          logLine.innerHTML = `<span style="color: ${getLogColor(event.data.type)}">[${event.data.type.toUpperCase()}] ${event.data.content}</span>`;
          
          const currentLine = terminal.querySelector('.terminal-line.current');
          terminal.insertBefore(logLine, currentLine);
          terminal.scrollTop = terminal.scrollHeight;
        }
      }
    });
  }
  
  showNotification(debug ? 'Debugging project' : 'Running project', 'success');
}

// Get log color based on log type
function getLogColor(type) {
  const colors = {
    'log': '#E0E0E0',
    'info': '#2196F3',
    'warn': '#FF9800',
    'error': '#F44336'
  };
  return colors[type] || '#E0E0E0';
}

// Run project in new tab
function runProjectInNewTab(debug = false) {
  saveProjectToStorage();
  
  const content = buildProjectHTML(debug);
  
  const newTab = window.open('', '_blank');
  if (newTab) {
    newTab.document.write(content);
    newTab.document.close();
    showNotification(debug ? 'Debugging in new tab' : 'Running in new tab', 'success');
  } else {
    showNotification('Popup blocked. Please allow popups for this site.', 'error');
  }
}

// Build HTML content for running the project
function buildProjectHTML(debug = false) {
  let htmlContent = projectState.files['index.html'] || '';
  
  if (!htmlContent) {
    htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
          htmlContent = htmlContent.replace(
            new RegExp(`<script[^>]*src=['"]${fileName}['"][^>]*></script>`, 'g'),
            `<script>${fileContent}</script>`
          );
        } else if (extension === 'css') {
          htmlContent = htmlContent.replace(
            new RegExp(`<link[^>]*href=['"]${fileName}['"][^>]*>`, 'g'),
            `<style>${fileContent}</style>`
          );
        }
      }
    });
  }
  
  if (debug) {
    const debugScript = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalInfo = console.info;
          
          function postMessage(type, args) {
            try {
              window.parent.postMessage({
                type: type,
                content: Array.from(args).map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ')
              }, '*');
            } catch(e) {
              // Ignore postMessage errors
            }
          }
          
          console.log = function() {
            originalLog.apply(console, arguments);
            postMessage('log', arguments);
          };
          
          console.error = function() {
            originalError.apply(console, arguments);
            postMessage('error', arguments);
          };
          
          console.warn = function() {
            originalWarn.apply(console, arguments);
            postMessage('warn', arguments);
          };
          
          console.info = function() {
            originalInfo.apply(console, arguments);
            postMessage('info', arguments);
          };
          
          window.addEventListener('error', function(e) {
            postMessage('error', [e.message + ' at ' + e.filename + ':' + e.lineno + ':' + e.colno]);
          });
          
          window.addEventListener('unhandledrejection', function(e) {
            postMessage('error', ['Unhandled Promise Rejection:', e.reason]);
          });
        })();
      </script>
    `;
    
    htmlContent = htmlContent.replace('</head>', debugScript + '</head>');
  }
  
  return htmlContent;
}

// Enhanced notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  const icon = getNotificationIcon(type);
  notification.innerHTML = `
    <span class="material-symbols-rounded" style="margin-right: 8px;">${icon}</span>
    <span>${message}</span>
  `;
  
  // Style based on type
  const styles = {
    'success': {
      backgroundColor: 'var(--md-sys-color-primary)',
      color: 'var(--md-sys-color-on-primary)'
    },
    'error': {
      backgroundColor: 'var(--md-sys-color-error)',
      color: 'var(--md-sys-color-on-error)'
    },
    'warning': {
      backgroundColor: 'var(--md-sys-color-tertiary)',
      color: 'var(--md-sys-color-on-tertiary)'
    },
    'info': {
      backgroundColor: 'var(--md-sys-color-secondary)',
      color: 'var(--md-sys-color-on-secondary)'
    }
  };
  
  const style = styles[type] || styles.info;
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '28px',
    boxShadow: 'var(--md-elevation-level3)',
    zIndex: '3000',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '200px',
    maxWidth: '400px',
    backdropFilter: 'blur(12px)',
    transition: 'all var(--md-motion-duration-medium2) var(--md-motion-easing-emphasized)',
    transform: 'translateX(100px) scale(0.9)',
    opacity: '0',
    ...style
  });
  
  document.body.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0) scale(1)';
    notification.style.opacity = '1';
  });
  
  // Auto-remove
  setTimeout(() => {
    notification.style.transform = 'translateX(100px) scale(0.9)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, type === 'error' ? 5000 : 3000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
  const icons = {
    'success': 'check_circle',
    'error': 'error',
    'warning': 'warning',
    'info': 'info'
  };
  return icons[type] || 'info';
}

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 600ms ease-out;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .animate-in {
    animation: fadeInUp var(--md-motion-duration-medium2) var(--md-motion-easing-emphasized);
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
