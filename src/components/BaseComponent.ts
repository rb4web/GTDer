import { Component } from 'obsidian';

export abstract class BaseComponent extends Component {
    protected container: HTMLElement;

    constructor(parentEl: HTMLElement, className: string) {
        if (!parentEl) throw new Error('Parent element is required');
        this.container = parentEl.createEl('div', { cls: className });
    }

    protected abstract render(): void | Promise<void>;
}
