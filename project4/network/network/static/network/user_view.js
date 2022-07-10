document.addEventListener('DOMContentLoaded', () => {
  p = getPageNumber();
  apiRoute = `user/${user_id}/`;
  showUserInfo(user_id);
  showPage(p);
});

function showUserInfo(user_id) {
  fetch(`/api/user/${user_id}/`)
    .then(response => response.json())
    .then(result => {
      console.log(result);
      document.querySelector('#username').innerHTML = result.username;
      document.querySelector('#posts-count h3').innerHTML = result.posts_count;
      if (result.posts_count === 1) {
        document.querySelector('#posts-count small').innerHTML = "post";
      }
      document.querySelector('#followers h3').innerHTML = result.followers_count;
      if (result.followers_count === 1) {
        document.querySelector('#followers small').innerHTML = "follower";
      }
      document.querySelector('#following h3').innerHTML = result.following_count;
      document.querySelector('#last_seen').innerHTML = result.last_login;
    });
}
