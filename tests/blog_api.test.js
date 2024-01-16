const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const Blog = require('../models/blogs');
const User = require('../models/users');

const api = supertest(app);

let rootToken;
let johnToken;

const initialBlogs = [{
  author: 'John Doe',
  title: 'Google',
  url: 'https://www.google.com',
},
{
  author: 'Jane Doe',
  title: 'YouTube',
  url: 'https://www.youtube.com',
}];

beforeAll(async () => {
  await User.deleteMany({});

  await api
    .post('/api/users')
    .send({
      name: 'Superuser',
      username: 'root',
      password: '123',
    });

  await api
    .post('/api/users')
    .send({
      name: 'John Doe',
      username: 'johndoe',
      password: '123',
    });

  const rootLoginResponse = await api
    .post('/api/login')
    .send({ username: 'root', password: '123' })
    .expect(200);

  rootToken = rootLoginResponse.body.token;

  const johnLoginResponse = await api
    .post('/api/login')
    .send({ username: 'johndoe', password: '123' })
    .expect(200);

  johnToken = johnLoginResponse.body.token;
});

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogsObject = initialBlogs.map((blog) => new Blog(blog));
  const promiseArray = blogsObject.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

describe('when there is initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body).toHaveLength(initialBlogs.length);
  });

  test('verify unique identifier is named id', async () => {
    const response = await api.get('/api/blogs');
    const blogs = response.body;

    // check all blogs contain an id field
    blogs.forEach((b) => expect(b.id).toBeDefined());
  });
});

describe('addition of a new blog', () => {
  test('succeeds with a valid id', async () => {
    // create a new blog
    const newBlog = {
      author: 'Test Add',
      title: 'Test Blog',
      url: 'https://www.example.com',
    };

    const result = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${rootToken}`)
      .send(newBlog)
      .expect(201);

    expect(result).toBeDefined();

    // check the length of the blogs has increased
    const blogs = await api.get('/api/blogs');
    expect(blogs.body).toHaveLength(initialBlogs.length + 1);

    // check the information of the new blog is correct
    expect(blogs.body[initialBlogs.length].title).toBe('Test Blog');
    expect(blogs.body[initialBlogs.length].author).toBe('Test Add');
    expect(blogs.body[initialBlogs.length].url).toBe('https://www.example.com');
  });

  test('verify likes property if missing from request', async () => {
    const newBlog = new Blog({
      author: 'Test Likes',
      title: 'Test Likes',
      url: 'https://www.example.com',
    });

    // send the blog to db
    const result = await newBlog.save();
    // check the blog was saved
    expect(result).toBeDefined();
    // check if likes field was set to zero
    expect(result.likes).toBe(0);
  });

  test('fails with 401 if token is not provided', async () => {
    // create a new blog
    const newBlog = {
      author: 'Test Add',
      title: 'Test Blog',
      url: 'https://www.example.com',
    };

    const result = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401);

    expect(result).toBeDefined();

    // check the length of the blogs has not increased
    const blogs = await api.get('/api/blogs');
    expect(blogs.body).toHaveLength(initialBlogs.length);
  });
});

describe('verify bad request', () => {
  const newBlogWithoutTitle = {
    author: 'Test Without Title',
    url: 'https://www.example.com',
  };

  const newBlogWithoutUrl = {
    author: 'Test Without URL',
    title: 'Test',
  };

  test('on missing title', async () => {
    await api
      .post('/api/blogs')
      .send(newBlogWithoutTitle)
      .expect('Content-Type', /application\/json/)
      .expect(400);
  });

  test('on missing url', async () => {
    await api
      .post('/api/blogs')
      .send(newBlogWithoutUrl)
      .expect('Content-Type', /application\/json/)
      .expect(400);
  });
});

describe('deletion of a blog', () => {
  test('succeeds with status code 204 (No Content) if valid id', async () => {
    const blogsAtStart = await Blog.find({});
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204);

    const blogsAtEnd = await Blog.find({});

    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1);
    expect(blogsAtEnd).not.toContainEqual(blogToDelete);
  });
});

describe('update blog information', () => {
  test('succeeds with status code 200 (OK) if valid id', async () => {
    const blogsAtStart = await Blog.find({});

    const originalBlog = blogsAtStart.slice(-1)[0];

    const updatedBlog = {
      id: originalBlog.id,
      author: originalBlog.author,
      title: originalBlog.title,
      likes: originalBlog.likes + 100,
      url: originalBlog.url,
    };

    await api
      .put(`/api/blogs/${updatedBlog.id}`)
      .send(updatedBlog)
      .expect(200);

    const blogsAtEnd = await Blog.find({});

    expect(blogsAtEnd).toHaveLength(blogsAtStart.length);
    expect(blogsAtEnd).not.toContainEqual(originalBlog);
    // https://github.com/jestjs/jest/issues/9624
    expect(blogsAtEnd).toContainEqual(expect.objectContaining(updatedBlog));
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
