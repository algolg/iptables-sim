export function openModal(id: string) {
    const modal = document.getElementById(id);
    modal.classList.add("block");
    setTimeout(function() {modal.classList.add("show")}, 0);
} (<any>window).openModal = openModal;


function closeModal(id: string) {
    const modal = document.getElementById(id);
    modal.classList.remove("show");
    setTimeout(function() {modal.classList.remove("block")}, 200);
} (<any>window).closeModal = closeModal;