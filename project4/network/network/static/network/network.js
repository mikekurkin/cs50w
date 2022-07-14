window.addEventListener('popstate', e => showPage(e.state.p));

const csrftoken = getCookie('csrftoken');

var apiRoute = '';

function getPageNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  let p = 1;
  if (urlParams.has('p')) {
    p = parseInt(urlParams.get('p'));
  }
  return p;
}

function goToPage(p) {
  showPage(p);
  history.pushState({ p }, '', p === 1 ? window.location.pathname : `?p=${p}`);
}

function showPage(p) {
  fetch(`/api/posts/${apiRoute}p/${p}/`)
    .then(response => response.json())
    .then(result => {
      if (result.error != undefined) {
        makeAlert(result.error);
      } else {
        removeAlert();
        makePostsWrapper(result.posts);
      }
      makePaginator(result.pages, p);
    });
}

function makePostsWrapper(posts) {
  const postsWrapperDiv = document.createElement('div');
  postsWrapperDiv.id = 'posts-wrapper';

  Array.from(posts).forEach(post => {
    postsWrapperDiv.appendChild(postCardDiv(post));
  });

  const postsWrapper = document.querySelector('#posts-wrapper');
  if (postsWrapper != null) {
    postsWrapper.replaceWith(postsWrapperDiv);
  } else {
    document.querySelector('#posts').appendChild(postsWrapperDiv);
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

function makePaginator(total, current) {
  if (total <= 1) return;
  const pagNav = document.createElement('nav');
  pagNav.id = 'paginator';
  const pagUl = document.createElement('ul');
  pagNav.appendChild(pagUl);
  pagUl.classList.add('pagination');
  pagUl.classList.add('justify-content-center');

  prevLi = document.createElement('li');
  prevLi.classList.add('page-item');
  if (current === 1) {
    prevLi.classList.add('disabled');
    prevLi.innerHTML = `<a class="page-link" href="#">&laquo;</a>`;
  } else {
    prevLi.innerHTML = `<a class="page-link" href="?p=${current - 1}">&laquo;</a>`;
    prevLi.addEventListener('click', e => {
      e.preventDefault();
      goToPage(current - 1);
    });
  }
  pagUl.appendChild(prevLi);

  for (var i = 1; i <= total; i++) {
    const page = i;
    pageLi = document.createElement('li');
    pageLi.classList.add('page-item');
    if (current === page) {
      pageLi.classList.add('active');
    }
    pageLi.innerHTML = `<a class="page-link" href="?p=${page}">${page}</a>`;
    pageLi.addEventListener('click', e => {
      e.preventDefault();
      goToPage(page);
    });
    pagUl.appendChild(pageLi);
  }

  nextLi = document.createElement('li');
  nextLi.classList.add('page-item');
  if (current === total) {
    nextLi.classList.add('disabled');
    nextLi.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
  } else {
    nextLi.innerHTML = `<a class="page-link" href="?p=${current + 1}">&raquo;</a>`;
    nextLi.addEventListener('click', e => {
      e.preventDefault();
      goToPage(current + 1);
    });
  }
  pagUl.appendChild(nextLi);

  const paginator = document.querySelector('#paginator');
  if (paginator != null) {
    paginator.replaceWith(pagNav);
  }
  document.querySelector('#pages').appendChild(pagNav);
}

function postCardDiv(post = null) {
  const postTemplate = document.querySelector('#post-template');
  const postCard = postTemplate.content.firstElementChild.cloneNode(true);
  
  postCard.id = post !== null ? `post${post.post_id}` : 'new-post';

  if (post === null) {
    postCard.querySelector('.card-title')
      .innerHTML = "New Post";
    postCard.querySelector('.post-timestamp')
      .innerHTML = "now";
  } else {
    postCard.dataset['postid'] = post.post_id;
    postCard.querySelector('.author-link')
      .innerHTML = post.author.username;
    postCard.querySelector('.author-link')
      .setAttribute('href', `/user/${post.author.user_id}/`);
    postCard.querySelector('.post-contents')
      .innerHTML = post.contents;
    postCard.querySelector('.post-timestamp')
      .innerHTML = post.timestamp;

    const likeBtn = postCard.querySelector('.like-btn');
    likeBtn.dataset.postid = post.post_id;
    if (post.is_liked === null) {
        likeBtn.setAttribute('disabled', 'true');
    } else {
      likeBtn.title = (post.is_liked === true) ? 'Unlike' : 'Like';
      const likeFn = (post.is_liked === true) ? unlikePost : likePost;
      likeBtn.classList.toggle('active', post.is_liked === true);
      likeBtn.onclick = function () {
        likeFn(this.dataset.postid)
        .then(resPost => {
          removeAlert();
          postCard.replaceWith(postCardDiv(resPost));
        })
        .catch(err => makeAlert(err.error));
      }
    }

    postCard.querySelector('.likes-count')
      .innerHTML = post.likes_count;
    postCard.querySelector('.likes-count')
      .toggleAttribute('hidden', post.likes_count === 0);
    
    postCard.querySelector('.edit-wrapper')
      .toggleAttribute('hidden', !post.can_edit);
    
    if (post.can_edit) {
      postCard.querySelector('.edit-btn')
        .onclick = () => {
        makeEditForm(postCard);
      }
    }
  }

  return postCard;
}

function makeEditForm(postDiv) {
  const newPost = (postDiv.id === 'new-post');
  
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
        cancelEditing()
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
    fetch(`/api/posts/new/`, {
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
    fetch(`/api/posts/${post_id}/edit/`, {
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


function likePost(post_id) {
  return new Promise((resolve, reject) => {
    fetch(`/api/posts/${post_id}/like/`, {
      method: 'POST',
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

function unlikePost(post_id) {
  return new Promise((resolve, reject) => {
    fetch(`/api/posts/${post_id}/unlike/`, {
      method: 'POST',
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

function followUser(user_id) {
  return new Promise((resolve, reject) => {
    fetch(`/api/user/${user_id}/follow/`, {
      method: 'POST',
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

function unfollowUser(user_id) {
  return new Promise((resolve, reject) => {
    fetch(`/api/user/${user_id}/unfollow/`, {
      method: 'POST',
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
