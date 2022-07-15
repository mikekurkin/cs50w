document.addEventListener('DOMContentLoaded', () => {
  p = getPageNumber();
  const user_id = parseInt(document.querySelector('#username').dataset.userid);
  apiPostsFilter = { author_id: user_id };
  getUserInfo(user_id);
  showPage(p);
});

function getUserInfo(user_id) {
  fetch(`/api/users/${user_id}`)
    .then(response => response.json())
    .then(result => {
      removeAlert();
      showUserInfo(result);
    })
    .catch(err => makeAlert(err.error));
}

function showUserInfo(user) {
  document.querySelector('#username').innerHTML = user.username;
  document.querySelector('#posts-count .card-title').innerHTML = user.posts_count;
  document.querySelector('#posts-count .card-text').innerHTML = `post${user.posts_count !== 1 ? 's' : ''}`;
  document.querySelector('#followers-count .card-title').innerHTML = user.followers_count;
  document.querySelector('#followers-count .card-text').innerHTML = `follower${user.followers_count !== 1 ? 's' : ''}`;
  document.querySelector('#following-count .card-title').innerHTML = user.following_count;
  document.querySelector('#last-seen').innerHTML = user.last_login;

  let followBtn = document.querySelector('.follow-btn');
  if (followBtn !== null) {
    if (user.is_following === null) {
      followBtn.toggleAttribute('hidden', true);
    } else {
      followBtn.title = user.is_following ? 'Unfollow' : 'Follow';
      followBtn.classList.toggle('active', user.is_following);
      followBtn.onclick = () => {
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
