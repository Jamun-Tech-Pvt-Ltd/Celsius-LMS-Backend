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

const defaultPackages = [
  {
    title: "Basic",
    description:
      "The most basic plan for starters like small Institutes and training. You can upgrade it anytime.",
    icon: "/defaulticon.svg",
    monthly_price: 7.99,
    monthly_nepal_price: 6000,
    free_month: 1,
    index: 1,
    discount: 0,
    recomendes: false,
    monthly_features: [
      "0 - 25 User",
      "User Management",
      "Core Learning Tools",
      "Messaging & Discussion Boards",
      "Attendance & Tracking",
      "Student Payments & Certificates",
      "Basic Support & Blog Access",
      "Storage: Included (100MB) -Free",
    ],
    yearly_features: [
      "0 - 25 User",
      "User Management",
      "Core Learning Tools",
      "Messaging & Discussion Boards",
      "Attendance & Tracking",
      "Student Payments & Certificates",
      "Basic Support & Blog Access",
      "Storage: Included (20GB) -Free",
    ],
  },
  {
    title: "Premium",
    description:
      "Best for medium scale institutes, companies, and small schools. You can upgrade it anytime.",
    icon: "/defaulticon.svg",
    monthly_price: 6.99,
    monthly_nepal_price: 8000,
    free_month: 1,
    index: 2,
    discount: 0,
    recomendes: true,
    monthly_features: [
      "25 - 50 User",
      "User Management",
      "Core Learning Tools",
      "Messaging & Discussion Boards",
      "Attendance & Tracking",
      "Student Payments & Certificates",
      "Basic Support & Blog Access",
      "Storage: Included (200MB) -Free",
    ],
    yearly_features: [
      "25 - 50 User",
      "User Management",
      "Core Learning Tools",
      "Messaging & Discussion Boards",
      "Attendance & Tracking",
      "Student Payments & Certificates",
      "Basic Support & Blog Access",
      "Storage: Included (40GB) -Free",
    ],
  },
  {
    title: "Advance",
    description:
      "For big companies and institutes like Universities, Medical training, IT Staffing.",
    icon: "/defaulticon.svg",
    monthly_price: 5.99,
    monthly_nepal_price: 5000,
    free_month: 1,
    index: 3,
    discount: 0,
    recomendes: false,
    monthly_features: [
      "50+ User",
      "User Management",
      "Core Learning Tools",
      "Messaging & Discussion Boards",
      "Attendance & Tracking",
      "Student Payments & Certificates",
      "Basic Support & Blog Access",
      "Storage: Included (300MB) -Free",
    ],
    yearly_features: [
      "50+ User",
      "User Management",
      "Core Learning Tools",
      "Messaging & Discussion Boards",
      "Attendance & Tracking",
      "Student Payments & Certificates",
      "Basic Support & Blog Access",
      "Storage: Included (60GB) -Free",
    ],
  },
];

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
      },
    ],
  },
  {
    name: "Update Request",
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
    name: "Certificate",
    access: [
      {
        create: true,
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
  DefaultUserAccess,
  defaultPackages,
}