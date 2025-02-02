import { App, TFile, Menu, Setting, ToggleComponent } from 'obsidian';
import { IntuiTaskPluginSettings } from '../../types/types';
import { STask } from '../../types/dvtask';

export class InboxView {
    private container: HTMLElement;
    private showCompletedTasks: boolean = false;
    private tasksApi: any; // Tasks API

    constructor(
        parentEl: HTMLElement,
        private settings: IntuiTaskPluginSettings,
        private app: App
    ) {
        // Create the main container for inbox view
        this.container = parentEl.createDiv({ cls: 'intui-inbox-container' });
        // Initialize Tasks API
        this.tasksApi = this.app.plugins.plugins['obsidian-tasks-plugin']?.apiV1;
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

    // Add a new task to the inbox using Tasks API
    private async addNewTask() {
        if (!this.tasksApi) {
            console.error('Tasks plugin API not available');
            return;
        }

        try {
            // Use Tasks API to create task
            const taskLine = await this.tasksApi.createTaskLineModal();
            
            if (taskLine) { // Only proceed if user didn't cancel
                const inboxTasksFile = this.app.vault.getAbstractFileByPath(this.settings.inboxTasksPath);
                if (inboxTasksFile instanceof TFile) {
                    const currentContent = await this.app.vault.read(inboxTasksFile);
                    const newContent = currentContent + '\n' + taskLine;
                    await this.app.vault.modify(inboxTasksFile, newContent);
                }
            }
        } catch (error) {
            console.error('Error creating task:', error);
        }
    }

    // Update task completion status using Tasks API
    private async updateTaskCompletion(stask: STask) {
        if (!this.tasksApi) {
            console.error('Tasks plugin API not available');
            return;
        }

        try {
            const taskLine = stask.text;
            // Append the appropriate status to the task text based on whether it is checked or not
            const updatedTaskLine = stask.checked ? `- [x] ${taskLine}` : `[ ] ${taskLine}`;
            const sourceFile: TFile = this.app.vault.getAbstractFileByPath(stask.path);
            console.log(sourceFile);
            console.log(updatedTaskLine);
            // Use Tasks API to toggle task
            const updatedLine = this.tasksApi.executeToggleTaskDoneCommand(updatedTaskLine, sourceFile.path);
            console.log(updatedLine);
            // Update the file content  
        } catch (error) {
            console.error('Error updating task:', error);
        }
           
    }

    // Render the inbox view
    private async render() {
        // Clear the container
        this.container.empty();

        // Render the inbox header
        this.renderInboxHeader();

        // Get the inbox tasks file
        const inboxTasksFile = this.app.vault.getAbstractFileByPath(this.settings.inboxTasksPath);

        // Check if Dataview plugin exists and is initialized
        const dataviewApi = this.app.plugins.plugins.dataview.api;
        if (!dataviewApi) {
            console.error('Dataview plugin not found or not initialized');
            return;
        }

        const dvTasks = dataviewApi.page(this.settings.inboxTasksPath).file.tasks.values;
        console.log(dvTasks);

        // Helper function to extract clean description from task text
        const extractDescription = (taskText: string): string => {
            // Match everything before the first emoji or special character sequence
            const match = taskText.match(/^(.*?)(?:[\u{1F300}-\u{1F9FF}🆔⏫⏬🔽🔼🔁⏳📅⛔#]|$)/u);
            return match ? match[1].trim() : taskText.trim();
        };

        // Convert Dataview tasks to our task format
        const tasks = dvTasks
            // Filter tasks based on showCompletedTasks setting
            .filter(dvTask => !dvTask.completed || this.showCompletedTasks)
            .map(dvTask => {
                // Extract clean description from task text
                const description = extractDescription(dvTask.text);

                // Convert Dataview task to STask format
                const task: STask = {
                    symbol: '-', // Standard markdown list symbol
                    link: dvTask.link,
                    section: dvTask.section,
                    path: dvTask.path,
                    line: dvTask.line,
                    lineCount: dvTask.lineCount,
                    position: dvTask.position,
                    list: dvTask.list,
                    blockId: dvTask.blockId,
                    parent: dvTask.parent,
                    children: dvTask.children || [],
                    outlinks: dvTask.outlinks || [],
                    text: dvTask.text,
                    description: description, // Add clean description
                    tags: dvTask.tags || [],
                    task: true,
                    status: dvTask.completed ? 'x' : ' ',
                    checked: dvTask.checked || false,
                    completed: dvTask.completed || false,
                    fullyCompleted: dvTask.fullyCompleted || false,
                    created: dvTask.created,
                    due: dvTask.due,
                    completion: dvTask.completion,
                    start: dvTask.start,
                    scheduled: dvTask.scheduled
                };
                return task;
            });

        
        // // Read and render tasks
        //    // Create task list container
        // const sectionList = this.container.createEl('ul', { cls: 'intui-inbox-sectionlist' });
        // const sectionListItems = sectionList.createEl('li', { cls: 'intui-inbox-section' });

        // // Render each task
        // tasks.forEach((task: STask, index: number) => {
        //     const taskItem = sectionListItems.createEl('li', { cls: 'intui-task-inbox-item' });
            
        //     // Create checkbox
        //     const checkbox = taskItem.createEl('input', {
        //         type: 'checkbox',
        //         cls: 'task-checkbox'
        //     });
        //     checkbox.checked = task.completed;
            
        //     // Add task description 
        //     taskItem.createSpan({ text: task.description || '' });

        //     // Add event listeners
        //     checkbox.addEventListener('change', async () => {
        //         // Pass the full task object for more context when updating
        //         await this.updateTaskCompletion(task);
        //     });
        // });

        await this.renderInboxTasks(tasks);

        // Add "Add Task" button
        const addTaskButton = this.container.createEl('button', {
            cls: 'intui-task-add-task',
            text: '+ Add Task'
        });
        addTaskButton.addEventListener('click', () => {
            this.addNewTask();
        });
        
    }

    // Helper function to render inbox header
    private renderInboxHeader() {
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
    }
    private async renderInboxTasks(tasks) {
        try {
            // Create task list container
            const taskList = this.container.createEl('ul', { cls: 'intui-inbox-list' });

            tasks.forEach((task: STask) => {
                // Create task item
                const taskItem = taskList.createEl('li', {
                    cls: 'intui-inbox-item',
                    attr: {
                        'data-id': task.id,
                        'style': `--item-indent: ${task.indent || 1}`
                    }
                });

                // Create task body container
                const taskBody = taskItem.createEl('div', { cls: 'intui-inbox-item-body' });

                // Create main content area
                const taskMain = taskBody.createEl('div', { cls: 'intui-inbox-item-main' });

                // Add left actions (drag handle)
                const leftActions = taskMain.createEl('div', { cls: 'intui-inbox-item-actions-left' });
                const dragHandle = leftActions.createEl('button', {
                    cls: 'intui-inbox-item-drag',
                    attr: { 'aria-label': 'Drag to reorder' }
                });
                dragHandle.innerHTML = '⋮⋮'; // Drag handle icon

                // Add checkbox
                const checkbox = taskMain.createEl('button', {
                    cls: 'intui-inbox-item-checkbox',
                    attr: {
                        'role': 'checkbox',
                        'aria-checked': task.completed ? 'true' : 'false'
                    }
                });

                // Add content area
                const content = taskMain.createEl('div', { cls: 'intui-inbox-item-content' });
                
                // Add task text
                content.createEl('div', {
                    cls: 'intui-inbox-item-text',
                    text: task.description
                });

                // Add metadata if exists
                if (task.due || task.subtasks || task.tags) {
                    const metadata = content.createEl('div', { cls: 'intui-inbox-item-metadata' });

                    // Add subtask status if exists
                    if (task.subtasks) {
                        metadata.createEl('span', {
                            text: `${task.subtasks.completed}/${task.subtasks.total} subtasks`
                        });
                    }

                    // Add due date if exists
                    if (task.due) {
                        const dueDate = metadata.createEl('span', { cls: 'intui-inbox-item-due' });
                        dueDate.innerHTML = '📅 ' + task.due;
                    }

                    // Add tags if exist
                    if (task.tags?.length) {
                        task.tags.forEach(tag => {
                            metadata.createEl('span', {
                                cls: 'intui-inbox-item-tag',
                                text: tag
                            });
                        });
                    }
                }

                // Add actions container
                const actions = taskBody.createEl('div', { cls: 'intui-inbox-item-actions' });

                // Add action buttons
                const actionButtons = [
                    { label: 'Edit', icon: '✏️' },
                    { label: 'Due date', icon: '📅' },
                    { label: 'Comment', icon: '💬' },
                    { label: 'More actions', icon: '⋮' }
                ];

                actionButtons.forEach(({ label, icon }) => {
                    const button = actions.createEl('button', {
                        cls: 'intui-inbox-item-action',
                        attr: { 'aria-label': label }
                    });
                    button.textContent = icon;
                });

                // Add event listeners
                checkbox.addEventListener('click', async () => {
                    const newState = checkbox.getAttribute('aria-checked') !== 'true';
                    checkbox.setAttribute('aria-checked', String(newState));
                    await this.updateTaskCompletion(task);
                });
            });

        } catch (error) {
            console.error('Error rendering tasks:', error);
            new Notice('Error rendering tasks');
        }
    }


    
}
