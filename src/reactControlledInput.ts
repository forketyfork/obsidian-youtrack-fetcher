/**
 * Sets an `<input>` element's value in a way that a React controlled component listening
 * for native "input" events will actually notice.
 *
 * React shadows the DOM node's `value` property with its own setter to track the "last known"
 * value for change detection. Assigning through the normal `input.value = ...` path (e.g. via
 * Obsidian's `AbstractInputSuggest.setValue()`) goes through that shadowed setter, which updates
 * React's tracked value at the same time as the DOM value. A subsequently dispatched "input"
 * event then looks like a no-op to React's diffing and `onChange` never fires. Writing through
 * the prototype's native setter bypasses React's shadow, so the DOM value and React's tracked
 * value diverge and the dispatched event is correctly detected as a change.
 */
export function setNativeInputValue(inputEl: HTMLInputElement, value: string): void {
	Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set?.call(inputEl, value);
}
