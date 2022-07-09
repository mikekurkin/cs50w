window.addEventListener('popstate', e => showPage(e.state.p));

const csrftoken = getCookie('csrftoken');

var apiRoute = '';

function getPageNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  var p = 1;
  if (urlParams.has('p')) {
    p = parseInt(urlParams.get('p'));
  }
  return p
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
  postsWrapperDiv.id = 'posts_wrapper';

  Array.from(posts).forEach(post => {
    postsWrapperDiv.appendChild(postCardDiv(post));
  });

  const postsWrapper = document.querySelector('#posts_wrapper');
  if (postsWrapper != null) {
    postsWrapper.replaceWith(postsWrapperDiv);
  } else {
    document.querySelector('#posts').appendChild(postsWrapperDiv);
  }
}

function makeAlert(message) {
  const alertEl = document.createElement('div');
  alertEl.id = 'body_alert';
  alertEl.classList.add('alert');
  alertEl.classList.add('alert-danger');
  alertEl.innerHTML = message;
  const formAlert = document.querySelector('#body_alert');
  if (formAlert != null) {
    formAlert.replaceWith(alertEl);
  } else {
    document.querySelector('.body').prepend(alertEl);
  }
}

function removeAlert() {
  const formAlert = document.querySelector('#body_alert');
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

function postCardDiv(post) {
  let postCard = document.createElement('div');
  postCard.id = `post${post.post_id}`;
  postCard.classList.add('card');
  postCard.classList.add('my-3');
  postCard.classList.add('post_card');
  postCard.innerHTML = `<div class="card-header row content-adjust-center mx-0">
  <div class="col-auto">
  <a class="h5 text-secondary" href="/user/${post.author.user_id}/">${post.author.username}</a>
  </div>
</div>
<div class="card-body">
  <p class="post-contents card-text mt-n1 mx-n1 mb-2 p-1">${post.contents}</p>
  <small class="text-muted font-italic">${post.timestamp}</small>
</div>`;

  if (post.can_edit) {
    
    postCard.querySelector(".card-header").appendChild(editBtnDiv(postCard));
  }
  return postCard;
}

function editFormDiv(postDiv, newPost=true) {
  let editDiv = postDiv.cloneNode(true)
  const postContents = editDiv.querySelector(".post-contents");
  const editButton = editDiv.querySelector(".edit-btn");
  let saveButton = document.createElement('div');
  const contentsBefore = postContents.innerHTML;
  saveButton.innerHTML = '<a href="#" title="Save Post" class="small text-secondary bi bi-check2-square"></a>';
  saveButton.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    finishEditing();
  });
  postContents.setAttribute('contentEditable', 'plaintext-only');
  editButton.replaceWith(saveButton);

  return editDiv;

  function finishEditing() {
    const post_id = parseInt(editDiv.id.split('post').pop());
    const contents = editDiv.querySelector('.post-contents').innerHTML;
    if (newPost === true) {
      if (contents === "") {
        makeAlert("No contents provided.");
      } else {
        
      }
    } else {
      if (contents === contentsBefore) {
        postContents.removeAttribute('contentEditable');
        saveButton.replaceWith(editBtnDiv(editDiv));
      } else {
        saveEditedPost(post_id, contents)
        .then(responsePost => {
          removeAlert();
          editDiv.replaceWith(postCardDiv(responsePost));
        })
        .catch(rej => makeAlert(rej.error));
      }
    }
  }
}

function saveEditedPost(post_id, contents) {
  return new Promise((resolve, reject) => {
    fetch(`/api/posts/${post_id}/edit/`, {
      method: 'PUT',
      headers: {'X-CSRFToken': csrftoken},
      mode: 'same-origin', // Do not send CSRF token to another domain.
      body: JSON.stringify({
        contents: contents
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
      .catch(err => reject({error: err}));
  })
}

function editBtnDiv(postCard) {
  let editDiv = document.createElement('div');
    editDiv.classList.add('col-auto');
    editDiv.classList.add('edit-btn');
    editDiv.classList.add('px-0');
    editDiv.innerHTML = '<a href="#" title="Edit Post" class="small text-secondary bi bi-pencil"></a>';
    editDiv.querySelector('a').addEventListener('click', e => {
      e.preventDefault();
      editDiv = editFormDiv(postCard, newPost=false)
      postCard.replaceWith(editDiv);
      editDiv.querySelector('.post-contents').focus();
    })
    return editDiv
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}


