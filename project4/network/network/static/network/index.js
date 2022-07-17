document.addEventListener('DOMContentLoaded', () => {
  // Read page number from URL
  let p = getPageNumber();
  // Set filters for API request
  apiPostsFilter = {};
  showPage(p);

  newPostBtn = document.querySelector('#new-btn');

  if (newPostBtn !== null) {
    // Add event listener for new post button
    newPostBtn.addEventListener('click', e => {
      e.preventDefault();
      const newPostCard = document.querySelector('#new-post');
      // Toggle active class based on whether there is a new post card
      newPostBtn.classList.toggle('active', newPostCard === null);

      // Remove existing new post card, or append a new one
      if (newPostCard !== null) {
        newPostCard.remove();
      } else {
        document.querySelector('#posts-wrapper').prepend(makeEditForm(postCardDiv()));
        document.querySelector('#new-post .post-contents').focus();
      }
    });
  }
});
