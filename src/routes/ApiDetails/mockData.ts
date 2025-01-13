export const operations = [
    {
        name: "createUser",
        method: "POST",
        urlTemplate: "/users",
        displayName: "Create new user",
        tag: "users",
    },
    {
        name: "updateUser",
        method: "PUT",
        urlTemplate: "/users/{userId}",
        displayName: "Update existing user",
        tag: "users",
    },
    {
        name: "readUser",
        method: "GET",
        urlTemplate: "/users/{userId}",
        displayName: "Read user details",
        tag: "users",
    },
    {
        name: "deleteUser",
        method: "DELETE",
        urlTemplate: "/users/{userId}",
        displayName: "Delete user",
        tag: "users",
    },
    {
        name: "createPost",
        method: "POST",
        urlTemplate: "/posts",
        displayName: "Create new post",
        tag: "posts",
    },
    {
        name: "updatePost",
        method: "PUT",
        urlTemplate: "/posts/{postId}",
        displayName: "Update existing post",
        tag: "posts",
    },
    {
        name: "readPost",
        method: "GET",
        urlTemplate: "/posts/{postId}",
        displayName: "Read post details",
        tag: "posts",
    },
    {
        name: "deletePost",
        method: "DELETE",
        urlTemplate: "/posts/{postId}",
        displayName: "Delete post",
        tag: "posts",
    },
];

export const parameters = [
    {
        name: "title",
        in: "body",
        required: true,
        type: "string",
        description: "The title of the post.",
    },
    {
        name: "content",
        in: "body",
        required: true,
        type: "string",
        description: "Markdown post content.",
    },
    {
        name: "categoryId",
        in: "body",
        type: "string",
        description: "The ID of the category the post belongs to.",
    },
    {
        name: "tagIds",
        in: "body",
        type: "Array<string>",
        description: "List of post tag IDs.",
    },
    {
        name: "authorId",
        in: "body",
        required: true,
        type: "string",
        description: "The ID of the author of the post.",
    },
];
