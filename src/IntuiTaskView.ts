import { ItemView, WorkspaceLeaf, TFile, Modal, Setting, ToggleComponent, Menu, Notice } from 'obsidian';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { IntuiTaskPluginSettings } from './types/types';
import { InboxView } from './components/inbox/InboxView';

export class IntuiTaskView extends ItemView {
	calendar: Calendar;
	currentView: 'inbox' | 'now' | 'plan' = 'inbox';
	sidebarContainer: HTMLElement;
	mainContainer: HTMLElement;
	calendarContainer: HTMLElement;
	nowContainer: HTMLElement;
	inboxView: InboxView;
	settings: IntuiTaskPluginSettings;

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
		
		this.inboxView = new InboxView(this.mainContainer, this.settings, this.app);

		this.renderCalendarView();
		this.renderNowView();

		this.switchView(this.currentView);
	}

	switchView(view: 'inbox' | 'now' | 'plan') {
		this.currentView = view;

		this.calendarContainer.hide();
		this.nowContainer.hide();
		this.inboxView.hide();

		switch (view) {
			case 'inbox':
				this.inboxView.show();
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
