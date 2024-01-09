const dummy = (blogs) => 1;

const totalLikes = (blogs) => {
  const reducer = (sum, item) => sum + item.likes;
  return blogs.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
  const reducer = (fav, item) => (fav.likes >= item.likes ? fav : item);
  return blogs.reduce(reducer, {});
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
};
