// admin/assets/js/reports.js

document.addEventListener("DOMContentLoaded", () => {
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const loadReportButton = document.getElementById("loadReportButton");
  const summaryCards = document.getElementById("summaryCards");
  const chartsSection = document.getElementById("chartsSection");

  const totalEarnedElem = document.getElementById("totalEarned");
  const totalUsedElem = document.getElementById("totalUsed");
  const totalMembersElem = document.getElementById("totalMembers");
  const totalProductsElem = document.getElementById("totalProducts");

  const topMembersCanvas = document.getElementById("topMembersChart").getContext("2d");
  const topProductsCanvas = document.getElementById("topProductsChart").getContext("2d");

  let topMembersChart = null;
  let topProductsChart = null;
  const logoutButton = document.getElementById("logoutButton");

  // Convert "yyyy-mm-dd" to "dd/MM/yyyy"
  function formatDateInput(value) {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }

  async function loadReport() {
    const rawStart = startDateInput.value;
    const rawEnd = endDateInput.value;
    if (!rawStart || !rawEnd) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกช่วงวันที่ให้ครบถ้วน",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    const startDate = formatDateInput(rawStart);
    const endDate = formatDateInput(rawEnd);

    try {
      // ดึงสรุปยอดพ้อยท์
      const summaryRes = await apiGet("getPointSummary", { startDate, endDate });
      if (summaryRes.status !== "success") {
        throw new Error(summaryRes.message || "ไม่สามารถดึงสรุปยอดพ้อยท์ได้");
      }
      totalEarnedElem.innerText = (summaryRes.totalEarned || 0).toLocaleString();
      totalUsedElem.innerText = (summaryRes.totalUsed || 0).toLocaleString();
    } catch (err) {
      console.error("getPointSummary error:", err);
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถโหลดสรุปยอดพ้อยท์ได้",
        text: err.message || "กรุณาลองใหม่ภายหลัง",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    try {
      // ดึงจำนวนสมาชิกทั้งหมด
      const membersRes = await apiGet("listMembers");
      if (membersRes.status !== "success") throw new Error(membersRes.message);
      totalMembersElem.innerText = (membersRes.members.length || 0).toLocaleString();
    } catch (err) {
      console.error("listMembers error:", err);
      totalMembersElem.innerText = "-";
    }

    try {
      // ดึงจำนวนสินค้า (Active + Inactive)
      const productsRes = await apiGet("listProducts");
      if (productsRes.status !== "success") throw new Error(productsRes.message);
      totalProductsElem.innerText = (productsRes.products.length || 0).toLocaleString();
    } catch (err) {
      console.error("listProducts error:", err);
      totalProductsElem.innerText = "-";
    }

    // ดึง Top Members
    let topMembersData = [];
    try {
      const topMembersRes = await apiGet("getTopMembers", {
        startDate,
        endDate,
        limit: 5
      });
      if (topMembersRes.status === "success") {
        topMembersData = topMembersRes.topMembers;
      } else {
        throw new Error(topMembersRes.message);
      }
    } catch (err) {
      console.error("getTopMembers error:", err);
      topMembersData = [];
    }

    // ดึง Top Products
    let topProductsData = [];
    try {
      const topProductsRes = await apiGet("getTopProducts", {
        startDate,
        endDate,
        limit: 5
      });
      if (topProductsRes.status === "success") {
        topProductsData = topProductsRes.topProducts;
      } else {
        throw new Error(topProductsRes.message);
      }
    } catch (err) {
      console.error("getTopProducts error:", err);
      topProductsData = [];
    }

    // แสดงส่วนสรุปและกราฟ
    summaryCards.classList.remove("hidden");
    chartsSection.classList.remove("hidden");

    // เตรียมข้อมูลกราฟ Top Members
    const memberLabels = topMembersData.map(item => item.memberId);
    const memberPoints = topMembersData.map(item => Math.abs(item.totalPoints));

    if (topMembersChart) topMembersChart.destroy();
    topMembersChart = new Chart(topMembersCanvas, {
      type: "bar",
      data: {
        labels: memberLabels,
        datasets: [
          {
            label: "คะแนนรวม",
            data: memberPoints
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // เตรียมข้อมูลกราฟ Top Products
    const productLabels = topProductsData.map(item => item.productName);
    const productCounts = topProductsData.map(item => item.usageCount);

    if (topProductsChart) topProductsChart.destroy();
    topProductsChart = new Chart(topProductsCanvas, {
      type: "bar",
      data: {
        labels: productLabels,
        datasets: [
          {
            label: "จำนวนการแลก",
            data: productCounts
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  loadReportButton.addEventListener("click", loadReport);

  logoutButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });
});
