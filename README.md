
# Visual Web Code

**Visual-Web-Code** is a browser-based web development environment inspired by modern code editors. It allows you to create, edit, and manage web projects—HTML, CSS, and JavaScript—right in your browser, with instant preview and persistent storage.

---

## Features

- **File Explorer**: Organize your project files and folders visually.
- **Monaco Editor Integration**: Experience code editing with syntax highlighting, autocompletion, and keyboard shortcuts (powered by the Monaco Editor, as used in VS Code).
- **Instant Run & Debug**: Run or debug your project in a sandboxed iframe or a new tab with a single click.
- **Live Preview**: See your HTML, CSS, and JavaScript updates instantly.
- **Theme Switching**: Toggle between dark and light themes, including system preference detection.
- **Persistent Storage**: Projects are saved in your browser’s localStorage—pick up where you left off, even after a browser restart.
- **Rich UI**: Dropdown menus for file, edit, view, run, and more—plus context menus, modals, and a status bar.
- **Keyboard Shortcuts**: Quickly access commands like save, undo, redo, run, and debug.

---

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DaDevMikey/Visual-Web-Code.git
   cd Visual-Web-Code
   ```

2. **Open `index.html` in your browser:**
   - No build step required. Just open the file directly, or host the folder with a simple HTTP server.

3. **Start coding!**
   - Use the file explorer to create files/folders.
   - Write HTML, CSS, and JavaScript.
   - Press <kbd>F5</kbd> to run, or <kbd>Ctrl+F5</kbd> to debug.

---

## Project Structure

- `index.html` — Main app shell and layout.
- `app.js` — Core application logic (project state, editor setup, file management, run/debug, UI).
- `styles.css` — Application styles.
- (Other assets as needed.)

---

## Technologies Used

- **JavaScript** (Core logic, state, UI)
- **HTML** (Interface)
- **CSS** (Styling)
- **[Monaco Editor](https://microsoft.github.io/monaco-editor/)** (Code editing)

---

## License

[MIT](LICENSE) — Feel free to use, modify, and distribute!

---

## Author

Developed by [DaDevMikey](https://github.com/DaDevMikey).

---

## Contributing

Pull requests and suggestions are welcome—feel free to open an issue or PR!
