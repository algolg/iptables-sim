export function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add("block");
    setTimeout(function () { modal.classList.add("show"); }, 0);
}
window.openModal = openModal;
function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove("show");
    setTimeout(function () { modal.classList.remove("block"); }, 200);
}
window.closeModal = closeModal;
//# sourceMappingURL=modal.js.map