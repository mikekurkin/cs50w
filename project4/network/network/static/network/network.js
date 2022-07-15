window.addEventListener('popstate', e => showPage(e.state.p));

const csrftoken = getCookie('csrftoken');

var apiPostsFilter = {};

function getPageNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  let p = 1;
  if (urlParams.has('p')) p = parseInt(urlParams.get('p'));
  return p;
}

function goToPage(p) {
  showPage(p);
  history.pushState({ p }, '', p === 1 ? window.location.pathname : `?p=${p}`);
}

function showPage(p) {
  let params = new URLSearchParams();
  for (let param in apiPostsFilter) {
    params.append(param, apiPostsFilter[param]);
  }
  params.append('p', p);
  let apiAddress = '/api/posts';
  if (params.toString() !== '') apiAddress += `?${params.toString()}`;

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

function updatePosts(posts) {
  const postsWrapper = document.querySelector('#posts-wrapper');
  if (posts.length > 0) {
    postsWrapper.replaceChildren(...posts.map(post => postCardDiv(post)));
    document.querySelector('.empty').innerHTML = '';
  } else {
    document.querySelector('.empty').innerHTML = 'No posts here';
  }
}

function makeAlert(message) {
  const alertEl = document.createElement('div');
  alertEl.id = 'body-alert';
  alertEl.classList.add('alert');
  alertEl.classList.add('alert-danger');
  alertEl.innerHTML = message;
  const formAlert = document.querySelector('#body-alert');
  if (formAlert != null) {
    formAlert.replaceWith(alertEl);
  } else {
    document.querySelector('.body').prepend(alertEl);
  }
}

function removeAlert() {
  const formAlert = document.querySelector('#body-alert');
  if (formAlert != null) {
    formAlert.remove();
  }
}

function showPaginator(total, current) {
  if (total <= 1) return;
  const paginatorTemplate = document.querySelector('#paginator-template');
  const paginatorNav = paginatorTemplate.content.firstElementChild.cloneNode(true);
  const prev = paginatorNav.querySelector('.prev-item');
  const num = paginatorNav.querySelector('.num-item');
  const next = paginatorNav.querySelector('.next-item');

  let nums = new Array(total);
  for (let i = 0; i < total; i++) {
    const item = num.cloneNode(true);
    item.dataset.pagenum = i + 1;
    item.querySelector('a').innerHTML = i + 1;
    nums[i] = item;
  }
  prev.dataset.pagenum = current - 1;
  next.dataset.pagenum = current + 1;

  paginatorNav.querySelector('.pagination').replaceChildren(prev, ...nums, next);

  paginatorNav.querySelectorAll('[data-pagenum]').forEach(item => {
    const p = parseInt(item.dataset.pagenum);
    item.classList.toggle('disabled', p <= 0 || p > total);
    item.classList.toggle('active', p === current);
    if (!item.classList.contains('disabled')) {
      item.querySelector('a').setAttribute('href', `?p=${p}`);
      item.onclick = function (e) {
        e.preventDefault();
        goToPage(parseInt(this.dataset.pagenum));
      };
    }
  });

  const paginator = document.querySelector('#paginator');
  if (paginator != null) {
    paginator.replaceWith(paginatorNav);
  } else {
    document.querySelector('#pages').appendChild(paginatorNav);
  }
}

function postCardDiv(post = null) {
  const postTemplate = document.querySelector('#post-template');
  const postCard = postTemplate.content.firstElementChild.cloneNode(true);

  postCard.id = post !== null ? `post${post.post_id}` : 'new-post';

  if (post === null) {
    postCard.querySelector('.card-title').innerHTML = 'New Post';
    postCard.querySelector('.post-timestamp').innerHTML = 'now';
  } else {
    postCard.dataset['postid'] = post.post_id;
    postCard.querySelector('.author-link').innerHTML = post.author.username;
    postCard.querySelector('.author-link').setAttribute('href', `/user/${post.author.user_id}`);
    postCard.querySelector('.post-contents').innerHTML = post.contents;
    postCard.querySelector('.post-timestamp').innerHTML = post.timestamp;

    const likeBtn = postCard.querySelector('.like-btn');
    likeBtn.dataset.postid = post.post_id;
    likeBtn.toggleAttribute('hidden', post === null);
    likeBtn.toggleAttribute('disabled', post.is_liked === null);

    if (post.is_liked !== null) {
      likeBtn.title = post.is_liked === true ? 'Unlike' : 'Like';
      likeBtn.classList.toggle('active', post.is_liked === true);
      likeBtn.onclick = function () {
        postLike(this.dataset.postid, !post.is_liked)
          .then(resPost => {
            removeAlert();
            postCard.replaceWith(postCardDiv(resPost));
          })
          .catch(err => makeAlert(err.error));
      };
    }

    postCard.querySelector('.likes-count').innerHTML = post.likes_count;
    postCard.querySelector('.likes-count').toggleAttribute('hidden', post.likes_count === 0);

    postCard.querySelector('.edit-wrapper').toggleAttribute('hidden', !post.can_edit);

    if (post.can_edit) {
      postCard.querySelector('.edit-btn').onclick = () => {
        makeEditForm(postCard);
      };
    }
  }

  return postCard;
}

function makeEditForm(postDiv) {
  const newPost = postDiv.id === 'new-post';

  const postContents = postDiv.querySelector('.post-contents');
  const contentsBefore = postContents.innerHTML;

  const cancelButton = postDiv.querySelector('.cancel-btn');
  const editButton = postDiv.querySelector('.edit-btn');
  const saveButton = postDiv.querySelector('.save-btn');

  cancelButton.onclick = cancelEditing;

  saveButton.innerHTML = newPost ? 'Post' : 'Save';
  saveButton.onclick = finishEditing;
  postContents.setAttribute('contentEditable', 'plaintext-only');

  if (newPost !== true) {
    editButton.setAttribute('hidden', '');
    cancelButton.removeAttribute('hidden');
  }
  saveButton.removeAttribute('hidden');

  postDiv.querySelector('.post-contents').focus();

  return postDiv;

  function cancelEditing() {
    postDiv.querySelector('.post-contents').innerHTML = contentsBefore;
    postContents.removeAttribute('contentEditable');
    cancelButton.setAttribute('hidden', '');
    editButton.removeAttribute('hidden');
    saveButton.setAttribute('hidden', '');
    saveButton.onclick = null;
  }

  function finishEditing() {
    let contents = postDiv.querySelector('.post-contents').innerHTML;
    if (newPost === true) {
      if (contents === '') {
        makeAlert('No contents provided!');
      } else {
        saveNewPost(contents)
          .then(() => {
            removeAlert();
            goToPage(1);
          })
          .catch(err => makeAlert(err.error));
      }
    } else {
      if (contents === contentsBefore) {
        cancelEditing();
      } else {
        const post_id = parseInt(postDiv.dataset['postid']);
        saveEditedPost(post_id, contents)
          .then(responsePost => {
            removeAlert();
            postDiv.replaceWith(postCardDiv(responsePost));
          })
          .catch(err => makeAlert(err.error));
      }
    }
  }
}

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
