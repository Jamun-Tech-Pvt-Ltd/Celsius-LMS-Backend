import crypto from 'crypto'

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

const user_access = [
  {
    name: "Dashboard",
    access: [
      {
        read: true,
      },
    ],
  },
  {
    name: "Courses",
    option: [
      {
        name: "Categories",
        access: [
          {
            create: true,
            read: true,
            update: true,
            delete: true,
          },
        ],
      },
      {
        name: "Courses",
        access: [
          {
            create: true,
            read: true,
            update: true,
            delete: true,
          },
        ],
      },
      {
        name: "Course Request",
        access: [
          {
            create: true,
            read: true,
            update: true,
            delete: true,
          },
        ],
      },
    ],
  },
  {
    name: "StakeHolders",
    option: [
      {
        name: "Admins",
        access: [
          {
            create: true,
            read: true,
            update: true,
            delete: true,
          },
        ],
      },

      {
        name: "Trainer",
        access: [
          {
            create: true,
            read: true,
            update: true,
          },
        ],
      },
      {
        name: "Student",
        access: [
          {
            create: true,
            read: true,
            update: true,
            delete: true,
          },
        ],
      },
    ],
  },
  {
    name: "Promo Code",
    access: [
      {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    ],
  },
  {
    name: "Partners",
    access: [
      {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    ],
  },

  {
    name: "Subscription",
    access: [
      {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    ],
  },

  {
    name: "Payments",
    access: [
      {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    ],
  },
  {
    name: "Attendance",
    access: [
      {
        read: true,
      },
    ],
  },
  {
    name: "Settings",
    option: [
      {
        name: "Website Info",
        access: [
          {
            update: true,
          },
        ],
      },
      {
        name: "Send Mail",
        access: [
          {
            create: true,
          },
        ],
      },
    ],
  },
  {
    name: "Faqs",
    access: [
      {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    ],
  },
  {
    name: "Profile",
    access: [
      {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    ],
  },
  {
    name: "Support",
    access: [
      {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    ],
  },
];

const DefaultUserAccess = JSON.stringify(user_access)

export {
  groupBy,
  ROLES,
  getRandomItemsFromArray,
  generatePasswordFromUsername,
  DefaultUserAccess
}