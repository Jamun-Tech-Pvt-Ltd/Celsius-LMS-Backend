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

const ROLES = ['student', 'trainer', 'consultancy', 'developer', 'employer']


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

export {
  groupBy,
  ROLES,
  getRandomItemsFromArray
}