// --- Notification permission button ---
function updateNotifBtn() {
  var btn = document.getElementById('notifToggle');
  if (!('Notification' in window)) {
    btn.textContent = 'unsupported';
    btn.className = 'notif-btn off';
    btn.disabled = true;
  } else if (Notification.permission === 'granted') {
    btn.textContent = 'notifs on';
    btn.className = 'notif-btn on';
  } else if (Notification.permission === 'denied') {
    btn.textContent = 'notifs blocked';
    btn.className = 'notif-btn off';
    btn.disabled = true;
  } else {
    btn.textContent = 'enable notifs';
    btn.className = 'notif-btn';
  }
}

function toggleNotif() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(function (p) {
      if (p === 'granted') {
        new Notification('Notifications enabled', { body: 'You will be notified of new YouTube notifications.' });
      }
      updateNotifBtn();
    });
  }
}

updateNotifBtn();

// --- SPA rendering ---
var state = { limit: 20, offset: 0, total: 0, latestId: null, items: [] };

function el(tag, attrs) {
  var e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    if (k === 'className') e.className = attrs[k];
    else if (k === 'href' && attrs[k]) e.setAttribute(k, attrs[k]);
    else if (k === 'src' && attrs[k]) e.setAttribute(k, attrs[k]);
    else if (k === 'referrerPolicy') e.referrerPolicy = attrs[k];
    else if (k === 'title') e.setAttribute(k, attrs[k]);
    else if (k === 'target') e.setAttribute(k, attrs[k]);
    else if (k === 'rel') e.setAttribute(k, attrs[k]);
    else if (k === 'textContent') e.textContent = attrs[k];
    else if (k === 'onclick') e.onclick = attrs[k];
    else if (k === 'disabled') e.disabled = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else e.setAttribute(k, attrs[k]);
  });
  return e;
}

