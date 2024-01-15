const blogsRouter = require('express').Router();
const middleware = require('../utils/middleware');
const Blog = require('../models/blogs');
const User = require('../models/users');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { name: 1, username: 1, id: 1 });
  response.json(blogs);
});

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const { body } = request;

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: request.user,
  });

  if (!blog.title) {
    return response.status(400).json({ error: 'bad request: no title' });
  } if (!blog.url) {
    return response.status(400).json({ error: 'bad request: no url' });
  }

  // save blog
  const savedBlog = await blog.save();

  // add blog to user
  await User.findByIdAndUpdate(
    savedBlog.user,
    { $push: { blogs: savedBlog.id } },
  );

  return response.status(201).json(savedBlog);
});

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
  const { id } = request.params;
  const blog = await Blog.findById(id);
  const creator = await User.findById(blog.user);

  if (!blog) {
    return response.status(400).json({ error: 'bad request: no such blog' });
  } if (request.user !== creator.id) {
    return response.status(401).json({ error: 'only creators can delete blogs' });
  }

  await Blog.deleteOne({ _id: id });
  return response.status(204).end();
});

blogsRouter.put('/:id', async (request, response) => {
  const { id } = request.params;
  const { body } = request;

  await Blog.findByIdAndUpdate(id, body, { new: true, omitUndefined: true });
  response.status(200).end();
});

module.exports = blogsRouter;
