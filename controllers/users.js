const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/users');

usersRouter.get('/', async (request, response) => {
  const users = await User.find({});
  response.json(users);
});

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body;

  if (!username) {
    response.status(400).json({ error: 'username must be given' });
  } else if (!password) {
    response.status(400).json({ error: 'password must be given' });
  } else if (!(username.length >= 3)) {
    response.status(400).json({ error: 'username must be at least 3 characters long' });
  } else if (!(password.length >= 3)) {
    response.status(400).json({ error: 'password must be at least 3 characters long' });
  } else {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      username,
      name,
      passwordHash,
    });

    const savedUser = await user.save();

    response.status(201).json(savedUser);
  }
});

module.exports = usersRouter;
