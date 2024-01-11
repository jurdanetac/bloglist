const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const Blog = require('../models/blogs');

const api = supertest(app);

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

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogsObject = initialBlogs.map((blog) => new Blog(blog));
  const promiseArray = blogsObject.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

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

test('addition of a new blog', async () => {
  // create a new blog
  const newBlog = new Blog({
    author: 'Test Add',
    title: 'Test Blog',
    url: 'https://www.example.com',
  });

  // send the blog to db
  const result = await newBlog.save();
  // check the blog was saved
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

afterAll(async () => {
  await mongoose.connection.close();
});
