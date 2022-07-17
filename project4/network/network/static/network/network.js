window.addEventListener('popstate', e => showPage(e.state.p));

const csrftoken = getCookie('csrftoken');

var apiPostsFilter = {};

/**
 * Parses and returns page number from URL, or 1 by default.
 * @returns {Number} page number
 */
function getPageNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  let p = 1;
  if (urlParams.has('p')) p = parseInt(urlParams.get('p'));
  return p;
}

/**
 * Calls {@link showPage} to load and update page contents.
 * Pushes history state with corresponding URL.
 * @param {Number} p - page number
 */
function goToPage(p) {
  showPage(p);
  history.pushState({ p }, '', p === 1 ? window.location.pathname : `?p=${p}`);
}

/**
 * Dynamically loads p-th page of posts.
 * Updates page contents using {@link updatePosts}.
 * Constructs paginator using {@link showPaginator}.
 * @param {Number} p - page number
 */
function showPage(p) {
  // Load and append filter parameters for current page
  let params = new URLSearchParams();
  for (let param in apiPostsFilter) {
    params.append(param, apiPostsFilter[param]);
  }
  params.append('p', p);

  // Construct API URL
  let apiAddress = '/api/posts';
  if (params.toString() !== '') apiAddress += `?${params.toString()}`;

  // Make API call
  fetch(apiAddress)
    .then(response => response.json())
    .then(result => {
      if (result.error != undefined) {
        makeAlert(result.error);
      } else {
        removeAlert();
        updatePosts(result.posts);
      }
      showPaginator(result.pages, result.page);
    });
}

/**
 * Replaces wrapper contents with post cards of given posts.
 * @param {[Object]} posts - array of posts received from API
 */
function updatePosts(posts) {
  const postsWrapper = document.querySelector('#posts-wrapper');
  if (posts.length > 0) {
    // Construct div for each post, then replace contents of wrapper
    postsWrapper.replaceChildren(...posts.map(post => postCardDiv(post)));
    document.querySelector('.empty').innerHTML = '';
  } else {
    // Display placeholder text
    document.querySelector('.empty').innerHTML = 'No posts here';
  }
}

/**
 * Shows alert containing a given message
 * @param {String} message
 */
function makeAlert(message) {
  // Construct alert element
  const alertEl = document.createElement('div');
  alertEl.id = 'body-alert';
  alertEl.classList.add('alert', 'alert-danger');
  alertEl.innerHTML = message;

  // Replace existing alert or show a new one
  const formAlert = document.querySelector('#body-alert');
  if (formAlert != null) {
    formAlert.replaceWith(alertEl);
  } else {
    document.querySelector('.body').prepend(alertEl);
  }
}

/**
 * Removes existing alert.
 */
function removeAlert() {
  const formAlert = document.querySelector('#body-alert');
  if (formAlert != null) formAlert.remove();
}

/**
 * Constructs and shows on page a paginator with given parameters
 * @param {Number} total - total number of pages
 * @param {Number} current - current page number
 */
function showPaginator(total, current) {
  // Don't do anything if there is only one page
  if (total <= 1) return;

  // Load template
  const paginatorTemplate = document.querySelector('#paginator-template');
  const paginatorNav = paginatorTemplate.content.firstElementChild.cloneNode(true);

  const prev = paginatorNav.querySelector('.prev-item');
  const num = paginatorNav.querySelector('.num-item');
  const next = paginatorNav.querySelector('.next-item');

  // Create array of nav-items with numbers
  let nums = new Array(total);
  for (let i = 0; i < total; i++) {
    const item = num.cloneNode(true);
    item.dataset.pagenum = i + 1;
    item.querySelector('a').innerHTML = i + 1;
    nums[i] = item;
  }

  // Assign page numbers to previous and next buttons
  prev.dataset.pagenum = current - 1;
  next.dataset.pagenum = current + 1;

  // Replace template nav-items with newly constructed
  paginatorNav.querySelector('.pagination').replaceChildren(prev, ...nums, next);

  
  paginatorNav.querySelectorAll('[data-pagenum]').forEach(item => {
    const p = parseInt(item.dataset.pagenum);
    // Add disabled class if previous or next page do not exist
    item.classList.toggle('disabled', p <= 0 || p > total);
    // Add active class for current page
    item.classList.toggle('active', p === current);

    // Give each non-disabled item link destination and click handler for loading contents without page reload
    if (!item.classList.contains('disabled')) {
      item.querySelector('a').setAttribute('href', `?p=${p}`);
      item.onclick = function (e) {
        // Handle click with modifier keys
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        goToPage(parseInt(this.dataset.pagenum));
      };
    }
  });

  // Append new or replace existing paginator
  const paginator = document.querySelector('#paginator');
  if (paginator != null) {
    paginator.replaceWith(paginatorNav);
  } else {
    document.querySelector('#pages').appendChild(paginatorNav);
  }
}

