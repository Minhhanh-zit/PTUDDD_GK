export const C = {
  bg: '#F8F7FF', white: '#FFFFFF', blue: '#8295E5', blueDark: '#6376CC',
  blueSoft: '#EAF0FF', purple: '#AF9AEF', purpleDark: '#8A70D0',
  purpleSoft: '#EEE9FF', text: '#393657', muted: '#8585A5',
  border: '#E7E6F5', success: '#429A7D', successBg: '#E7F6F0',
  danger: '#C96C88', dangerBg: '#FFF0F4',
};

export const shadow = {
  shadowColor: '#8176BC', shadowOpacity: 0.08,
  shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
};

export function categoryIcon(name = '') {
  const value = String(name).toLowerCase();
  if (value.includes('drink') || value.includes('nước') || value.includes('uống')) return 'cafe-outline';
  if (value.includes('dessert') || value.includes('tráng')) return 'ice-cream-outline';
  return 'restaurant-outline';
}

export function money(price) {
  return Number(price || 0).toLocaleString('vi-VN') + ' VND';
}
