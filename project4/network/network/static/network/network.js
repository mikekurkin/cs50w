window.addEventListener('popstate', e => showPage(e.state.p));

function goToPage(p, route = '') {
  showPage(p, (route = route));
  history.pushState({ p }, '', p === 1 ? window.location.pathname : `?p=${p}`);
}

function showPage(p, route = '') {
  fetch(`/api/posts/${route}p/${p}`)
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
  postCard = document.createElement('div');
  postCard.classList.add('card');
  postCard.classList.add('my-3');
  postCard.classList.add('post_card');
  postCard.innerHTML = `<h5 class="card-header">${post.author.username}</h5>
<div class="card-body">
  <p class="card-text">${post.contents}</p>
  <small class="text-muted font-italic">${post.timestamp}</small>
</div>`;
  return postCard;
}
