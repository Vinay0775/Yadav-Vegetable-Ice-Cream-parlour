(function(){
    const presets = {
        green: { accent: '#10b981', success: '#10b981', primary: '#0f172a', accentText: '#ffffff' },
        fresh: { accent: '#0ea5a4', success: '#0ea5a4', primary: '#071427', accentText: '#ffffff' },
        minimal: { accent: '#111827', success: '#4b5563', primary: '#f8fafc', accentText: '#ffffff' },
        pink: { accent: '#ec4899', success: '#ec4899', primary: '#0b1220', accentText: '#ffffff' },
        sunset: { accent: '#f97316', success: '#f97316', primary: '#071427', accentText: '#ffffff' },
        mint: { accent: '#06b6d4', success: '#06b6d4', primary: '#071427', accentText: '#ffffff' }
    };

    function shadeColor(hex, percent) {
        try {
            let c = hex.replace('#','');
            if (c.length === 3) c = c.split('').map(ch=>ch+ch).join('');
            const num = parseInt(c,16);
            let r = (num >> 16) + Math.round(255 * percent/100);
            let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent/100);
            let b = (num & 0x0000FF) + Math.round(255 * percent/100);
            r = Math.max(0,Math.min(255,r)); g = Math.max(0,Math.min(255,g)); b = Math.max(0,Math.min(255,b));
            return `#${(r<<16 | g<<8 | b).toString(16).padStart(6,'0')}`;
        } catch (e) { return hex; }
    }

    function applyPreset(presetName){
        const p = presets[presetName] || presets.green;
        try {
            document.documentElement.style.setProperty('--admin-accent', p.accent);
            document.documentElement.style.setProperty('--admin-sidebar-bg', p.primary);
        } catch(e){}
        const css = `
            .btn-success, .bg-success { background-color: ${p.success} !important; border-color: ${p.success} !important; }
            .text-success { color: ${p.success} !important; }
            a.text-success { color: ${p.accent} !important; }
            .badge.bg-success { background-color: ${p.success} !important; }
            .admin-sidebar { background: linear-gradient(180deg, ${shadeColor(p.primary, -8)} 0%, ${p.primary} 60%) !important; }
        `;
        let s = document.getElementById('themeOverrideStyles');
        if (!s) { s = document.createElement('style'); s.id = 'themeOverrideStyles'; document.head.appendChild(s); }
        s.innerHTML = css;
    }

    // Priority: Cloud theme (if exists), then localStorage
    (function(){
        const local = localStorage.getItem('yadav_theme_preset');
        try {
            if (window && window.db) {
                // fetch cloud theme doc if possible
                window.db.collection('settings').doc('theme').get().then(doc => {
                    if (doc && doc.exists && doc.data && doc.data().preset) {
                        applyPreset(doc.data().preset);
                    } else if (local) applyPreset(local);
                }).catch(() => { if (local) applyPreset(local); });
            } else {
                if (local) applyPreset(local);
            }
        } catch(e) { if (local) applyPreset(local); }
    })();
})();