/**
 * Constructs a post card from post received from API.
 * If no post provided, returns an empty card for new post.
 * @param {Object | Null} post - post in JSON format
 * @returns post card element ready to be appended to DOM
 */
function postCardDiv(post = null) {
  // Load card template
  const postTemplate = document.querySelector('#post-template');
  const postCard = postTemplate.content.firstElementChild.cloneNode(true);

  postCard.id = post !== null ? `post${post.post_id}` : 'new-post';
  
  if (post === null) {
    // If post is not provided, prepare card for new post
    postCard.querySelector('.card-title').innerHTML = 'New Post';
    postCard.querySelector('.post-timestamp').innerHTML = 'now';
  } else {
    // Fill in post attributes
    postCard.dataset['postid'] = post.post_id;
    postCard.querySelector('.author-link').innerHTML = post.author.username;
    postCard.querySelector('.author-link').setAttribute('href', `/u/${post.author.username}`);
    postCard.querySelector('.post-contents').innerHTML = post.contents;
    postCard.querySelector('.post-timestamp').innerHTML = post.timestamp.humanized;
    postCard.querySelector('.post-timestamp').setAttribute('title', post.timestamp.exact);

    const likeBtn = postCard.querySelector('.like-btn');
    likeBtn.dataset.postid = post.post_id;
    // Show like button for existing posts
    likeBtn.toggleAttribute('hidden', post === null);
    // Deactivate like button if user is not authorized
    likeBtn.toggleAttribute('disabled', post.is_liked === null);

    // If user is authorized
    if (post.is_liked !== null) {
      // Change the like button depending on whether the post is liked or not
      likeBtn.title = post.is_liked === true ? 'Unlike' : 'Like';
      likeBtn.classList.toggle('active', post.is_liked === true);
      likeBtn.onclick = function () {
        // Send API request to like or unlike post
        postLike(this.dataset.postid, !post.is_liked)
          .then(resPost => {
            removeAlert();
            // Update post when result is received
            postCard.replaceWith(postCardDiv(resPost));
          })
          .catch(err => makeAlert(err.error));
      };
    }

    postCard.querySelector('.likes-count').innerHTML = post.likes_count;
    // Do not show likes count if zero
    postCard.querySelector('.likes-count').toggleAttribute('hidden', post.likes_count === 0);

    // Hide edit button if can't edit post
    postCard.querySelector('.edit-wrapper').toggleAttribute('hidden', !post.can_edit);
    // If can edit, add click listener
    if (post.can_edit) {
      postCard.querySelector('.edit-btn').onclick = () => {
        makeEditForm(postCard);
      };
    }
  }

  // Return constructed element
  return postCard;
}

/**
 * Constructs an edit or new post form card from post card element.
 * @param {*} postDiv - post element returned by {@link postCardDiv}
 * @returns edit form element
 */
