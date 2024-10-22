import { ItemView, WorkspaceLeaf, TFile, Modal, Setting, ToggleComponent, Menu, Notice } from 'obsidian';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { IntuiTaskPluginSettings } from './main'; // Update this import

export class IntuiTaskView extends ItemView {
	calendar: Calendar;
	currentView: 'inbox' | 'now' | 'plan' = 'plan';
	sidebarContainer: HTMLElement;
	mainContainer: HTMLElement;
	calendarContainer: HTMLElement;
	nowContainer: HTMLElement;
	inboxContainer: HTMLElement;
	settings: IntuiTaskPluginSettings;
	showCompletedTasks: boolean = false;

	constructor(leaf: WorkspaceLeaf, settings: IntuiTaskPluginSettings) {
		super(leaf);
		this.settings = settings;
	}

	getViewType() {
		return 'intui-task-view';
	}

	getDisplayText() {
		return 'Intui Task';
	}

	async onOpen() {
		const content = this.contentEl;
		content.empty();
		content.addClass('intui-task-content');

		this.sidebarContainer = content.createEl('div', { cls: 'intui-sidebar' });
		this.mainContainer = content.createEl('div', { cls: 'intui-main-container' });

		this.renderSidebar();
		this.renderMainView();
	}

	renderSidebar() {
		const sidebar = this.sidebarContainer;
		sidebar.empty();

		const toggleButton = sidebar.createEl('button', { cls: 'intui-sidebar-toggle' });
		toggleButton.innerHTML = '&#9776;';
		toggleButton.addEventListener('click', this.toggleSidebar.bind(this));

		const buttonContainer = sidebar.createEl('div', { cls: 'intui-sidebar-buttons' });

		['Inbox', 'Now', 'Plan'].forEach(view => {
			const button = buttonContainer.createEl('button', { cls: 'intui-sidebar-button' });
			const iconSpan = button.createEl('span', { cls: 'intui-sidebar-icon' });
			const textSpan = button.createEl('span', { text: view, cls: 'intui-sidebar-text' });
			
			// Add appropriate icon classes based on the view
			switch(view.toLowerCase()) {
				case 'inbox':
					iconSpan.addClass('inbox-icon');
					break;
				case 'now':
					iconSpan.addClass('now-icon');
					break;
				case 'plan':
					iconSpan.addClass('plan-icon');
					break;
			}
			
			button.addEventListener('click', () => this.switchView(view.toLowerCase() as 'inbox' | 'now' | 'plan'));
		});
	}

	toggleSidebar() {
		console.log('Toggling sidebar');
		this.sidebarContainer.classList.toggle('collapsed');
		this.mainContainer.classList.toggle('expanded');
	}

	renderMainView() {
		this.mainContainer.empty();
		this.mainContainer.addClass('intui-main-container');

		this.calendarContainer = this.mainContainer.createEl('div', { cls: 'intui-calendar-container' });
		this.nowContainer = this.mainContainer.createEl('div', { cls: 'intui-now-container' });
		this.inboxContainer = this.mainContainer.createEl('div', { cls: 'intui-inbox-container' });

		this.renderCalendarView();
		this.renderNowView();
		this.renderInboxView();

		this.switchView(this.currentView);
	}

	switchView(view: 'inbox' | 'now' | 'plan') {
		this.currentView = view;

		[this.inboxContainer, this.nowContainer, this.calendarContainer].forEach(container => container.hide());

		switch (view) {
			case 'inbox':
				this.inboxContainer.show();
				break;
			case 'now':
				this.nowContainer.show();
				break;
			case 'plan':
				this.calendarContainer.show();
				break;
		}
	}

	renderCalendarView() {
		this.calendarContainer.empty();
		const buttonContainer = this.calendarContainer.createEl('div', { cls: 'intui-calendar-buttons' });

		buttonContainer.createEl('button', { text: 'Day' }).addEventListener('click', () => this.setCalendarView('timeGridDay'));
		buttonContainer.createEl('button', { text: 'Week' }).addEventListener('click', () => this.setCalendarView('timeGridWeek'));
		buttonContainer.createEl('button', { text: 'Month' }).addEventListener('click', () => this.setCalendarView('dayGridMonth'));

		const calendarEl = this.calendarContainer.createEl('div', { cls: 'intui-calendar-view' });

		this.calendar = new Calendar(calendarEl, {
			plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
			initialView: 'dayGridMonth',
			headerToolbar: false,
			editable: true,
			selectable: true,
			selectMirror: true,
			dayMaxEvents: true,
			weekends: true,
			events: [],
			select: this.handleDateSelect.bind(this),
			eventClick: this.handleEventClick.bind(this),
		});

		this.calendar.render();
	}

