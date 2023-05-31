 const groupBy = (data, property)  => {
    return data.reduce((acc, obj) => {
      const key = obj[property];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
  }

  const ROLES = ['student', 'trainer', 'consultancy','developer']

  export {
    groupBy,
    ROLES
  }