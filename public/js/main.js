/* ══════════════════════════════════════════════════════════════
   Fleet Management — main.js
   ══════════════════════════════════════════════════════════════ */

// ── Sidebar Toggle ───────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    });
}
if (overlay) {
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });
}

// ── Active Nav Highlight ──────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(link => {
    if (link.getAttribute('href') && window.location.pathname.startsWith(link.getAttribute('href'))) {
        link.classList.add('active');
    }
});

// ── Client-side Table Search ──────────────────────────────────
const searchInput = document.getElementById('client-search');
if (searchInput) {
    searchInput.addEventListener('input', function () {
        const q = this.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr:not(.empty-row)');
        let visible = 0;
        rows.forEach(row => {
            const match = row.textContent.toLowerCase().includes(q);
            row.style.display = match ? '' : 'none';
            if (match) visible++;
        });
        const noResult = document.getElementById('no-results');
        if (noResult) noResult.style.display = visible === 0 ? '' : 'none';
    });
}

// ── Auto-dismiss Flash Messages ───────────────────────────────
document.querySelectorAll('.alert').forEach(alert => {
    setTimeout(() => {
        alert.style.transition = 'opacity .4s';
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 420);
    }, 5000);
});

// ── Dashboard KPI Live Polling ────────────────────────────────
const kpiContainer = document.getElementById('kpi-container');
if (kpiContainer) {
    async function fetchKpis() {
        try {
            const res = await fetch('/api/kpis');
            if (!res.ok) return;
            const data = await res.json();

            const set = (id, val) => {
                const el = document.getElementById(id);
                if (el) { el.textContent = val; el.closest('.kpi-card')?.classList.remove('kpi-loading'); }
            };

            set('kpi-active-fleet', data.activeFleet);
            set('kpi-maintenance-alerts', data.maintenanceAlerts);
            set('kpi-utilization-rate', data.utilizationRate + '%');
            set('kpi-pending-cargo', data.pendingCargo);
        } catch (e) { /* silent */ }
    }
    fetchKpis();
    setInterval(fetchKpis, 30000);
}

// ── Delete Confirm ────────────────────────────────────────────
document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', e => {
        if (!confirm(form.dataset.confirm || 'Are you sure?')) e.preventDefault();
    });
});

// ── File Input Label ──────────────────────────────────────────
document.querySelectorAll('.file-input-wrapper input[type="file"]').forEach(input => {
    input.addEventListener('change', function () {
        const label = this.closest('.file-input-wrapper')?.querySelector('.file-name');
        if (label) label.textContent = this.files[0]?.name || 'No file chosen';
    });
});
