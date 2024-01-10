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

afterAll(async () => {
  await mongoose.connection.close();
});
