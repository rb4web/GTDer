export interface SListItemBase {
    symbol: string;      /** The symbol used to start this list item, like '1.' or '1)' or '*'. */
    link: Link;         /** A link to the closest thing to this list item (a block, a section, or a file). */
    section: Link;      /** The section that contains this list item. */
    path: string;       /** The path of the file that contains this item. */

    line: number;       /** The line this item starts on. */
    lineCount: number;  /** The number of lines this item spans. */
    position: Pos;      /** The internal Obsidian tracker of the exact position of this line. */
    list: number;       /** The line number of the list that this item is part of. */
    blockId?: string;   /** If present, the block ID for this item. */
    parent?: number;    /** The line number of the parent item to this list, if relevant. */
    children: SListItem[]; /** The children elements of this list item. */
    outlinks: Link[];   /** Links contained inside this list item. */

    text: string;       /** The raw text of this item. */
    visual?: string;    /**
                        * If present, overrides 'text' when rendered in task views. You should not mutate 'text' since it is used to
                        * validate a list item when editing it.
                        */
    annotated?: boolean; /** Whether this item has any metadata annotations on it. */

    tags: string[];     /** Any tags present in this task. */

    subtasks: SListItem[]; /** @deprecated use 'children' instead. */
    real: boolean;      /** @deprecated use 'task' instead. */
    header: Link;       /** @deprecated use 'section' instead. */

    [key: string]: any; /** Additional fields added by annotations. */
    description?: string; /** The clean description of this task. */
}

/** A serialized list item as seen by users; this is not a task. */
export interface SListEntry extends SListItemBase {
    task: false;
}

/** A serialized task. */
export interface STask extends SListItemBase {
    task: true;
    status: string;     /** The status of this task, the text between the brackets ('[ ]'). Will be a space if the task is currently unchecked. */
    checked: boolean;   /** Indicates whether the task has any value other than empty space. */
    completed: boolean; /** Indicates whether the task explicitly has been marked "completed" ('x' or 'X'). */
    fullyCompleted: boolean; /** Indicates whether the task and ALL subtasks have been completed. */

    created?: Literal;    /** If present, then the time that this task was created. */
    due?: Literal;       /** If present, then the time that this task was due. */
    completion?: Literal; /** If present, then the time that this task was completed. */
    start?: Literal;     /** If present, then the day that this task can be started. */
    scheduled?: Literal; /** If present, then the day that work on this task is scheduled. */
}