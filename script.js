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

    // Main Panel Toggle Logic
    const hidePanelBtn = document.getElementById('hide-mainpanel-btn');
    const showPanelBtn = document.getElementById('show-mainpanel-btn');
    const mainPanel = document.getElementById('mainpanel');

    if (hidePanelBtn && showPanelBtn && mainPanel) {
        // Function to prevent propagation of events to Sigma/Document
        const stopProp = (e) => {
            e.stopPropagation();
        };

        // Protect buttons from global event capture
        [hidePanelBtn, showPanelBtn].forEach(btn => {
            btn.addEventListener('touchstart', stopProp, { passive: false });
            btn.addEventListener('mousedown', stopProp);
            // Ensure click fires on mobile
            btn.addEventListener('touchend', (e) => {
                e.stopPropagation();
                // Optional: manually trigger click if the library prevents default
                // btn.click(); 
                // Commented out to avoid double-firing if browser handles it well, 
                // but stopPropagation on touchend is crucial if Sigma listens to touchend on doc.
            }, { passive: false });
        });

        hidePanelBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Also stop click
            mainPanel.classList.add('collapsed');
            showPanelBtn.style.display = 'block';
        });

        showPanelBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Also stop click
            mainPanel.classList.remove('collapsed');
            showPanelBtn.style.display = 'none';
        });
    }
});
