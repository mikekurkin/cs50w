document.addEventListener('DOMContentLoaded', () => {
    loadPostsPage(state.page);
});

function loadPostsPage(n) {
    state.page = n;
    if (state.page == 1) {
        history.pushState(state, '', `/`)
    } else {
        history.pushState(state, '', `/${n}/`)
    }
    fetch(`/api/posts/p/${n}`)
    .then(response => response.json())
    .then(result => {
        if (result.error != undefined) {
            makeAlert(result.error)
        } else {
            // console.log(result.posts)
            removeAlert();
            makePostsWrapper(JSON.parse(result.posts));
        }
        makePaginator(result.pages, n);
    });
}

function makePostsWrapper(posts) {
    console.log(posts);
    const postsWrapperDiv = document.createElement('div');
    postsWrapperDiv.id = 'posts_wrapper';

    Array.from(posts).forEach(post => {
        console.log(post);
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
    pagNav.id = "paginator"
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
        prevLi.innerHTML = `<a class="page-link" href="/${current - 1}/">&laquo;</a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            loadPostsPage(current - 1)
        });
    }
    pagUl.appendChild(prevLi);

    for (var i = 1; i <= total; i++) {
        const page = i
        pageLi = document.createElement('li');
        pageLi.classList.add('page-item');
        if (current === page) {
            pageLi.classList.add('active');
        }
        pageLi.innerHTML = `<a class="page-link" href="/${page}/">${page}</a>`;
        pageLi.addEventListener('click', (e) => {
            e.preventDefault();
            loadPostsPage(page);
        });
        pagUl.appendChild(pageLi);
    }

    nextLi = document.createElement('li');
    nextLi.classList.add('page-item');
    if (current === total) {
        nextLi.classList.add('disabled');
        nextLi.innerHTML = `<a class="page-link" href="#">&raquo;</a>`;
    } else {
        nextLi.innerHTML = `<a class="page-link" href="/${current + 1}/">&raquo;</a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            loadPostsPage(current + 1)
        });
    }
    pagUl.appendChild(nextLi);

    const paginator = document.querySelector('#paginator');
    if (paginator != null) {
        paginator.replaceWith(pagNav);
    }
    document.querySelector("#pages").appendChild(pagNav);
    
}

function postCardDiv(post) {
    postCard = document.createElement('div');
    postCard.classList.add("card");
    postCard.classList.add("my-3");
    postCard.classList.add("post_card");
    postCard.innerHTML = 
`<h5 class="card-header">${post.fields.author}</h5>
<div class="card-body">
  <p class="card-text">${post.fields.contents}</p>
  <small class="text-muted font-italic">${post.fields.timestamp}</p>
</div>`;
    return postCard;
}