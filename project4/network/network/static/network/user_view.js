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
        document.querySelector("#heading").innerHTML = `Posts by ${result.username}`;
    });
}
