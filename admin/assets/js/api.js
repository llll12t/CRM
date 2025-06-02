// admin/assets/js/api.js

// ตั้งค่า URL ของ Google Apps Script Web App (นำ URL ที่ได้จากการ Deploy มาวางตรงนี้)
const GAS_URL = "https://script.google.com/macros/s/AKfycbyaWOgaqrIqOlePad0g1wVUnP4to3LZLlnHYhvRs1JjX4sq2yZ1E6NBFuF3JkGwiKrGDA/exec";

/**
 * เรียก API แบบ GET (สำหรับ Admin)
 * @param {string} route - ชื่อ route ที่จะเรียก (เช่น "listMembers", "getPointSummary", ฯลฯ)
 * @param {Object} params - อ็อบเจ็กต์ของพารามิเตอร์ที่จะส่งผ่าน query string (เช่น { startDate: "2025-06-01", endDate: "2025-06-30" })
 * @returns {Promise<Object>} - ผลลัพธ์ JSON ที่ API ส่งกลับ
 */
async function apiGet(route, params = {}) {
  let qs = `?route=${route}`;
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== "") {
      qs += `&${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    }
  }
  const response = await fetch(`${GAS_URL}${qs}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  return await response.json();
}

/**
 * เรียก API แบบ POST (สำหรับ Admin)
 * @param {string} route - ชื่อ route ที่จะเรียก (เช่น "createMember", "updateProduct", ฯลฯ)
 * @param {Object} data - อ็อบเจ็กต์ข้อมูลที่จะส่งใน body ของ POST (JSON)
 * @returns {Promise<Object>} - ผลลัพธ์ JSON ที่ API ส่งกลับ
 */
async function apiPost(route, data = {}) {
  const url = `${GAS_URL}?route=${route}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}
