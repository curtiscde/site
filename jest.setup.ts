import '@testing-library/jest-dom'

// jsdom ships <dialog> as an element but implements none of its modal behaviour, so
// showModal/close throw. The lightbox relies on native <dialog> precisely to avoid a
// dependency, so the gap has to be filled here rather than designed around.
// Deliberately minimal: enough to drive open/closed state and emit `close`, which is
// what the components observe. Real focus trapping and inertness are the browser's job
// and are verified manually.
if (typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal === undefined) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
    if (!this.open) return
    this.open = false
    if (returnValue !== undefined) this.returnValue = returnValue
    this.dispatchEvent(new Event('close'))
  }
}
