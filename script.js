document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const body = document.body;

    function toggleMenu() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        // Prevent scrolling when menu is open
        if (sidebar.classList.contains('active')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    }

    menuToggle.addEventListener('click', toggleMenu);

    // Close when clicking overlay
    overlay.addEventListener('click', toggleMenu);

    // Close when clicking a link (optional, good for single page, mostly safe here too)
    const links = sidebar.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                toggleMenu();
            }
        });
    });
});
