// ===========================================
// Feed Page Logic
// Handles: post creation, feed loading, likes,
// comments, AI caption enhancement
// ===========================================

let currentPage = 1;
let totalPages = 1;
let isLoadingPosts = false;

// ===========================================
// Page Initialization
// ===========================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for Firebase auth state
        const user = await requireAuth();

        // Render navigation
        await renderNavbar('feed');

        // Load sidebar profile
        await loadSidebarProfile();

        // Load feed posts
        await loadFeedPosts();

        // Load people suggestions
        await loadPeopleSuggestions();

        // Setup image preview for post creation
        setupImagePreview('post-image', 'post-image-preview');

        // Hide page loader
        document.getElementById('page-loader').classList.add('hidden');
    } catch (error) {
        console.error('Feed init error:', error);
        showToast('Error loading feed. Please refresh.', 'error');
        document.getElementById('page-loader').classList.add('hidden');
    }
});

// ===========================================
// Sidebar Profile
// ===========================================
async function loadSidebarProfile() {
    const container = document.getElementById('sidebar-profile');
    const avatarContainer = document.getElementById('create-post-avatar');

    try {
        if (!window.currentUser) {
            const response = await apiRequest('/api/users/me');
            if (response.success) {
                window.currentUser = response.data;
            }
        }

        const user = window.currentUser;

        if (user) {
            container.innerHTML = `
                <div class="sidebar-profile-banner"></div>
                <div class="sidebar-profile-info">
                    ${avatarHTML(user.profilePicture, user.fullName, 'avatar-lg')}
                    <h3><a href="/profile.html" style="text-decoration: none; color: inherit;">${escapeHtml(user.fullName)}</a></h3>
                    <p>${escapeHtml(user.headline || 'Add a headline')}</p>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                        <a href="/profile.html" class="btn btn-ghost btn-sm" style="width: 100%;">View Profile</a>
                    </div>
                </div>
            `;

            if (avatarContainer) {
                avatarContainer.innerHTML = avatarHTML(user.profilePicture, user.fullName);
            }
        } else {
            container.innerHTML = `
                <div style="padding: 24px; text-align: center;">
                    <p style="margin-bottom: 12px; font-size: 0.9rem;">Complete your profile</p>
                    <a href="/edit-profile.html" class="btn btn-primary btn-sm">Create Profile</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Sidebar profile error:', error);
        container.innerHTML = `
            <div style="padding: 24px; text-align: center;">
                <p style="margin-bottom: 12px; font-size: 0.9rem;">Set up your profile</p>
                <a href="/edit-profile.html" class="btn btn-primary btn-sm">Create Profile</a>
            </div>
        `;
    }
}

// ===========================================
// Feed Posts
// ===========================================
async function loadFeedPosts(page = 1) {
    const container = document.getElementById('feed-container');
    const loadMoreContainer = document.getElementById('load-more-container');

    if (isLoadingPosts) return;
    isLoadingPosts = true;

    if (page === 1) {
        showSkeletonLoader(container, 3);
    }

    try {
        const response = await apiRequest(`/api/posts?page=${page}&limit=10`);

        if (page === 1) {
            container.innerHTML = '';
        }

        if (response.success && response.data.length > 0) {
            response.data.forEach((post) => {
                container.innerHTML += createPostHTML(post);
            });

            totalPages = response.pagination.pages;
            currentPage = page;

            // Show/hide load more button
            if (currentPage < totalPages) {
                loadMoreContainer.style.display = 'block';
            } else {
                loadMoreContainer.style.display = 'none';
            }
        } else if (page === 1) {
            container.innerHTML = `
                <div class="empty-state card" style="padding: 60px 20px;">
                    <i class="fas fa-newspaper"></i>
                    <h3>No Posts Yet</h3>
                    <p>Be the first to share something with the community!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load feed error:', error);
        if (page === 1) {
            container.innerHTML = `
                <div class="empty-state card" style="padding: 40px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Feed</h3>
                    <p>Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    isLoadingPosts = false;
}

function loadMorePosts() {
    loadFeedPosts(currentPage + 1);
}

// ===========================================
// Create Post HTML
// ===========================================
function createPostHTML(post) {
    const isLiked = window.currentUser && post.likes.some(
        (like) => (typeof like === 'string' ? like : like._id) === window.currentUser._id
    );

    const authorName = post.author?.fullName || 'Unknown User';
    const authorHeadline = post.author?.headline || '';
    const authorPic = post.author?.profilePicture || '';
    const authorId = post.author?._id || '';

    return `
        <div class="post-card" id="post-${post._id}">
            <div class="post-header">
                ${avatarHTML(authorPic, authorName)}
                <div class="post-author-info">
                    <a href="/profile.html?id=${authorId}" class="post-author-name">${escapeHtml(authorName)}</a>
                    <div class="post-author-headline">${escapeHtml(authorHeadline)}</div>
                    <div class="post-time">${timeAgo(post.createdAt)}</div>
                </div>
                ${window.currentUser && window.currentUser._id === authorId ? `
                    <button class="btn btn-ghost btn-sm" onclick="deletePost('${post._id}')" title="Delete post" style="color: var(--text-muted);">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                ` : ''}
            </div>

            <div class="post-content">${escapeHtml(post.content)}</div>

            ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image" onclick="window.open('${post.image}', '_blank')">` : ''}

            <div class="post-stats">
                <span onclick="toggleComments('${post._id}')">
                    ${post.likes.length > 0 ? `<i class="fas fa-thumbs-up" style="color: var(--primary);"></i> ${post.likes.length} like${post.likes.length !== 1 ? 's' : ''}` : ''}
                </span>
                <span onclick="toggleComments('${post._id}')">
                    ${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div class="post-actions">
                <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post._id}')" id="like-btn-${post._id}">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${isLiked ? 'Liked' : 'Like'}</span>
                </button>
                <button class="post-action-btn" onclick="toggleComments('${post._id}')" id="comment-btn-${post._id}">
                    <i class="fas fa-comment"></i>
                    <span>Comment</span>
                </button>
            </div>

            <!-- Comments Section -->
            <div class="comments-section" id="comments-${post._id}">
                <div class="comment-input-wrapper">
                    ${window.currentUser ? avatarHTML(window.currentUser.profilePicture, window.currentUser.fullName, 'avatar-sm') : ''}
                    <input type="text" class="comment-input" id="comment-input-${post._id}" 
                        placeholder="Write a comment..." 
                        onkeypress="if(event.key === 'Enter') addComment('${post._id}')">
                    <button class="btn btn-primary btn-sm" onclick="addComment('${post._id}')" id="submit-comment-${post._id}">Post</button>
                </div>
                <div id="comments-list-${post._id}">
                    ${post.comments.map((comment) => createCommentHTML(comment)).join('')}
                </div>
            </div>
        </div>
    `;
}

function createCommentHTML(comment) {
    const authorName = comment.author?.fullName || 'Unknown';
    const authorPic = comment.author?.profilePicture || '';
    const authorId = comment.author?._id || '';

    return `
        <div class="comment-item">
            ${avatarHTML(authorPic, authorName, 'avatar-sm')}
            <div class="comment-body">
                <a href="/profile.html?id=${authorId}" class="comment-author">${escapeHtml(authorName)}</a>
                <div class="comment-text">${escapeHtml(comment.content)}</div>
                <div class="comment-time">${timeAgo(comment.createdAt)}</div>
            </div>
        </div>
    `;
}

// ===========================================
// Post Interactions
// ===========================================

/**
 * Toggle like on a post.
 */
async function toggleLike(postId) {
    try {
        const response = await apiRequest(`/api/posts/${postId}/like`, {
            method: 'PUT',
        });

        if (response.success) {
            const likeBtn = document.getElementById(`like-btn-${postId}`);
            const postCard = document.getElementById(`post-${postId}`);
            const statsEl = postCard.querySelector('.post-stats span:first-child');

            if (response.data.isLiked) {
                likeBtn.classList.add('liked');
                likeBtn.querySelector('span').textContent = 'Liked';
            } else {
                likeBtn.classList.remove('liked');
                likeBtn.querySelector('span').textContent = 'Like';
            }

            // Update like count
            if (response.data.likesCount > 0) {
                statsEl.innerHTML = `<i class="fas fa-thumbs-up" style="color: var(--primary);"></i> ${response.data.likesCount} like${response.data.likesCount !== 1 ? 's' : ''}`;
            } else {
                statsEl.innerHTML = '';
            }
        }
    } catch (error) {
        showToast('Error liking post', 'error');
    }
}

/**
 * Toggle comments section visibility.
 */
function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    section.classList.toggle('expanded');

    if (section.classList.contains('expanded')) {
        const input = document.getElementById(`comment-input-${postId}`);
        if (input) setTimeout(() => input.focus(), 300);
    }
}

/**
 * Add a comment to a post.
 */
async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();

    if (!content) return;

    const submitBtn = document.getElementById(`submit-comment-${postId}`);

    try {
        setButtonLoading(submitBtn, '...');

        const response = await apiRequest(`/api/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });

        if (response.success) {
            const commentsList = document.getElementById(`comments-list-${postId}`);
            commentsList.innerHTML += createCommentHTML(response.data);

            // Update comment count in stats
            const postCard = document.getElementById(`post-${postId}`);
            const commentStat = postCard.querySelector('.post-stats span:last-child');
            const currentCount = parseInt(commentStat.textContent) || 0;
            commentStat.textContent = `${currentCount + 1} comment${currentCount + 1 !== 1 ? 's' : ''}`;

            input.value = '';
            showToast('Comment added!', 'success');
        }
    } catch (error) {
        showToast('Error adding comment', 'error');
    }

    resetButton(submitBtn);
}

