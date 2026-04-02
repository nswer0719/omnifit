// js/community.js
let posts = [
    { id: 1, author: "FitnessKing", avatar: "🔥", content: "今天達成了硬舉 150kg 的個人紀錄！大家一起加油！", media: "video_001.mp4", bio: "重訓狂熱者，目標硬舉200kg" },
    { id: 2, author: "HealthyEater", avatar: "🥑", content: "分享今天的自製鮭魚沙拉，高蛋白又好吃！", media: "photo_salad.jpg", bio: "喜歡研究健康飲食，吃得好才能練得好" }
];

let myProfile = { name: "我的名字", avatar: "👤", bio: "這是我的個人簡介..." };

function switchCommunityTab(tab, el) {
    document.querySelectorAll('#tab-community .sub-tab-item').forEach(e => e.classList.remove('active')); el.classList.add('active');
    if(tab === 'feed') { document.getElementById('community-feed-view').style.display = 'block'; document.getElementById('community-profile-view').style.display = 'none'; renderFeed(); }
    else { document.getElementById('community-feed-view').style.display = 'none'; document.getElementById('community-profile-view').style.display = 'block'; renderMyProfile(); }
}

function updateFileName() {
    const fileInput = document.getElementById('media-upload');
    if (fileInput.files.length > 0) {
        document.getElementById('file-name-display').innerText = `已選擇: ${fileInput.files[0].name}`;
    } else { document.getElementById('file-name-display').innerText = ""; }
}

function submitPost() {
    const content = document.getElementById('post-content').value.trim();
    const fileInput = document.getElementById('media-upload');
    let mediaName = fileInput.files.length > 0 ? fileInput.files[0].name : null;
    
    if (!content && !mediaName) return;
    
    posts.push({ id: Date.now(), author: myProfile.name, avatar: myProfile.avatar, content: content, media: mediaName, isMine: true });
    
    document.getElementById('post-content').value = '';
    fileInput.value = ''; document.getElementById('file-name-display').innerText = "";
    renderFeed();
}

function renderFeed(filterQuery = "") {
    const feed = document.getElementById('community-feed'); feed.innerHTML = '';
    let displayPosts = posts.filter(p => p.content.includes(filterQuery) || p.author.toLowerCase().includes(filterQuery.toLowerCase()));
    if (displayPosts.length === 0) { feed.innerHTML = '<div class="empty-state">找不到相關內容。</div>'; return; }

    [...displayPosts].reverse().forEach(post => {
        let mediaHtml = post.media ? `<div class="post-media">📎 附件: ${post.media} (點擊預覽)</div>` : '';
        feed.innerHTML += `
            <div class="post-card">
                <div class="avatar-small" onclick="openUserPreview('${post.author}', '${post.avatar}', '${post.bio || ''}')">${post.avatar}</div>
                <div class="post-body">
                    <div class="post-author" onclick="openUserPreview('${post.author}', '${post.avatar}', '${post.bio || ''}')">${post.author}</div>
                    <div class="post-text">${post.content}</div>
                    ${mediaHtml}
                    <div class="post-actions"><span>❤️ 讚</span><span onclick="openMessages()">💬 留言</span></div>
                </div>
            </div>
        `;
    });
}

function filterCommunity() { renderFeed(document.getElementById('community-search').value); }

function renderMyProfile() {
    const feed = document.getElementById('my-posts-feed'); feed.innerHTML = '';
    let myPosts = posts.filter(p => p.isMine || p.author === myProfile.name);
    if(myPosts.length === 0) feed.innerHTML = '<div class="empty-state">尚未發佈任何貼文。</div>';
    else {
        [...myPosts].reverse().forEach(post => {
            let mediaHtml = post.media ? `<div class="post-media">📎 附件: ${post.media}</div>` : '';
            feed.innerHTML += `<div class="post-card"><div class="avatar-small">${post.avatar}</div><div class="post-body"><div class="post-author">${post.author}</div><div class="post-text">${post.content}</div>${mediaHtml}</div></div>`;
        });
    }
}

function updateMyProfileInfo() {
    myProfile.name = document.getElementById('profile-page-name').value || "用戶";
    myProfile.bio = document.getElementById('profile-page-bio').value;
    document.getElementById('my-avatar-preview').innerText = myProfile.avatar;
}

// 用戶預覽與追蹤
function openUserPreview(name, avatar, bio) {
    if(name === myProfile.name) return; // 點擊自己不跳窗
    document.getElementById('preview-name').innerText = name;
    document.getElementById('preview-avatar').innerText = avatar;
    document.getElementById('preview-bio').innerText = bio || "這個人很懶，什麼都沒寫。";
    document.getElementById('follow-btn').innerText = "追蹤";
    document.getElementById('user-preview-modal').style.display = 'flex';
}
function closeUserPreview() { document.getElementById('user-preview-modal').style.display = 'none'; }
function toggleFollow() {
    const btn = document.getElementById('follow-btn');
    btn.innerText = btn.innerText === "追蹤" ? "已追蹤" : "追蹤";
}

// 訊息與聊天
function startChatFromPreview() {
    closeUserPreview();
    openMessages();
}
function openMessages() { document.getElementById('messages-modal').style.display = 'flex'; }
function closeMessages() { document.getElementById('messages-modal').style.display = 'none'; }

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const txt = input.value.trim();
    if(!txt) return;
    const history = document.getElementById('chat-history');
    history.innerHTML += `<div style="align-self:flex-end; background:var(--accent-color); color:#000; padding:10px; border-radius:15px; font-weight:bold;">我: ${txt}</div>`;
    input.value = '';
    history.scrollTop = history.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => { renderFeed(); });
