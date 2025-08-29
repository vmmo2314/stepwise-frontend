import axiosInstance from '../AxiosInstance';

export function getPosts() {
    return axiosInstance.get(`/api/posts`); // Asumiendo esta ruta en el backend
}

export function createPost(postData) {
    return axiosInstance.post(`/api/posts`, postData);
}

export function updatePost(post, postId) {
    return axiosInstance.put(`/api/posts/${postId}`, post);
}

export function deletePost(postId) {
    return axiosInstance.delete(`/api/posts/${postId}`);
}

// La función formatPosts puede permanecer en el frontend si solo es para presentación
export function formatPosts(postsData) {
    let posts = [];
    for (let key in postsData) {
        posts.push({ ...postsData[key], id: key });
    }
    return posts;
}