GET api/posts/p/<int:n>/                      get page n of all posts
GET api/posts/following/p/<int:n>/            get page n of posts by followed users
GET api/posts/user/<int:user_id>/p/<int:n>/   get page n of posts by user id
GET api/user/<int:user_id>/                   get user info by user id
GET api/posts/<int:post_id>/                  get post by id
PUT api/posts/<int:post_id>/edit/             update post by post id, check by author
POST api/posts/new/                           create post
POST api/posts/<int:post_id>/like/            like post by id
POST api/posts/<int:post_id>/unlike/          unlike post by id
POST api/user/<int:user_id>/follow/           follow user by user id
POST api/user/<int:user_id>/unfollow/         unfollow user by user id
