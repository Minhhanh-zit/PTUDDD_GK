// Pure functions: loc, sap xep doc lap voi React Native va SQLite.
export function getPriceRangeFlags(filters) {
  return {
    rangeInvalid: filters.min !== '' && filters.max !== '' && Number(filters.min) > Number(filters.max),
    negativePrice: (filters.min !== '' && Number(filters.min) < 0) ||
      (filters.max !== '' && Number(filters.max) < 0),
  };
}

export function filterAndSortDishes(dishes, filters) {
  const { rangeInvalid, negativePrice } = getPriceRangeFlags(filters);
  if (rangeInvalid || negativePrice) return [];

  return dishes
    .filter(d =>
      d.name.toLocaleLowerCase().includes(filters.search.trim().toLocaleLowerCase()) &&
      (filters.categoryId === 'all' || d.categoryId === Number(filters.categoryId)) &&
      (!filters.availableOnly || Boolean(d.isAvailable)) &&
      (filters.min === '' || d.price >= Number(filters.min)) &&
      (filters.max === '' || d.price <= Number(filters.max))
    )
    .sort((a, b) => filters.sort === 'desc' ? b.price - a.price
      : filters.sort === 'time' ? a.preparationTime - b.preparationTime : a.price - b.price);
}