/**
 * Delete a post.
 */
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const response = await apiRequest(`/api/posts/${postId}`, {
            method: 'DELETE',
        });

        if (response.success) {
            const postCard = document.getElementById(`post-${postId}`);
            postCard.style.transition = 'all 0.3s ease';
            postCard.style.opacity = '0';
            postCard.style.transform = 'scale(0.95)';
            setTimeout(() => postCard.remove(), 300);
            showToast('Post deleted successfully!', 'success');
        }
    } catch (error) {
        showToast('Error deleting post', 'error');
    }
}

// ===========================================
// Create Post
// ===========================================
function openCreatePostModal() {
    document.getElementById('create-post-modal').classList.add('active');
    document.getElementById('post-content').focus();
}

function closeCreatePostModal() {
    document.getElementById('create-post-modal').classList.remove('active');
    document.getElementById('post-content').value = '';
    document.getElementById('post-image').value = '';
    document.getElementById('post-image-preview').innerHTML = '';
}

async function submitPost() {
    const content = document.getElementById('post-content').value.trim();
    const imageInput = document.getElementById('post-image');

    if (!content) {
        showToast('Please write something!', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submit-post-btn');
    setButtonLoading(submitBtn, 'Posting...');

    try {
        const formData = new FormData();
        formData.append('content', content);

        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        const response = await apiRequest('/api/posts', {
            method: 'POST',
            body: formData,
        });

        if (response.success) {
            closeCreatePostModal();
            showToast('Post created successfully!', 'success');

            // Reload feed to show the new post
            await loadFeedPosts(1);
        }
    } catch (error) {
        showToast(error.message || 'Error creating post', 'error');
    }

    resetButton(submitBtn);
}

// ===========================================
// AI Caption Enhancement
// ===========================================
async function enhanceCaption() {
    const textarea = document.getElementById('post-content');
    const caption = textarea.value.trim();

    if (!caption) {
        showToast('Write a caption first, then enhance it!', 'warning');
        return;
    }

    const enhanceBtn = document.getElementById('enhance-caption-btn');
    setButtonLoading(enhanceBtn, 'Enhancing...');

    try {
        const response = await apiRequest('/api/ai/enhance-caption', {
            method: 'POST',
            body: JSON.stringify({ caption }),
        });

        if (response.success && response.data.enhanced) {
            textarea.value = response.data.enhanced;
            showToast('Caption enhanced with AI! ✨', 'success');
        }
    } catch (error) {
        showToast('AI enhancement failed. Try again.', 'error');
    }

    resetButton(enhanceBtn);
}

// ===========================================
// People Suggestions
// ===========================================
async function loadPeopleSuggestions() {
    const container = document.getElementById('people-list');

    try {
        const response = await apiRequest('/api/users?limit=5');

        if (response.success && response.data.length > 0) {
            // Filter out current user
            const suggestions = response.data.filter(
                (u) => !window.currentUser || u._id !== window.currentUser._id
            ).slice(0, 5);

            container.innerHTML = suggestions.map((user) => `
                <div class="people-item">
                    ${avatarHTML(user.profilePicture, user.fullName, 'avatar-sm')}
                    <div class="people-info">
                        <h4><a href="/profile.html?id=${user._id}" style="text-decoration: none; color: inherit;">${escapeHtml(user.fullName)}</a></h4>
                        <p>${escapeHtml(user.headline || user.location || 'Professional')}</p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 10px;">No suggestions yet</p>';
        }
    } catch (error) {
        container.innerHTML = '';
    }
}
