const jwt = require('jsonwebtoken');
const blogsRouter = require('express').Router();
const Blog = require('../models/blogs');
const User = require('../models/users');

const getTokenFrom = (request) => {
  const authorization = request.get('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '');
  }
  return null;
};

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { name: 1, username: 1, id: 1 });
  response.json(blogs);
});

blogsRouter.post('/', async (request, response) => {
  const { body } = request;

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: decodedToken.id,
  });

  if (!blog.title) {
    response.status(400).json({ error: 'bad request: no title' });
  } else if (!blog.url) {
    response.status(400).json({ error: 'bad request: no url' });
  } else {
    // save blog
    const savedBlog = await blog.save();

    // add blog to user
    await User.findByIdAndUpdate(
      savedBlog.user,
      { $push: { blogs: savedBlog.id } },
    );

    response.status(201).json(savedBlog);
  }
});

blogsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  await Blog.deleteOne({ _id: id });
  response.status(204).end();
});

blogsRouter.put('/:id', async (request, response) => {
  const { id } = request.params;
  const { body } = request;

  await Blog.findByIdAndUpdate(id, body, { new: true, omitUndefined: true });
  response.status(200).end();
});

module.exports = blogsRouter;
