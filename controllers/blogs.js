const blogsRouter = require('express').Router();
const Blog = require('../models/blogs');
const User = require('../models/users');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { name: 1, username: 1, id: 1 });
  response.json(blogs);
});

blogsRouter.post('/', async (request, response) => {
  const blog = new Blog(request.body);

  if (!blog.title) {
    response.status(400).json({ error: 'bad request: no title' });
  } else if (!blog.url) {
    response.status(400).json({ error: 'bad request: no url' });
  } else {
    // Which user is designated as the creator does not matter just yet.
    // The functionality is finished in exercise 4.19.

    // save blog with user
    blog.user = await User.findOne({});
    const savedBlog = await blog.save();

    // add blog to user
    await User.findByIdAndUpdate(
      blog.user.id,
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
