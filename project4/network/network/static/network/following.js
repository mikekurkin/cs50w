document.addEventListener('DOMContentLoaded', () => {
  // Read page number from URL
  p = getPageNumber();
  // Set filters for API request
  apiPostsFilter = { feed_only: true };
  showPage(p);
});