	renderNowView() {
		this.nowContainer.empty();
		this.nowContainer.createEl('h2', { text: 'Current Task' });
		// TODO: Implement the "Now" view to show the currently scheduled task
		this.nowContainer.createEl('p', { text: 'This view will show the currently scheduled task.' });
	}

	renderInboxView() {
		const inboxTasksFile = this.app.vault.getAbstractFileByPath(this.settings.inboxTasksPath);
		if (inboxTasksFile instanceof TFile) {
			this.renderInboxHeader();
			this.renderInboxTasks(inboxTasksFile);
			
			// Set up a file watcher to update the view when the file changes
			this.registerEvent(
				this.app.vault.on('modify', (file) => {
					if (file === inboxTasksFile) {
						this.renderInboxTasks(inboxTasksFile);
					}
				})
			);
		} else {
			this.inboxContainer.empty();
			this.inboxContainer.createEl('p', { text: 'Inbox tasks file not found. Please check your settings.' });
		}
	}

	private renderInboxHeader() {
		const header = this.inboxContainer.createEl('div', { cls: 'intui-inbox-header' });
		header.createEl('h2', { text: 'Inbox' });

		const settingsButton = header.createEl('button', { cls: 'intui-inbox-settings-button', text: '⚙️' });
		settingsButton.addEventListener('click', (event) => {
			console.log('Settings button clicked');
			event.preventDefault();
			event.stopPropagation();
			this.showSettingsMenu(event);
		});
	}

	private showSettingsMenu(event: MouseEvent) {
		console.log('showSettingsMenu called');
		try {
			const menu = new Menu();

			menu.addItem((item) => {
				item.setTitle('Completed tasks');
				item.onClick((e) => {
					e.preventDefault();
					e.stopPropagation();
				});

				// Manually create and append the toggle
				const toggleContainer = item.dom.createDiv({ cls: 'intui-menu-toggle-container' });
				const toggle = new ToggleComponent(toggleContainer);
				toggle.setValue(this.showCompletedTasks);
				toggle.onChange(async (value) => {
					console.log('Toggle changed:', value);
					this.showCompletedTasks = value;
					new Notice(`Show completed tasks: ${this.showCompletedTasks}`);
					const inboxTasksFile = this.app.vault.getAbstractFileByPath(this.settings.inboxTasksPath);
					if (inboxTasksFile instanceof TFile) {
						await this.renderInboxTasks(inboxTasksFile);
					}
				});

				// Append the toggle container to the menu item
				item.dom.appendChild(toggleContainer);
			});

			menu.showAtMouseEvent(event);
			new Notice('Settings menu opened');
		} catch (error) {
			console.error('Error in showSettingsMenu:', error);
			new Notice('Error opening settings menu');
		}
	}

