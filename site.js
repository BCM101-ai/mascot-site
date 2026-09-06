// Local desktop demo, accessible motion controls, mood exploration and live packs.
// No dependencies; also works when index.html is opened directly from disk.
(function () {
    'use strict';
    document.documentElement.classList.add('js');

    // One set of navigation links; compact screens use a disclosure menu.
    var menuToggle = document.querySelector('.nav-menu-toggle');
    var menuLinks = document.getElementById('nav-secondary');
    if (menuToggle && menuLinks) {
        menuToggle.hidden = false;
        function closeMenu(restoreFocus) {
            menuToggle.setAttribute('aria-expanded', 'false');
            if (restoreFocus) menuToggle.focus();
        }
        menuToggle.addEventListener('click', function () {
            menuToggle.setAttribute('aria-expanded', String(menuToggle.getAttribute('aria-expanded') !== 'true'));
        });
        menuLinks.addEventListener('click', function (e) {
            if (e.target.closest('a, [data-feedback]')) closeMenu(false);
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.nav')) closeMenu(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
        });
        window.matchMedia('(max-width: 960px)').addEventListener('change', function () { closeMenu(false); });
    }

    // ---- 1. reveal ---------------------------------------------------------
    var revealables = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        revealables.forEach(function (el) { io.observe(el); });
    } else {
        revealables.forEach(function (el) { el.classList.add('in'); });
    }

    // ---- Motion: respect system preference, offer a page-wide pause. --------
    var motion = document.querySelector('.motion-toggle');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var paused = false;
    function updateMotion() {
        var stop = reduced.matches || paused;
        document.documentElement.classList.toggle('motion-paused', stop);
        if (motion) {
            motion.textContent = reduced.matches ? 'Reduced motion' : (stop ? 'Resume motion' : 'Pause motion');
            motion.setAttribute('aria-pressed', String(stop));
            motion.disabled = reduced.matches;
        }
    }
    if (motion) motion.addEventListener('click', function () { paused = !paused; updateMotion(); });
    if (reduced.addEventListener) reduced.addEventListener('change', updateMotion);
    updateMotion();
    var realDemo = document.getElementById('real-demo');
    if (realDemo) {
        realDemo.addEventListener('toggle', function () {
            if (!realDemo.open) realDemo.querySelector('video').pause();
        });
    }
    // The sign-in guide also works without JS. Enhancement: focus one step at a time.
    var guideSteps = document.querySelectorAll('.guide-step');
    guideSteps.forEach(function (step) {
        step.addEventListener('toggle', function () {
            if (!step.open) step.querySelector('video').pause();
            else guideSteps.forEach(function (other) { if (other !== step) other.open = false; });
        });
        var next = step.querySelector('[data-next-step]');
        if (next) {
            next.hidden = false;
            next.addEventListener('click', function () {
                var target = document.getElementById('classroom-step-' + next.dataset.nextStep);
                step.open = false;
                target.open = true;
                target.querySelector('summary').focus({ preventScroll: true });
                target.scrollIntoView({ block: 'start', behavior: 'auto' });
            });
        }
    });
    document.querySelectorAll('video').forEach(function (video) {
        video.addEventListener('play', function () {
            document.querySelectorAll('video').forEach(function (other) { if (other !== video) other.pause(); });
        });
    });
    document.addEventListener('visibilitychange', function () {
        document.documentElement.classList.toggle('page-hidden', document.hidden);
    });
    if ('IntersectionObserver' in window) {
        var animationView = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { e.target.classList.toggle('offstage', !e.isIntersecting); });
        }, { rootMargin: '80px' });
        document.querySelectorAll('.desktop-scene, .hero-stage, .mood-row, .tile').forEach(function (n) { animationView.observe(n); });
    }
    var nav = document.querySelector('.nav');
    if (nav) {
        var scrollPending = false;
        function navState() { nav.classList.toggle('is-scrolled', window.scrollY > 12); scrollPending = false; }
        window.addEventListener('scroll', function () {
            if (!scrollPending) { scrollPending = true; requestAnimationFrame(navState); }
        }, { passive: true });
        navState();
    }

    // ---- Desktop preview. All assignments here are fictional sample data. ---
    var scene = document.querySelector('.desktop-scene');
    if (scene) {
        var panel = scene.querySelector('.work-panel');
        var pet = scene.querySelector('.desktop-pet .sprite');
        var content = scene.querySelector('.work-content');
        var previewModes = document.querySelectorAll('[data-preview]');
        function preview(state, completed) {
            var clear = state === 'clear';
            scene.dataset.state = state;
            panel.hidden = false;
            pet.className = 'sprite expressive sprite--' + (clear ? 'calm' : state);
            scene.querySelector('.work-empty').hidden = !clear;
            scene.querySelector('.work-assignment').hidden = clear;
            document.getElementById('work-count').textContent = clear ? 'Nothing pending' : '1 item';
            document.getElementById('assignment-time').textContent = state === 'overdue' ? '12 hours overdue' : 'Due in 2 hours';
            scene.querySelector('.assignment-group').textContent = state === 'overdue' ? 'Past due' : 'Today';
            scene.querySelector('.desktop-status').textContent = completed ? 'One less thing on your mind' : ({ clear: 'Just hanging out', urgent: 'A little nudge', overdue: 'Still here for you' })[state];
            document.getElementById('work-updated').textContent = completed ? 'Sample work completed' : 'Sample preview';
            previewModes.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.preview === state)); });
            content.classList.remove('state-changed');
            void content.offsetWidth;
            content.classList.add('state-changed');
        }
        previewModes.forEach(function (b) { b.addEventListener('click', function () { preview(b.dataset.preview); }); });
        scene.querySelector('.complete-assignment').addEventListener('click', function () { preview('clear', true); });
        scene.querySelector('.work-close').addEventListener('click', function () {
            panel.hidden = true;
            scene.querySelector('.desktop-pet').focus({ preventScroll: true });
        });
        scene.querySelector('.desktop-pet').addEventListener('click', function () {
            panel.hidden = false;
            scene.querySelector('.work-close').focus({ preventScroll: true });
        });
        scene.querySelector('.work-refresh').addEventListener('click', function () {
            preview(scene.dataset.state);
            document.getElementById('work-updated').textContent = 'Sample refreshed just now';
        });
    }

    // ---- Mood slider: defaults from Mood.Thresholds, measured in hours. -----
    function moodFor(hours) {
        if (hours < 0) return 'overdue';
        if (hours < 6) return 'urgent';
        if (hours < 24) return 'worried';
        if (hours < 72) return 'attentive';
        return 'calm';
    }
    function describe(hours) {
        if (hours < 0) return Math.abs(hours) + ' hours overdue';
        if (hours === 0) return 'due now';
        if (hours === 1) return '1 hour away';
        if (hours % 24 === 0) return (hours / 24) + ((hours === 24) ? ' day away' : ' days away');
        return hours + ' hours away';
    }
    var slider = document.getElementById('mood-range');
    var out = document.getElementById('mood-out');
    var moods = document.querySelectorAll('.mood[data-mood]');
    function setMood() {
        var hours = parseInt(slider.value, 10);
        var m = moodFor(hours);
        moods.forEach(function (el) {
            var active = el.dataset.mood === m;
            el.classList.toggle('active', active);
            el.setAttribute('aria-pressed', String(active));
        });
        out.textContent = describe(hours);
        slider.setAttribute('aria-valuetext', describe(hours) + ', ' + m);
    }
    if (slider && out) {
        slider.addEventListener('input', setMood);
        setMood();
        var jump = { calm: 96, attentive: 48, worried: 12, urgent: 2, overdue: -6 };
        moods.forEach(function (el) {
            el.addEventListener('click', function () { slider.value = jump[el.dataset.mood]; setMood(); });
        });
    }

    // ---- feedback ----------------------------------------------------------
    // Posts straight to Supabase. The key below is the project's *publishable*
    // key and is meant to be public: the table's row-level security lets it
    // insert and nothing else, so it cannot read back a single row: not even
    // the one it just wrote. Reading is an admin's job.
    var FEEDBACK = {
        url: 'https://fcyhiujhvafozihopxsu.supabase.co/rest/v1/feedback',
        key: 'sb_publishable_aFjZ_fZNIkUy8U5dzhJZxA_m6hnp8ov'
    };
    var fb = document.getElementById('feedback');
    if (fb) {
        var form = document.getElementById('fb-form');
        var message = document.getElementById('fb-message');
        var contact = document.getElementById('fb-contact');
        var trap = document.getElementById('fb-website');
        var status = document.getElementById('fb-status');
        var left = document.getElementById('fb-left');
        var send = document.getElementById('fb-send');

        function count() { left.textContent = 4000 - message.value.length; }
        message.addEventListener('input', count); count();

        function open_() {
            status.textContent = ''; status.className = 'fb-status';
            send.disabled = false; send.textContent = 'Send';
            if (typeof fb.showModal === 'function') fb.showModal();
            else fb.setAttribute('open', '');
            message.focus();
        }
        document.querySelectorAll('[data-feedback]').forEach(function (b) {
            b.addEventListener('click', open_);
        });
        document.getElementById('fb-close').addEventListener('click', function () { fb.close(); });
        fb.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { e.preventDefault(); fb.close(); }
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var text = message.value.trim();
            if (!text) { message.focus(); return; }
            // Anything in the honeypot is a bot. Say "thanks" and send nothing,
            // so it has no signal to learn from.
            if (trap.value) { fb.close(); return; }

            send.disabled = true; send.textContent = 'Sending…';
            status.textContent = ''; status.className = 'fb-status';

            fetch(FEEDBACK.url, {
                method: 'POST',
                headers: {
                    'apikey': FEEDBACK.key,
                    'Authorization': 'Bearer ' + FEEDBACK.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    message: text,
                    contact: contact.value.trim() || null,
                    source: 'website'
                })
            }).then(function (r) {
                if (!r.ok) throw new Error(r.status);
                status.textContent = 'Sent, thank you. I read all of these.';
                status.className = 'fb-status ok';
                message.value = ''; contact.value = ''; count();
                send.textContent = 'Sent';
                setTimeout(function () { fb.close(); }, 1600);
            }).catch(function () {
                status.textContent = 'That did not send. Email me instead: Thanachot10072550@gmail.com';
                status.className = 'fb-status err';
                send.disabled = false; send.textContent = 'Try again';
            });
        });
    }

    // ---- 3. packs ----------------------------------------------------------
    // The catalogue is the file the app's store reads, served from this site.
    // When previewing on localhost there is no packs/ folder, so read the live one;
    // GitHub Pages sends Access-Control-Allow-Origin: * so that works.
    var grid = document.getElementById('packs');
    if (!grid) return;
    var local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var CATALOG = local ? 'https://studymascot.com/packs/catalog.json' : 'packs/catalog.json';

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    // A sheet is N frames in one row. The frame's shape is only known once the
    // image loads, so the box is sized from the real proportions, a pack drawn
    // on a taller canvas than the capybara still fits its slot.
    function styleSprite(s, pack, width, onReady, onError) {
        var frames = Math.max(1, parseInt(pack.previewFrames, 10) || 1);
        s.style.setProperty('--frames', frames);
        s.style.setProperty('--fw', width + 'px');
        if (frames < 2) s.style.animation = 'none';
        if (!pack.preview) return s;
        s.style.setProperty('--sheet', 'url("' + pack.preview + '")');
        var probe = new Image();
        probe.onload = function () {
            s.style.height = Math.round(width * (probe.naturalHeight / (probe.naturalWidth / frames))) + 'px';
            if (onReady) onReady();
        };
        probe.onerror = function () { if (onError) onError(); };
        probe.src = pack.preview;
        return s;
    }

    function spriteFor(pack) {
        return styleSprite(el('div', 'sprite'), pack, 150);
    }

    // The app words these two the same way; keeping the strings identical means
    // the site and the store never disagree about what a pack offers.
    function completeness(pack) {
        if (!Array.isArray(pack.moods)) return 'moods not listed';
        return pack.moods.length + ' of 5 moods';
    }
    function priceLabel(pack) {
        var p = Number(pack.price) || 0;
        return p <= 0 ? 'Free' : p.toFixed(2);
    }

    // ---- the pack page, mirroring the app's detail sheet -------------------
    var sheet = document.getElementById('pack-detail');
    var sheetArt = document.getElementById('sheet-art');
    var packMoodControls = document.getElementById('pack-mood-controls');
    var packPreviewStatus = document.getElementById('sheet-preview-status');
    var previewRequest = 0;
    var moodNames = ['calm', 'attentive', 'worried', 'urgent', 'overdue'];
    function showPackMood(pack, mood) {
        var library = (window.MASCOT_PACK_PREVIEWS || {})[pack.id] || {};
        var art = library[mood] || pack;
        var request = ++previewRequest;
        var title = mood[0].toUpperCase() + mood.slice(1);
        packPreviewStatus.textContent = 'Loading ' + title.toLowerCase() + '…';
        var next = el('div', 'sprite');
        next.id = 'sheet-art';
        next.setAttribute('aria-hidden', 'true');
        if (art.width && art.height) next.style.height = (200 * art.height / art.width) + 'px';
        sheetArt.replaceWith(styleSprite(next, art, 200, function () {
            if (request === previewRequest) packPreviewStatus.textContent = title + (library[mood] ? ' · From this pack' : ' preview');
        }, function () {
            if (request !== previewRequest) return;
            next.style.backgroundImage = 'none';
            packPreviewStatus.textContent = 'This preview couldn’t load. Choose another mood or reopen the pack to retry.';
        }));
        sheetArt = next;
        packMoodControls.querySelectorAll('button').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.dataset.packMood === mood));
        });
    }

    function openSheet(pack) {
        document.getElementById('sheet-name').textContent = pack.name || pack.id;
        var by = document.getElementById('sheet-by');
        by.textContent = pack.creator ? 'by ' + pack.creator : '';
        by.hidden = !pack.creator;

        packMoodControls.replaceChildren();
        var library = (window.MASCOT_PACK_PREVIEWS || {})[pack.id] || {};
        moodNames.forEach(function (mood) {
            if (!library[mood]) return;
            var b = el('button', 'pack-mood-button', mood[0].toUpperCase() + mood.slice(1));
            b.type = 'button';
            b.dataset.packMood = mood;
            b.setAttribute('aria-pressed', 'false');
            b.addEventListener('click', function () { showPackMood(pack, mood); });
            packMoodControls.appendChild(b);
        });
        packMoodControls.hidden = !packMoodControls.childElementCount;
        showPackMood(pack, 'calm');

        document.getElementById('sheet-moods').textContent = completeness(pack);
        document.getElementById('sheet-price').textContent = priceLabel(pack);
        var desc = document.getElementById('sheet-desc');
        desc.textContent = pack.description || '';
        desc.hidden = !pack.description;
        var upd = document.getElementById('sheet-updated');
        upd.textContent = pack.updated ? 'Updated ' + pack.updated : '';
        upd.hidden = !pack.updated;

        var get = document.getElementById('sheet-get');
        var free = (Number(pack.price) || 0) <= 0;
        if (free) get.href = pack.download;
        else get.removeAttribute('href');
        get.setAttribute('aria-disabled', String(!free));
        get.setAttribute('download', '');
        get.textContent = free ? 'Download pack' : 'Purchases not available yet';
        sheet.querySelector('.sheet-note').textContent = free ? 'Free · macOS 14 or later' : 'Browse free packs in Mascot';

        if (typeof sheet.showModal === 'function') sheet.showModal();
        else sheet.setAttribute('open', '');
        sheet.querySelector('.sheet-body').scrollTop = 0;
    }

    if (sheet) {
        document.getElementById('sheet-close').addEventListener('click', function () { sheet.close(); });
        // <dialog> closes itself on Escape, but only when it was opened with
        // showModal(); this keeps the key working in the fallback path too.
        sheet.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { e.preventDefault(); sheet.close(); }
        });
        // Clicking the backdrop closes it: the click lands on the dialog itself
        // only when it is outside the padded content box.
        sheet.addEventListener('click', function (e) {
            if (e.target !== sheet) return;
            var b = sheet.getBoundingClientRect();
            var outside = e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom;
            if (outside) sheet.close();
        });
    }

    function card(pack, i) {
        var c = el('button', 'store-card reveal');
        c.type = 'button';
        c.style.setProperty('--i', i);

        var art = el('div', 'store-art');
        art.appendChild(spriteFor(pack));
        c.appendChild(art);

        c.appendChild(el('span', 'store-name', pack.name || pack.id));
        if (pack.creator) c.appendChild(el('span', 'store-by', pack.creator));

        var line = el('span', 'store-line');
        line.appendChild(el('span', 'store-price', priceLabel(pack)));
        line.appendChild(el('span', 'dotsep', '·'));
        line.appendChild(el('span', null, completeness(pack)));
        c.appendChild(line);

        c.addEventListener('click', function () { openSheet(pack); });
        return c;
    }

    function safeURL(value) {
        try { return new URL(value).protocol === 'https:'; } catch (_) { return false; }
    }
    function loadPacks() {
        grid.replaceChildren(el('p', 'packs-note', 'Loading the pack list…'));
        var controller = new AbortController();
        var timeout = setTimeout(function () { controller.abort(); }, 10000);
        fetch(CATALOG, { cache: 'no-cache', signal: controller.signal })
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (cat) {
                if (cat.version !== 1 || !Array.isArray(cat.packs)) throw new Error('Unsupported catalogue');
                var packs = cat.packs.filter(function (p) { return p && safeURL(p.download); });
                grid.textContent = '';
                packs.forEach(function (p, i) {
                    if (p.preview && !safeURL(p.preview)) p = Object.assign({}, p, { preview: null });
                    var n = card(p, i);
                    grid.appendChild(n);
                    n.classList.add('in');
                    if (typeof animationView !== 'undefined' && animationView) animationView.observe(n);
                });
                if (!packs.length) grid.appendChild(el('p', 'packs-note', 'New buddies are on their way. Check back soon.'));
            })
            .catch(function () {
                grid.textContent = '';
                var box = el('div', 'packs-note');
                box.appendChild(el('p', null, 'The pack list couldn’t load. You can also find your buddies in Mascot’s Store.'));
                var retry = el('button', 'btn packs-retry', 'Try again');
                retry.type = 'button';
                retry.addEventListener('click', loadPacks);
                box.appendChild(retry);
                grid.appendChild(box);
            })
            .finally(function () { clearTimeout(timeout); });
    }
    loadPacks();
})();
