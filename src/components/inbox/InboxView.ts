import { App, TFile, Menu, Setting, ToggleComponent } from 'obsidian';
import { IntuiTaskPluginSettings } from '../../types/types';

export class InboxView {
    private container: HTMLElement;
    private showCompletedTasks: boolean = false;

    constructor(
        parentEl: HTMLElement,
        private settings: IntuiTaskPluginSettings,
        private app: App
    ) {
        // Create the main container for inbox view
        this.container = parentEl.createDiv({ cls: 'intui-inbox-container' });
        this.render();
    }

    // Show the inbox view
    public show(): void {
        this.container.style.display = 'block';
    }

    // Hide the inbox view
    public hide(): void {
        this.container.style.display = 'none';
    }

    // Add a new task to the inbox
    private async addNewTask(taskDescription: string) {
        // Get the inbox tasks file
        const inboxTasksFile = this.app.vault.getAbstractFileByPath(this.settings.inboxTasksPath);
        if (inboxTasksFile instanceof TFile) {
            // Read current content and append new task
            const currentContent = await this.app.vault.read(inboxTasksFile);
            const newContent = currentContent + `\n- [ ] ${taskDescription}`;
            await this.app.vault.modify(inboxTasksFile, newContent);
            // The file watcher will trigger the re-render of the Inbox View
        }
    }

    // Update task completion status
    private async updateTaskCompletion(file: TFile, taskIndex: number, isCompleted: boolean) {
        // Read the file content
        const content = await this.app.vault.read(file);
        const lines = content.split('\n');
        const taskLine = lines[taskIndex];
        
        // Update the checkbox state
        if (isCompleted) {
            lines[taskIndex] = taskLine.replace('- [ ]', '- [x]');
        } else {
            lines[taskIndex] = taskLine.replace('- [x]', '- [ ]');
        }

        // Save the modified content
        await this.app.vault.modify(file, lines.join('\n'));
    }

    // Update task description
    private async updateTaskDescription(file: TFile, taskIndex: number, newDescription: string) {
        // Read the file content
        const content = await this.app.vault.read(file);
        const lines = content.split('\n');
        const taskLine = lines[taskIndex];
        
        // Preserve checkbox and properties while updating description
        const checkboxPart = taskLine.substring(0, 5); // '- [ ]' or '- [x]'
        const propertiesPart = taskLine.match(/\[.*\]/g)?.join(' ') || '';
        
        // Construct the new task line
        lines[taskIndex] = `${checkboxPart} ${newDescription} ${propertiesPart}`.trim();

        // Save the modified content
        await this.app.vault.modify(file, lines.join('\n'));
    }

    // Render the inbox view
    private async render() {
        // Clear the container
        this.container.empty();

        // Add header container
        const headerContainer = this.container.createEl('div', { cls: 'intui-task-inbox-header' });
        
        // Add title
        headerContainer.createEl('h2', { text: 'Inbox', cls: 'intui-task-inbox-title' });
        
        // Add settings button
        const settingsButton = headerContainer.createEl('button', {
            cls: 'intui-task-inbox-settings-button',
            attr: { 'aria-label': 'Inbox Settings' }
        });
        settingsButton.innerHTML = '⚙️'; // Using emoji for settings icon
        
        // Update settings button click handler
        settingsButton.addEventListener('click', (event) => {
            const menu = new Menu(this.app);
            
            // Create container for the toggle setting
            const menuContainer = createEl('div', { cls: 'intui-task-menu-setting-container' });
            
            // Create setting with toggle
            const setting = new Setting(menuContainer)
                .setName('Show Completed Tasks')
                .addToggle(toggle => {
                    toggle
                        .setValue(this.showCompletedTasks)
                        .onChange(async (value) => {
                            this.showCompletedTasks = value;
                            await this.render();
                        });
                    
                    // Add custom classes for styling
                    toggle.toggleEl.addClass('intui-task-menu-toggle-container');
                });

            // Add the setting container to menu
            menu.addItem((item) => {
                item.setTitle(menuContainer);
            });

            // Position the menu below the settings button
            const rect = settingsButton.getBoundingClientRect();
            menu.showAtPosition({ x: rect.right, y: rect.bottom });
        });

        // Get the inbox tasks file
        const inboxTasksFile = this.app.vault.getAbstractFileByPath(this.settings.inboxTasksPath);
        if (inboxTasksFile instanceof TFile) {
            // Read and render tasks
            const content = await this.app.vault.read(inboxTasksFile);
            const tasks = content.split('\n').filter(line => {
                const trimmedLine = line.trim();
                return trimmedLine.startsWith('- [ ]') || 
                       (this.showCompletedTasks && trimmedLine.startsWith('- [x]'));
            });

            // Create task list container
            const taskList = this.container.createEl('ul', { cls: 'intui-inbox-list' });

            // Render each task
            tasks.forEach((task, index) => {
                const taskItem = taskList.createEl('li', { cls: 'intui-task-inbox-item' });
                
                // Create checkbox
                const checkbox = taskItem.createEl('input', {
                    type: 'checkbox',
                    cls: 'task-checkbox'
                });
                checkbox.checked = task.includes('- [x]');
                
                // Add task description
                const description = task.replace(/- \[[ x]\] /, '');
                taskItem.createSpan({ text: description });

                // Add event listeners
                checkbox.addEventListener('change', async () => {
                    await this.updateTaskCompletion(inboxTasksFile, index, checkbox.checked);
                });
            });

            // Add "Add Task" button
            const addTaskButton = this.container.createEl('button', {
                cls: 'intui-task-add-task',
                text: '+ Add Task'
            });
            addTaskButton.addEventListener('click', () => {
                // Add task creation logic here
                this.addNewTask("New Task");
            });
        }
    }
}
