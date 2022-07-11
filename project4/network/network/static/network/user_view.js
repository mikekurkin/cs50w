document.addEventListener('DOMContentLoaded', () => {
  p = getPageNumber();
  const user_id = parseInt(document.querySelector("#username").dataset.userid);
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

