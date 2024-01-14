const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const User = require('../models/users');

const api = supertest(app);

const dummyUser = {};

// clear db before each test
beforeEach(async () => {
  dummyUser.name = 'John Doe';
  dummyUser.username = 'john';
  dummyUser.password = 'password';

  await User.deleteMany({});
});

describe('addition of a new user', () => {
  const postUser = async (user, expectedStatus) => (api.post('/api/users')
    .send(user)
    .expect(expectedStatus)
    .expect('Content-Type', /application\/json/)
  );

  const checkUserInDb = async (user) => {
    const userInDb = await User.findOne({ username: user.username });

    if (userInDb) {
      return true;
    }

    return false;
  };

  test('succeeds with valid data', async () => {
    await postUser(dummyUser, 201);
    expect(await checkUserInDb(dummyUser)).toBe(true);
  });

  test('succeeds with only name missing', async () => {
    dummyUser.name = undefined;
    await postUser(dummyUser, 201);
    expect(await checkUserInDb(dummyUser)).toBe(true);
  });

  test('fails with status code 400 if username is invalid', async () => {
    dummyUser.username = 'jo';
    const response = await postUser(dummyUser, 400);
    expect(response.body).toEqual({ error: 'username must be at least 3 characters long' });
    expect(await checkUserInDb(dummyUser)).toBe(false);
  });

  test('fails with status code 400 if password is invalid', async () => {
    dummyUser.password = 'pa';
    const response = await postUser(dummyUser, 400);
    expect(response.body).toEqual({ error: 'password must be at least 3 characters long' });
    expect(await checkUserInDb(dummyUser)).toBe(false);
  });

  test('fails with status code 400 if username is missing', async () => {
    dummyUser.username = undefined;
    postUser(dummyUser, 400);
    expect(await checkUserInDb(dummyUser)).toBe(false);
  });

  test('fails with status code 400 if password is missing', async () => {
    dummyUser.password = undefined;
    postUser(dummyUser, 400);
    expect(await checkUserInDb(dummyUser)).toBe(false);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
