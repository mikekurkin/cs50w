document.addEventListener('DOMContentLoaded', () => {
  p = getPageNumber();
  apiRoute = `user/${user_id}/`;
  getUserInfo(user_id);
  showPage(p);
});

function getUserInfo(user_id) {
  fetch(`/api/user/${user_id}/`)
    .then(response => response.json())
    .then(result => {
      removeAlert();
      showUserInfo(result);
    })
    .catch(err => makeAlert(err.error));
}

function showUserInfo(user) {
  document.querySelector('#username').innerHTML = user.username;
  document.querySelector('#posts-count h3').innerHTML = user.posts_count;
  if (user.posts_count === 1) {
    document.querySelector('#posts-count small').innerHTML = 'post';
  }
  document.querySelector('#followers h3').innerHTML = user.followers_count;
  if (user.followers_count === 1) {
    document.querySelector('#followers small').innerHTML = 'follower';
  }
  document.querySelector('#following h3').innerHTML = user.following_count;
  document.querySelector('#last_seen').innerHTML = user.last_login;
  if (user.is_following !== null) {
    let followBtn = document.querySelector('#follow-btn');
    if (followBtn === null) {
      document.querySelector('#follow').appendChild(followButton(user));
    } else {
      followBtn.replaceWith(followButton(user));
    }
  }
}

function followButton(user) {
  let followBtn = document.createElement('button');
  followBtn.id = 'follow-btn';
  followBtn.title = user.is_following ? 'Unfollow' : 'Follow';
  followBtn.classList.add('btn');
  followBtn.classList.add('btn-link');
  followBtn.classList.add('btn-lg');
  followBtn.classList.add('py-1');
  followBtn.classList.add('px-0');
  followBtn.innerHTML = user.is_following ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
  if (user.is_following) followBtn.classList.add('active');
  followBtn.addEventListener('click', () => {
    let followFn = user.is_following ? unfollowUser : followUser;
    followFn(user.user_id)
      .then(result => {
        removeAlert();
        showUserInfo(result);
      })
      .catch(err => makeAlert(err.error));
  });
  return followBtn;
}
