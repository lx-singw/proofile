const until = async (input) => {
  try {
    const value = typeof input === 'function' ? await input() : await input;
    return [null, value];
  } catch (error) {
    return [error, undefined];
  }
};

module.exports = {
  until,
  default: until,
};