	private async renderInboxTasks(file: TFile) {
		const content = await this.app.vault.read(file);
		
		// Clear existing content
		this.inboxContainer.empty();
		
		// Re-render the header
		this.renderInboxHeader();
		
		const taskList = this.inboxContainer.createEl('ul', { cls: 'intui-inbox-list' });
		const tasks = content.split('\n').filter(line => {
			const trimmedLine = line.trim();
			return trimmedLine.startsWith('- [ ]') || (this.showCompletedTasks && trimmedLine.startsWith('- [x]'));
		});
		
		tasks.forEach((task, index) => {
			const listItem = taskList.createEl('li', { cls: 'intui-inbox-item' });
			const taskContent = listItem.createEl('div', { cls: 'intui-inbox-item-content' });
			
			// Extract priority and description
			const { priority, description } = this.extractPriorityAndDescription(task);
			
			// First line: checkbox and task description
			const taskDescriptionEl = taskContent.createEl('div', { cls: 'intui-inbox-item-description' });
			const checkbox = taskDescriptionEl.createEl('input', { type: 'checkbox' });
			checkbox.checked = task.startsWith('- [x]');
			checkbox.addEventListener('change', () => this.updateTaskCompletion(file, index, checkbox.checked));
			
			const descriptionSpan = taskDescriptionEl.createEl('span', { text: description });
			descriptionSpan.setAttribute('contenteditable', 'true');
			descriptionSpan.addEventListener('blur', () => this.updateTaskDescription(file, index, descriptionSpan.textContent));
			
			// Second line: task properties
			const taskProperties = taskContent.createEl('div', { cls: 'intui-inbox-item-properties' });
			this.renderTaskProperties(taskProperties, task, priority);
			
			const actionButton = listItem.createEl('button', { cls: 'intui-inbox-action', text: '•••' });
			actionButton.addEventListener('click', (e) => this.showTaskActions(e, task));
		});

		// Re-add the "Add task" button
		const addTaskButton = this.inboxContainer.createEl('button', { cls: 'intui-add-task', text: '+ Add task' });
		addTaskButton.addEventListener('click', () => this.openAddTaskModal());
	}

	private extractPriorityAndDescription(task: string): { priority: string, description: string } {
		const priorityMap = {
			'🔺': 'highest',
			'⏫': 'high',
			'🔼': 'medium',
			'🔽': 'low',
			'⏬': 'lowest'
		};
		
		let priority = '';
		let description = task.substring(5).trim(); // Remove '- [ ] ' from the beginning

		for (const [emoji, value] of Object.entries(priorityMap)) {
			if (description.includes(emoji)) {
				priority = value;
				description = description.replace(emoji, '').trim();
				break;
			}
		}

		return { priority, description };
	}

