// js/community.js
let posts = [
    { id: 1, author: "FitnessKing", avatar: "🔥", content: "今天達成了硬舉 150kg 的個人紀錄！大家一起加油！", likes: 12, comments: 2 },
    { id: 2, author: "HealthyEater", avatar: "🥑", content: "分享今天的自製鮭魚沙拉，高蛋白又好吃！", likes: 35, comments: 8 }
];

function renderFeed(filterQuery = "") {
    const feed = document.getElementById('community-feed');
    feed.innerHTML = '';
    
    let displayPosts = posts.filter(p => p.content.includes(filterQuery) || p.author.toLowerCase().includes(filterQuery.toLowerCase()));
    
    if (displayPosts.length === 0) {
        feed.innerHTML = '<div class="empty-state">找不到相關貼文。</div>';
        return;
    }

    [...displayPosts].reverse().forEach(post => {
        const el = document.createElement('div');
        el.className = 'post-card';
        el.innerHTML = `
            <div class="avatar-small">${post.avatar}</div>
            <div class="post-body">
                <div class="post-author">${post.author}</div>
                <div class="post-text">${post.content}</div>
                <div class="post-actions">
                    <span onclick="likePost(${post.id})">❤️ ${post.likes}</span>
                    <span>💬 ${post.comments}</span>
                    <span>📤</span>
                </div>
            </div>
        `;
        feed.appendChild(el);
    });
}

function submitPost() {
    const content = document.getElementById('post-content').value.trim();
    if (!content) return;
    
    const myName = document.getElementById('profile-name').value;
    const myAvatar = document.getElementById('profile-avatar').value;
    
    posts.push({ id: Date.now(), author: myName, avatar: myAvatar, content: content, likes: 0, comments: 0 });
    document.getElementById('post-content').value = '';
    renderFeed();
}

function likePost(id) {
    const post = posts.find(p => p.id === id);
    if(post) post.likes++;
    renderFeed(document.getElementById('community-search').value);
}

function filterCommunity() {
    renderFeed(document.getElementById('community-search').value);
}

function openMessages() { document.getElementById('messages-modal').style.display = 'flex'; }
function closeMessages() { document.getElementById('messages-modal').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', () => {
    renderFeed();
});