const BASE_URL = 'https://6ad61022f71f154ac4866450.mockapi.io';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`MockAPI Error: ${response.status}`);
  }

  return await response.json();
}

// LẤY DANH SÁCH LOẠI MÓN ĂN
export async function getOnlineCategories() {
  return request('/BIT246755_DishCategory');
}

// LẤY DANH SÁCH MÓN ĂN
export async function getOnlineDishes() {
  return request('/BIT246755_Dish');
}

// THÊM MÓN ĂN
export async function createOnlineDish(dish) {
  return request('/BIT246755_Dish', {
    method: 'POST',
    body: JSON.stringify(dish),
  });
}

// CẬP NHẬT MÓN ĂN
export async function updateOnlineDish(id, dish) {
  return request(`/BIT246755_Dish/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(dish),
  });
}

// XÓA MÓN ĂN
export async function deleteOnlineDish(id) {
  return request(`/BIT246755_Dish/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export const mockApi = {
  getOnlineCategories,
  getOnlineDishes,
  createOnlineDish,
  updateOnlineDish,
  deleteOnlineDish,
};

export async function createOnlineCategory(category) {
  return request('/BIT246755_DishCategory', {
    method: 'POST',
    body: JSON.stringify(category),
  });
}
export async function updateOnlineCategory(id, category) {
  return request(`/BIT246755_DishCategory/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });
}
export async function deleteOnlineCategory(id) {
  return request(`/BIT246755_DishCategory/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
