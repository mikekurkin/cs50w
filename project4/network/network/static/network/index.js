document.addEventListener('DOMContentLoaded', () => {
  p = getPageNumber();
  apiRoute = '';
  showPage(p);

  newPostBtn = document.querySelector('#new-btn');

  if (newPostBtn !== null) {
    newPostBtn.addEventListener('click', e => {
      e.preventDefault();
      let newPostCard = document.querySelector('#new-post');
      let caret = document.querySelector('#new-btn i:last-child');
      console.log(newPostCard);
      if (newPostCard !== null) {
        newPostCard.remove();
        flipCaret(caret);
        newPostBtn.classList.remove('active');
      } else {
        document.querySelector('#posts-wrapper').prepend(editFormDiv(postCardDiv(), (newPost = true)));
        document.querySelector('#new-post .post-contents').focus();
        flipCaret(caret);
        newPostBtn.classList.add('active');
      }
    });
  }
  function flipCaret(caret) {
    if ([...caret.classList].includes('bi-caret-down')) {
      caret.classList.remove('bi-caret-down');
      caret.classList.add('bi-caret-up-fill');
    } else {
      caret.classList.remove('bi-caret-up-fill');
      caret.classList.add('bi-caret-down');
    }
  }
});
