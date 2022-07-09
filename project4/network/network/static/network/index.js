document.addEventListener('DOMContentLoaded', () => {
  p = getPageNumber();
  apiRoute = ''
  showPage(p);

  newPostBtn = document.querySelector('#new-btn');
  
  if (newPostBtn !== null) {
    newPostBtn.addEventListener('click', e => {
      e.preventDefault();
      let newPostCard = document.querySelector('#new-post');
      let caret = document.querySelector("#new-btn i:last-child");
      console.log(newPostCard);
      if (newPostCard !== null) {
        newPostCard.remove();
        flipCaret(caret);
      } else {
        document.querySelector('#posts-wrapper').prepend(editFormDiv(postCardDiv(), newPost=true));
        document.querySelector('#new-post .post-contents').focus();
        flipCaret(caret);
      }
    })
  }
  function flipCaret(caret) {
    if ([...caret.classList].includes('bi-caret-down')) {
      caret.classList.remove('bi-caret-down');
      caret.classList.add('bi-caret-up');
    } else {
      caret.classList.remove('bi-caret-up');
      caret.classList.add('bi-caret-down');
    }
  }
});