function makeEditForm(postDiv) {
  // Set newPost to true based on element id
  const newPost = postDiv.id === 'new-post';

  // Find necessary elements
  const postContents = postDiv.querySelector('.post-contents');
  const contentsBefore = postContents.innerHTML;
  const cancelButton = postDiv.querySelector('.cancel-btn');
  const editButton = postDiv.querySelector('.edit-btn');
  const saveButton = postDiv.querySelector('.save-btn');

  // Add cancel button click handler
  cancelButton.onclick = cancelEditing;
  // Add save button click handler and title
  saveButton.innerHTML = newPost ? 'Post' : 'Save';
  saveButton.onclick = finishEditing;
  
  // Make post contents editable and focus
  postContents.setAttribute('contentEditable', 'plaintext-only');
  postContents.focus();

  // If editing existing post, hide edit and show cancel button
  if (newPost !== true) {
    editButton.setAttribute('hidden', '');
    cancelButton.removeAttribute('hidden');
  }
  // Show save button
  saveButton.removeAttribute('hidden');

  // Return constructed element
  return postDiv;

  /** Cancel button click handler  */
  function cancelEditing() {
    // Replace content with content before editing
    postDiv.querySelector('.post-contents').innerHTML = contentsBefore;
    // Make content not editable
    postContents.removeAttribute('contentEditable');
    // Hide cancel and show edit buttons
    cancelButton.setAttribute('hidden', '');
    editButton.removeAttribute('hidden');
    // Hide save button and remove click handler
    saveButton.setAttribute('hidden', '');
    saveButton.onclick = null;
  }

  /** Save button click handler  */
  function finishEditing() {
    // Get edited post contents
    const contents = postDiv.querySelector('.post-contents').innerHTML;
    if (newPost === true) {
      // If contents empty, show error
      if (contents === '') {
        makeAlert('No contents provided!');
      } else {
        // Send API call to save post
        saveNewPost(contents)
          .then(() => {
            removeAlert();
            goToPage(1);
          })
          .catch(err => makeAlert(err.error));
      }
    } else {
      // Do not send api response if contents did not change
      if (contents === contentsBefore) {
        cancelEditing();
      } else {
        // Read post id from dataset
        const post_id = parseInt(postDiv.dataset['postid']);
        // Send API call to save post
        saveEditedPost(post_id, contents)
          .then(responsePost => {
            removeAlert();
            // Update post card with post from response
            postDiv.replaceWith(postCardDiv(responsePost));
          })
          .catch(err => makeAlert(err.error));
      }
    }
  }
}

/**
 * Make async API call to save new post
 * @param {String} contents - contents of new post
 */
function saveNewPost(contents) {
  return new Promise((resolve, reject) => {
    fetch(`/api/posts`, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrftoken },
      mode: 'same-origin', // Do not send CSRF token to another domain.
      body: JSON.stringify({
        contents: contents,
      }),
    })
      .then(response => response.json())
      .then(result => {
        console.log(result);
        if (result.error != undefined) {
          reject(result);
        } else {
          resolve(result);
        }
      })
      .catch(err => reject({ error: err }));
  });
}

/**
 * Make async API call to save an edited post
 * @param {Number} post_id - id of the post being edited
 * @param {String} contents - new contents of the post
 */
function saveEditedPost(post_id, contents) {
  return new Promise((resolve, reject) => {
    fetch(`/api/posts/${post_id}`, {
      method: 'PUT',
      headers: { 'X-CSRFToken': csrftoken },
      mode: 'same-origin', // Do not send CSRF token to another domain.
      body: JSON.stringify({
        contents: contents,
      }),
    })
      .then(response => response.json())
      .then(result => {
        console.log(result);
        if (result.error != undefined) {
          reject(result);
        } else {
          resolve(result);
        }
      })
      .catch(err => reject({ error: err }));
  });
}

/**
 * Make async API call to like or unlike the post
 * @param {Number} post_id - id of post being (un)liked
 * @param {Boolean=true} set_liked - like if true, unlike if false
 */
function postLike(post_id, set_liked = true) {
  return new Promise((resolve, reject) => {
    fetch(`/api/posts/${post_id}/like`, {
      method: set_liked ? 'POST' : 'DELETE',
      headers: { 'X-CSRFToken': csrftoken },
      mode: 'same-origin',
    })
      .then(response => response.json())
      .then(result => {
        console.log(result);
        if (result.error != undefined) {
          reject(result);
        } else {
          resolve(result);
        }
      })
      .catch(err => reject({ error: err }));
  });
}

/**
 * Make async call to follow or unfollow the user
 * @param {Number} user_id - id of user being (un)followed
 * @param {Boolean=true} set_following - follow if true, unfollow if false
 */
function userFollow(user_id, set_following = true) {
  return new Promise((resolve, reject) => {
    fetch(`/api/users/${user_id}/follow`, {
      method: set_following ? 'POST' : 'DELETE',
      headers: { 'X-CSRFToken': csrftoken },
      mode: 'same-origin',
    })
      .then(response => response.json())
      .then(result => {
        console.log(result);
        if (result.error != undefined) {
          reject(result);
        } else {
          resolve(result);
        }
      })
      .catch(err => reject({ error: err }));
  });
}

/**
 * Function that helps get CSRF token from cookies
 * 
 * Source: {@link https://docs.djangoproject.com/en/4.0/ref/csrf/#ajax}
 */
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
