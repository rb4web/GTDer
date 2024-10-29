import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, TFile } from 'obsidian';
import { IntuiTaskView } from './src/IntuiTaskView';
import './styles.css';
import './src/styles/components/sidebar.css';
import { IntuiTaskPluginSettings } from './src/types/types';

// Remember to rename these classes and interfaces!



const DEFAULT_SETTINGS: IntuiTaskPluginSettings = {
	projectsDirectory: 'Projects',
	tasksDirectory: 'Tasks',
	eventsDirectory: 'Events',
	inboxTasksPath: 'Inbox/Tasks.md'
}

const INTUI_TASK_VIEW_TYPE = 'intui-task-view';

export default class IntuiTaskPlugin extends Plugin {
	settings: IntuiTaskPluginSettings;
	view: IntuiTaskView;

	async onload() {
		await this.loadSettings();

		// Add this line to register the settings tab
		this.addSettingTab(new IntuiTaskSettingTab(this.app, this));

		this.addRibbonIcon('calendar-with-checkmark', 'Intui Task', () => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-intui-task-view',
			name: 'Open Intui Task View',
			callback: () => {
				this.activateView();
			},
		});

		this.registerView(
			INTUI_TASK_VIEW_TYPE,
			(leaf) => (this.view = new IntuiTaskView(leaf, this.settings))
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(INTUI_TASK_VIEW_TYPE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view doesn't exist, create a new leaf in the right sidebar
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: INTUI_TASK_VIEW_TYPE, active: true });
		}

		// Reveal the leaf in the right sidebar
		workspace.revealLeaf(leaf);
	}
}

class IntuiTaskSettingTab extends PluginSettingTab {
	plugin: IntuiTaskPlugin;

	constructor(app: App, plugin: IntuiTaskPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Intui Task Settings'});

		new Setting(containerEl)
			.setName('Projects Directory')
			.setDesc('Directory to store project notes')
			.addText(text => text
				.setPlaceholder('Enter directory name')
				.setValue(this.plugin.settings.projectsDirectory)
				.onChange(async (value) => {
					this.plugin.settings.projectsDirectory = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Tasks Directory')
			.setDesc('Directory to store task notes')
			.addText(text => text
				.setPlaceholder('Enter directory name')
				.setValue(this.plugin.settings.tasksDirectory)
				.onChange(async (value) => {
					this.plugin.settings.tasksDirectory = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Events Directory')
			.setDesc('Directory to store event notes')
			.addText(text => text
				.setPlaceholder('Enter directory name')
				.setValue(this.plugin.settings.eventsDirectory)
				.onChange(async (value) => {
					this.plugin.settings.eventsDirectory = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Inbox Tasks Path')
			.setDesc('Path to the file containing inbox tasks')
			.addText(text => text
				.setPlaceholder('Enter file path')
				.setValue(this.plugin.settings.inboxTasksPath)
				.onChange(async (value) => {
					this.plugin.settings.inboxTasksPath = value;
					await this.plugin.saveSettings();
				}));
	}
}
