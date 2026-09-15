const getPaginationParams = (query) => {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || 20;

  page = Math.max(page, 1);
  limit = Math.min(Math.max(limit, 1), 100); // max 100 per page

  const skip = (page - 1) * limit;

  return { skip, limit, page };
};

module.exports = { getPaginationParams };
