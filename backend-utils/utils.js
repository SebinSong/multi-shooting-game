function getRandomHexString (length = 10) {
  return Math.random()
    .toString(36) // base36: 0-9a-z which is 36 characters.
    .substring(2, length + 2) // start from index 2 to avoid '.'
}

module.exports = {
  getRandomHexString
}
