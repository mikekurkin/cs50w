window.addEventListener('popstate', e => showPage(e.state.p));

const csrftoken = getCookie('csrftoken');

var apiRoute = '';

function getPageNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  var p = 1;
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
  let postCard = document.createElement('div');
  postCard.id = post !== null ? `post${post.post_id}` : 'new-post';
  postCard.classList.add('card');
  postCard.classList.add('my-3');
  postCard.classList.add('post-card');
  postCard.innerHTML = `
  <div class="card-header row content-adjust-center mx-0">
    <div class="col-auto pl-0">
      <h5 class="text-dark my-0">New Post</h5>
    </div>
    <div class="col-auto order-last ml-auto pr-0">
      <small class="text-muted font-italic"></small>
    </div>
  </div>
  <div class="card-body">
    <p class="post-contents card-text mt-n1 mx-n1 mb-2 p-1"></p>
    <div class="row justify-content-between align-items-baseline mt-3">
    </div>
  </div>`;

  if (post !== null) {
    postCard.dataset['postid'] = post.post_id;
    postCard.querySelector(
      '.card-header > div > h5'
    ).innerHTML = `<a class="text-secondary text-decoration-none" href="/user/${post.author.user_id}/">${post.author.username}</a>`;
    postCard.querySelector('.card-body > p').innerHTML = post.contents;
    postCard.querySelector('.card-header small').innerHTML = post.timestamp;
    postCard.querySelector('.card-body > .row').innerHTML = `
      <div class="col-auto">
      <button title="Like" id="like-btn" class="btn btn-sm btn-light py-1 px-2">
      <i class="fa-regular fa-heart"></i>
      </button>
      </div>
    `;
    const likeBtn = postCard.querySelector('#like-btn');
    likeBtn.dataset.postid = post.post_id;
    if (post.is_liked === true) {
      likeBtn.classList.add('active');
      likeBtn.querySelector('i').classList.remove('fa-regular');
      likeBtn.querySelector('i').classList.add('fa-solid');
      likeBtn.title = 'Unlike';
      likeBtn.addEventListener('click', function() {
        unlikePost(this.dataset.postid)
          .then(resPost => {
            removeAlert();
            postCard.replaceWith(postCardDiv(resPost));
          })
          .catch(rej => makeAlert(rej.error));
      });
    } else if (post.is_liked === false) {
      likeBtn.addEventListener('click', function() {
        likePost(this.dataset.postid)
          .then(resPost => {
            removeAlert();
            postCard.replaceWith(postCardDiv(resPost));
          })
          .catch(rej => makeAlert(rej.error));
      });
    } else if (post.is_liked === null) {
      likeBtn.setAttribute('disabled', 'true');
    }
    if (post.likes_count > 0) {
      let likesCount = document.createElement('span');
      likesCount.classList.add('ml-1');
      likesCount.innerHTML = post.likes_count;
      likeBtn.append(likesCount);
    }
    if (post.can_edit) {
      postCard.querySelector('.card-header').appendChild(editBtnDiv(postCard));
    }
  }

  return postCard;
}

function makeEditForm(postDiv) {
  const newPost = (postDiv.id == "new-post");
  
  const postContents = postDiv.querySelector('.post-contents');
  let cancelButton = document.createElement('div');
  const contentsBefore = postContents.innerHTML;
  cancelButton.innerHTML = '<button title="Cancel Editing" class="btn btn-link btn-sm text-secondary p-0 m-0"><i class="fa-regular fa-circle-xmark"></i></button>';
  cancelButton.querySelector('button').addEventListener('click', cancelEditing)
  let saveButton = document.createElement('div');
  saveButton.classList.add('col-auto');
  saveButton.classList.add('ml-auto');
  saveButton.innerHTML = `<button id="like-btn" class="btn btn-sm btn-primary py-1 px-2">${newPost ? 'Post' : 'Save'}</button>`;
  saveButton.querySelector('button').addEventListener('click', finishEditing);
  postContents.setAttribute('contentEditable', 'plaintext-only');

  if (newPost !== true) {
    const editButton = postDiv.querySelector('.edit-btn');
    editButton.replaceWith(cancelButton);
  }

  postDiv.querySelector('.card-body > .row').appendChild(saveButton);

  return postDiv;

  function cancelEditing() {
    postDiv.querySelector('.post-contents').innerHTML = contentsBefore;
    postContents.removeAttribute('contentEditable');
    cancelButton.replaceWith(editBtnDiv(postDiv));
    saveButton.remove();
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
          .catch(rej => makeAlert(rej.error));
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
          .catch(rej => makeAlert(rej.error));
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

function editBtnDiv(postCard) {
  let editDiv = document.createElement('div');
  editDiv.classList.add('col-auto');
  editDiv.classList.add('edit-btn');
  editDiv.classList.add('px-0');
  editDiv.innerHTML = '<button title="Edit Post" class="btn btn-link btn-sm text-secondary p-0 m-0"><i class="fa-solid fa-pencil"></i></button>';
  editDiv.querySelector('button').addEventListener('click', e => {
    e.preventDefault();
    makeEditForm(postCard);
    postCard.querySelector('.post-contents').focus();
  });
  return editDiv;
}


function followButton(user) {
  let followBtn = document.createElement('button');
  followBtn.id = 'follow-btn';
  followBtn.title = user.is_following ? 'Unfollow' : 'Follow';
  followBtn.classList.add('btn');
  followBtn.classList.add('btn-link');
  followBtn.classList.add('btn-lg');
  followBtn.classList.add('py-1');
  followBtn.classList.add('px-0');
  followBtn.innerHTML = `<i class="${user.is_following ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
  if (user.is_following) followBtn.classList.add('active');
  followBtn.addEventListener('click', () => {
    let followFn = user.is_following ? unfollowUser : followUser;
    followFn(user.user_id)
      .then(result => {
        removeAlert();
        showUserInfo(result);
      })
      .catch(err => makeAlert(err.error));
  });
  return followBtn;
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
