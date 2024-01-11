const blogsRouter = require('express').Router();
const Blog = require('../models/blogs');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

blogsRouter.post('/', async (request, response) => {
  const blog = new Blog(request.body);

  if (!blog.title) {
    response.status(400).json({ error: 'bad request: no title' });
  } else if (!blog.url) {
    response.status(400).json({ error: 'bad request: no url' });
  } else {
    const savedBlog = await blog.save();
    response.status(201).json(savedBlog);
  }
});

blogsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  await Blog.deleteOne({ _id: id });
  response.status(204).end();
});

module.exports = blogsRouter;
