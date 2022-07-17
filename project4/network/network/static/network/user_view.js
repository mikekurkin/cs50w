document.addEventListener('DOMContentLoaded', () => {
  // Read page number from URL
  p = getPageNumber();
  // Read user id from HTML dataset
  const user_id = parseInt(document.querySelector('#username').dataset.userid);
  // Set filters for API request
  apiPostsFilter = { author_id: user_id };
  // Reload user info
  getUserInfo(user_id);
  showPage(p);
});

/**
 * Make async API call to get user info
 * @param {Number} user_id
 */
function getUserInfo(user_id) {
  fetch(`/api/users/${user_id}`)
    .then(response => response.json())
    .then(result => {
      removeAlert();
      showUserInfo(result);
    })
    .catch(err => makeAlert(err.error));
}

/**
 * Update contents of page based on user info from API call
 * @param {Object} user - user info in JSON format
 */
function showUserInfo(user) {
  // Fill in the info
  document.querySelector('#username').innerHTML = user.username;
  document.querySelector('#posts-count .card-title').innerHTML = user.posts_count;
  document.querySelector('#posts-count .card-text').innerHTML = `post${user.posts_count !== 1 ? 's' : ''}`;
  document.querySelector('#followers-count .card-title').innerHTML = user.followers_count;
  document.querySelector('#followers-count .card-text').innerHTML = `follower${user.followers_count !== 1 ? 's' : ''}`;
  document.querySelector('#following-count .card-title').innerHTML = user.following_count;
  document.querySelector('#last-seen').innerHTML = user.last_login.humanized;
  document.querySelector('#last-seen').setAttribute('title', user.last_login.exact);

  // Set up follow button
  let followBtn = document.querySelector('.follow-btn');
  if (followBtn !== null) {
    if (user.is_following === null) {
      // If user is not authenticated, or the same as requester hide follow button
      followBtn.toggleAttribute('hidden', true);
    } else {
      // Change the follow button depending on whether the user is followed by requester
      followBtn.title = user.is_following ? 'Unfollow' : 'Follow';
      followBtn.classList.toggle('active', user.is_following);
      followBtn.onclick = () => {
        // Send API call to follow user
        userFollow(user.user_id, !user.is_following)
          .then(result => {
            removeAlert();
            showUserInfo(result);
          })
          .catch(err => makeAlert(err.error));
      };
    }
  }
}