	private renderTaskProperties(container: HTMLElement, task: string, priority: string) {
		console.log("Task priority:", priority); // Debug log

		// Always display priority, defaulting to 'normal' if not set
		const priorityText = priority ? this.getPriorityText(priority) : 'Normal';
		const priorityElement = container.createEl('span', {
			cls: 'intui-inbox-item-property intui-inbox-item-priority',
			text: `Priority: ${priorityText}`,
			attr: { 'data-priority': priority || 'normal' }
		});
		priorityElement.addEventListener('click', () => this.editTaskProperty(task, 'priority', priority || 'normal'));

		// Display other properties
		const properties = task.match(/\[([^\]]+)\]/g) || [];
		properties.forEach(prop => {
			const [key, value] = prop.slice(1, -1).split(':');
			if (key && value) {
				const propElement = container.createEl('span', { 
					cls: 'intui-inbox-item-property', 
					text: `${key}: ${value.trim()}` 
				});
				propElement.addEventListener('click', () => this.editTaskProperty(task, key, value.trim()));
			}
		});
	}

	private getPriorityText(priority: string): string {
		switch (priority) {
			case 'highest': return 'Highest';
			case 'high': return 'High';
			case 'medium': return 'Medium';
			case 'low': return 'Low';
			case 'lowest': return 'Lowest';
			case 'normal':
			case '': return 'Normal';
			default: return 'Unknown';
		}
	}

	private async editTaskProperty(file: TFile, taskIndex: number, key: string, currentValue: string) {
		const newValue = await this.promptForNewValue(key, currentValue);
		if (newValue === null) return; // User cancelled the edit

		const content = await this.app.vault.read(file);
		const lines = content.split('\n');
		const taskLine = lines[taskIndex];

		let updatedLine = taskLine;
		const propertyRegex = new RegExp(`\\[${key}:.*?\\]`);
		
		if (key === 'priority') {
			// Handle priority specially
			updatedLine = this.updatePriorityInTaskLine(updatedLine, newValue);
		} else if (propertyRegex.test(taskLine)) {
			// Update existing property
			updatedLine = updatedLine.replace(propertyRegex, `[${key}:${newValue}]`);
		} else {
			// Add new property
			updatedLine += ` [${key}:${newValue}]`;
		}

		lines[taskIndex] = updatedLine;
		await this.app.vault.modify(file, lines.join('\n'));
		
		// Re-render the inbox tasks to reflect the changes
		this.renderInboxTasks(file);
	}

	private updatePriorityInTaskLine(taskLine: string, newPriority: string): string {
		const priorityEmoji = this.getPriorityEmoji(newPriority);
		const existingPriorityRegex = /[🔺⏫🔼🔽⏬️]/;
		
		if (existingPriorityRegex.test(taskLine)) {
			return taskLine.replace(existingPriorityRegex, priorityEmoji);
		} else {
			return `${taskLine} ${priorityEmoji}`;
		}
	}

	private getPriorityEmoji(priority: string): string {
		switch (priority.toLowerCase()) {
			case 'highest': return '🔺';
			case 'high': return '⏫';
			case 'medium': return '🔼';
			case 'low': return '🔽';
			case 'lowest': return '⏬️';
			default: return '';
		}
	}

	private async promptForNewValue(key: string, currentValue: string): Promise<string | null> {
		return new Promise((resolve) => {
			const modal = new EditPropertyModal(this.app, key, currentValue, (result) => {
				resolve(result);
			});
			modal.open();
		});
	}

	private showTaskActions(event: MouseEvent, task: string) {
		// Implement task action menu (e.g., edit, delete, move)
		console.log('Show actions for task:', task);
	}

	private openAddTaskModal() {
		new AddTaskModal(this.app, this).open();
	}

	private async addNewTask(taskDescription: string) {
		const inboxTasksFile = this.app.vault.getAbstractFileByPath(this.settings.inboxTasksPath);
		if (inboxTasksFile instanceof TFile) {
			const currentContent = await this.app.vault.read(inboxTasksFile);
			const newContent = currentContent + `\n- [ ] ${taskDescription}`;
			await this.app.vault.modify(inboxTasksFile, newContent);
			// The file watcher will trigger the re-render of the Inbox View
		}
	}

	async onClose() {
		if (this.calendar) {
			this.calendar.destroy();
		}
	}

	setCalendarView(view: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth') {
		this.calendar.changeView(view);
	}

	handleDateSelect(selectInfo: any) {
		console.log('Date selected:', selectInfo);
		// TODO: Implement event/task creation logic
	}

	handleEventClick(clickInfo: any) {
		console.log('Event clicked:', clickInfo);
		// TODO: Implement event/task editing logic
	}

	private async updateTaskCompletion(file: TFile, taskIndex: number, isCompleted: boolean) {
		const content = await this.app.vault.read(file);
		const lines = content.split('\n');
		const taskLine = lines[taskIndex];
		
		if (isCompleted) {
			lines[taskIndex] = taskLine.replace('- [ ]', '- [x]');
		} else {
			lines[taskIndex] = taskLine.replace('- [x]', '- [ ]');
		}

		await this.app.vault.modify(file, lines.join('\n'));
	}

	private async updateTaskDescription(file: TFile, taskIndex: number, newDescription: string) {
		const content = await this.app.vault.read(file);
		const lines = content.split('\n');
		const taskLine = lines[taskIndex];
		
		const checkboxPart = taskLine.substring(0, 5); // '- [ ]' or '- [x]'
		const propertiesPart = taskLine.match(/\[.*\]/g)?.join(' ') || '';
		
		lines[taskIndex] = `${checkboxPart} ${newDescription} ${propertiesPart}`.trim();

		await this.app.vault.modify(file, lines.join('\n'));
	}
}

class AddTaskModal extends Modal {
	taskDescription: string;
	view: IntuiTaskView;

	constructor(app: App, view: IntuiTaskView) {
		super(app);
		this.view = view;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Add New Task' });

		new Setting(contentEl)
			.setName('Task Description')
			.addText(text => text
				.onChange(value => {
					this.taskDescription = value;
				}));

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Add Task')
				.setCta()
				.onClick(() => {
					this.view.addNewTask(this.taskDescription);
					this.close();
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class EditPropertyModal extends Modal {
	constructor(app: App, private key: string, private currentValue: string, private onSubmit: (result: string | null) => void) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: `Edit ${this.key}` });

		new Setting(contentEl)
			.setName(`New ${this.key}`)
			.addText(text => text
				.setValue(this.currentValue)
				.onChange(value => {
					this.currentValue = value;
				}));

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save')
				.setCta()
				.onClick(() => {
					this.onSubmit(this.currentValue);
					this.close();
				}))  // Remove the semicolon here
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => {
					this.onSubmit(null);
					this.close();
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
