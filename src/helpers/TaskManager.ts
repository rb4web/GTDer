import { moment } from "obsidian";
import { TaskStatus } from "../types/types";

export class TaskManager {
    constructor(private app: App) {} // Obsidian App instance

    /**
     * Changes the priority of a task
     * @param taskLine - The original task line text
     * @param newPriority - The new priority (high, medium, low, none)
     */
    public changePriority(taskLine: string, newPriority: string): string {
        const priorityMap = {
            highest: "🔺",
            high: "⏫",
            medium: "🔼",
            low: "🔽",
            lowest: "⏬",
            normal: "",
            none: ""
        };
        
        // Remove existing priority markers
        let newLine = taskLine.replace(/[🔺⏫🔼🔽⏬]/g, "").trim();
        
        // Add new priority if not 'none'
        if (newPriority !== "none") {
            newLine = `${priorityMap[newPriority]} ${newLine}`;
        }
        
        return newLine;
    }

    /**
     * Sets or changes task recurrence
     * @param taskLine - The original task line text
     * @param recurrence - The recurrence pattern (e.g., "every day", "every week")
     */
    public setRecurrence(taskLine: string, recurrence: string): string {
        // Remove existing recurrence if any
        let newLine = taskLine.replace(/🔁\s*[^📅🛫⏳✅]*/, "").trim();
        
        // Add new recurrence
        return `${newLine} 🔁 ${recurrence}`;
    }

    /**
     * Sets or updates a date field for a task
     * @param taskLine - The original task line text
     * @param dateType - Type of date to set (due, scheduled, start, created, done, cancelled)
     * @param date - The date to set (moment compatible date string)
     */
    public setDate(taskLine: string, dateType: string, date: string): string {
        const dateFormatted = moment(date).format("YYYY-MM-DD");
        const dateEmojis = {
            due: "📅",
            scheduled: "⏳",
            start: "🛫",
            created: "➕",
            done: "✅",
            cancelled: "❌"
        };

        // Remove existing date of the same type
        const emojiPattern = new RegExp(`${dateEmojis[dateType]}\\s*\\d{4}-\\d{2}-\\d{2}`);
        let newLine = taskLine.replace(emojiPattern, "").trim();

        // Add new date
        return `${newLine} ${dateEmojis[dateType]} ${dateFormatted}`;
    }

    /**
     * Changes the status of a task
     * @param taskLine - The original task line text
     * @param newStatus - The new status to set
     */
    public changeStatus(taskLine: string, newStatus: TaskStatus): string {
        const statusMap = {
            todo: "- [ ]",
            done: "- [x]",
            inProgress: "- [/]",
            cancelled: "- [-]"
        };

        // Replace existing status marker
        const statusPattern = /- \[[ x/\-]\]/;
        return taskLine.replace(statusPattern, statusMap[newStatus]);
    }

    /**
     * Updates the task in the file
     * @param filePath - Path to the file containing the task
     * @param lineNumber - Line number of the task
     * @param newTaskLine - Updated task line
     */
    public async updateTaskInFile(filePath: string, lineNumber: number, newTaskLine: string): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (!(file instanceof TFile)) {
            throw new Error("File not found");
        }

        const content = await this.app.vault.read(file);
        const lines = content.split("\n");
        
        if (lineNumber >= 0 && lineNumber < lines.length) {
            lines[lineNumber] = newTaskLine;
            await this.app.vault.modify(file, lines.join("\n"));
        } else {
            throw new Error("Invalid line number");
        }
    }
} 