function buildNotifEl(item) {
  var wrapper = item._linkUrl
    ? el('a', { className: 'notification', href: item._linkUrl, target: '_blank', rel: 'noopener' })
    : el('div', { className: 'notification' });

  if (item.thumbnail_url) {
    wrapper.appendChild(el('img', { className: 'avatar', src: item.thumbnail_url, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer' }));
  }

  var body = el('div', { className: 'body' });
  body.appendChild(el('div', { className: 'message', textContent: item.short_message.text }));
  body.appendChild(el('div', { className: 'time', textContent: item._sentFormatted, title: item._sentAbsolute }));
  wrapper.appendChild(body);

  if (item.video_id) {
    wrapper.appendChild(el('img', { className: 'thumb', src: 'https://i.ytimg.com/vi/' + item.video_id + '/default.jpg', alt: '', loading: 'lazy', referrerPolicy: 'no-referrer' }));
  }

  return wrapper;
}

function renderList(items) {
  var list = document.getElementById('notifList');
  list.innerHTML = '';
  if (items.length === 0) {
    list.appendChild(el('div', { className: 'time', textContent: 'No notifications yet.', style: 'text-align:center;padding:40px' }));
  } else {
    items.forEach(function (item) { list.appendChild(buildNotifEl(item)); });
  }
}

function renderPagination() {
  var pg = document.getElementById('pagination');
  pg.innerHTML = '';
  var hasPrev = state.offset > 0;
  var hasNext = state.offset + state.limit < state.total;

  var first = el('button', { textContent: '«', title: 'First', disabled: !hasPrev, onclick: function () { goTo(0); } });
  pg.appendChild(first);

  var prev = el('button', { textContent: '←', title: 'Previous', disabled: !hasPrev, onclick: function () { goTo(state.offset - state.limit); } });
  pg.appendChild(prev);

  var start = state.total === 0 ? 0 : state.offset + 1;
  var end = Math.min(state.offset + state.limit, state.total);
  pg.appendChild(el('span', { textContent: start + '–' + end + ' / ' + state.total }));

  var next = el('button', { textContent: '→', title: 'Next', disabled: !hasNext, onclick: function () { goTo(state.offset + state.limit); } });
  pg.appendChild(next);

  var lastOffset = Math.max(0, Math.floor((state.total - 1) / state.limit) * state.limit);
  var last = el('button', { textContent: '»', title: 'Last', disabled: !hasNext, onclick: function () { goTo(lastOffset); } });
  pg.appendChild(last);
}

async function goTo(offset) {
  state.offset = Math.max(0, offset);
  document.getElementById('newIndicator').classList.remove('active');
  localStorage.setItem('notifLimit', state.limit);
  var url = new URL(window.location);
  if (state.limit !== 20) url.searchParams.set('limit', state.limit);
  else url.searchParams.delete('limit');
  if (state.offset !== 0) url.searchParams.set('offset', state.offset);
  else url.searchParams.delete('offset');
  history.pushState({ offset: state.offset }, '', url.toString());
  await fetchPage();
}

async function fetchPage() {
  try {
    document.getElementById('notifList').innerHTML = '<div class="spinner"></div>';
    var res = await fetch('/api/notifications?limit=' + state.limit + '&offset=' + state.offset);
    var data = await res.json();
    state.total = data.total;
    state.items = data.items;
    if (state.items.length > 0 && !state.latestId) {
      // Get actual latest ID from a fresh query, not from this page
      var latestRes = await fetch('/api/notifications/latest');
      var latestData = await latestRes.json();
      state.latestId = latestData.item ? latestData.item.id : null;
    }
    renderList(data.items);
    renderPagination();
  } catch (err) {
    document.getElementById('notifList').innerHTML = '<div class="time" style="text-align:center;padding:40px">Failed to load.</div>';
  }
}

async function pollNew() {
  try {
    var res = await fetch('/api/notifications/latest');
    var data = await res.json();
    if (!data.item) {
      return;
    }
    if (state.latestId && data.item.id !== state.latestId) {
      // New notification(s)! Fetch batch to catch all
      var batchRes = await fetch('/api/notifications?limit=10');
      var batchData = await batchRes.json();
      var newItems = [];
      for (var i = 0; i < batchData.items.length; i++) {
        if (batchData.items[i].id === state.latestId) {
          break;
        }
        newItems.push(batchData.items[i]);
      }
      if (newItems.length > 0) {
        state.latestId = newItems[0].id;
        document.getElementById('newIndicator').classList.add('active');
        var audio = new Audio('/se_chat_announce.ogg');
        audio.play().catch(function () { /* autoplay blocked */ });
        if ('Notification' in window && Notification.permission === 'granted') {
          newItems.forEach(function (item) {
            new Notification(item.short_message.text, { icon: item.thumbnail_url || undefined, body: item.short_message.text });
          });
        }
        // Prepend new items if on first page, otherwise just update count
        if (state.offset === 0) {
          renderList(newItems.concat(state.items));
        }
        state.total += newItems.length;
        renderPagination();
      }
    } else if (!state.latestId) {
      state.latestId = data.item.id;
    }
  } catch (err) { /* ignore */ }
}

function changeLimit(value) {
  state.limit = +value || 20;
  goTo(0);
}

// Init — param > localStorage > default (20)
(function () {
  var url = new URL(window.location);
  var paramLimit = +url.searchParams.get('limit') || 0;
  var storedLimit = +localStorage.getItem('notifLimit') || 0;
  state.limit = paramLimit || storedLimit || 20;
  state.offset = +url.searchParams.get('offset') || 0;

  var sel = document.getElementById('limitSelect');
  [5, 10, 20, 50, 100].forEach(function (v) {
    var opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (v === state.limit) opt.selected = true;
    sel.appendChild(opt);
  });

  var cleanUrl = new URL(window.location);
  if (state.limit !== 20) cleanUrl.searchParams.set('limit', state.limit);
  else cleanUrl.searchParams.delete('limit');
  if (state.offset !== 0) cleanUrl.searchParams.set('offset', state.offset);
  else cleanUrl.searchParams.delete('offset');
  history.replaceState({ offset: state.offset }, '', cleanUrl.toString());
  fetchPage();
})();

window.addEventListener('popstate', function (e) {
  var url = new URL(window.location);
  var paramLimit = +url.searchParams.get('limit') || 0;
  if (paramLimit) state.limit = paramLimit;
  state.offset = (e.state && e.state.offset) || +url.searchParams.get('offset') || 0;
  fetchPage();
});

setInterval(pollNew, 10000);
