GET     api/posts                           get list of posts. GET parameters: 
        api/posts?p=1                         p - page number, 
        api/posts?author_id=2                 author_id - author id, 
        api/posts?feed_only=true              feed_only - only posts from feed
POST    api/posts                           create post
GET     api/posts/<int:post_id>             get post by id
PUT     api/posts/<int:post_id>             edit post by post id, limited to author
POST    api/posts/<int:post_id>/like        like post by id
DELETE  api/posts/<int:post_id>/like        unlike post by id
GET     api/users/<int:user_id>             get user info by user id
POST    api/users/<int:user_id>/follow      follow user by user id
DELETE  api/users/<int:user_id>/follow      unfollow user by user id
