const groupBy = (data, property) => {
  return data.reduce((acc, obj) => {
    const key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});
}

const ROLES = ['student', 'trainer', 'companey']


function getRandomItemsFromArray(arr, numItems) {
  if (numItems >= arr.length) {
    return arr; // Return the whole array if numItems is greater than or equal to the array length
  }

  const shuffled = arr.slice(); // Create a shallow copy of the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Fisher-Yates shuffle algorithm to shuffle the array in place
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, numItems); // Return the first numItems elements from the shuffled array
}

function generatePasswordFromUsername(username) {
  const hash = crypto.createHash('sha256').update(username).digest('hex');
  const randomPart = Math.random().toString(36).substring(2, 10); // Random string of 8 characters
  return hash.substring(0, 12) + randomPart; // Use first 12 characters of hash and add random part
}

export {
  groupBy,
  ROLES,
  getRandomItemsFromArray,
  generatePasswordFromUsername
}