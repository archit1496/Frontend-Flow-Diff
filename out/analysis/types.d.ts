/**
 * Behavioral snapshot types for Frontend Flow Diff.
 * Each snapshot represents "what the UI does" in a given file version.
 */
export interface RouteChange {
    /** Normalized path, e.g. "/settings" or "/account/settings" */
    path: string;
    /** How it's used: Link to=, navigate(), router.push(), etc. */
    kind: 'Link' | 'navigate' | 'router.push' | 'router.replace' | 'href' | 'redirect' | 'other';
    /** Raw expression if we have it (e.g. template literal) */
    raw?: string;
}
export interface ApiCall {
    /** HTTP method if detectable */
    method: string;
    /** Normalized path/URL (e.g. "/api/users/:id") */
    path: string;
    /** Call site: "useEffect", "onClick", "onMount", etc. */
    callSite?: string;
    /** Raw snippet for display */
    raw?: string;
}
export interface TextNode {
    /** User-facing string content */
    text: string;
    /** Where it appears: button label, heading, etc. */
    context?: string;
    /** Approximate location for matching before/after */
    key?: string;
}
export interface UiState {
    /** Human-readable condition, e.g. "when items.length === 0" */
    condition: string;
    /** Short label: "empty state", "loading skeleton", etc. */
    label?: string;
}
export interface BehavioralSnapshot {
    routes: RouteChange[];
    apiCalls: ApiCall[];
    uiTexts: TextNode[];
    guardedStates: UiState[];
}
/** Result of comparing two snapshots */
export type DiffKind = 'added' | 'removed' | 'changed';
export interface BehavioralDiff {
    routes: {
        added: RouteChange[];
        removed: RouteChange[];
        changed: {
            before: RouteChange;
            after: RouteChange;
        }[];
    };
    apiCalls: {
        added: ApiCall[];
        removed: ApiCall[];
        changed: {
            before: ApiCall;
            after: ApiCall;
        }[];
    };
    uiStates: {
        added: UiState[];
        removed: UiState[];
        changed: {
            before: UiState;
            after: UiState;
        }[];
    };
    copy: {
        added: TextNode[];
        removed: TextNode[];
        changed: {
            before: TextNode;
            after: TextNode;
        }[];
    };
}
//# sourceMappingURL=types.d.ts.map