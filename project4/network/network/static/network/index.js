document.addEventListener('DOMContentLoaded', () => {
  let p = getPageNumber();
  apiPostsFilter = {};
  showPage(p);

  newPostBtn = document.querySelector('#new-btn');

  if (newPostBtn !== null) {
    newPostBtn.addEventListener('click', e => {
      e.preventDefault();
      const newPostCard = document.querySelector('#new-post');
      newPostBtn.classList.toggle('active', newPostCard === null);

      if (newPostCard !== null) {
        newPostCard.remove();
      } else {
        document.querySelector('#posts-wrapper').prepend(makeEditForm(postCardDiv()));
        document.querySelector('#new-post .post-contents').focus();
      }
    });
  }
});
