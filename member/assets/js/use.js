// use.js

document.addEventListener("DOMContentLoaded", async () => {
  // รอให้ LIFF ตรวจสอบและเตรียม memberId สำเร็จ
  await new Promise((resolve) => {
    const checkMember = () => {
      if (localStorage.getItem("memberId")) {
        resolve();
      } else {
        setTimeout(checkMember, 100);
      }
    };
    checkMember();
  });

  const memberId = localStorage.getItem("memberId");
  if (!memberId) return;

  // อัปเดตยอดพ้อยท์ใน header
  async function updatePointDisplay() {
    try {
      const memRes = await apiGet("getMember", { memberId });
      if (memRes.status === "success") {
        const pts = parseInt(memRes.member.PointsBalance, 10) || 0;
        const displayPtsElem = document.getElementById("pointsDisplay");
        if (displayPtsElem) {
          displayPtsElem.innerText = pts.toLocaleString();
        }
      }
    } catch (err) {
      console.error("Error fetching member points:", err);
    }
  }

  // โหลดรายการสินค้าและแสดงใน grid
  async function loadProducts() {
    const grid = document.getElementById("productGrid");
    const noMsg = document.getElementById("noProductsMessage");
    if (!grid) return;

    try {
      const prodRes = await apiGet("listProducts");
      if (prodRes.status === "success") {
        const products = prodRes.products
          // กรองเฉพาะที่ stock > 0
          .filter(p => parseInt(p.Stock, 10) > 0)
          .sort((a, b) => parseInt(a.PointsCost, 10) - parseInt(b.PointsCost, 10));

        grid.innerHTML = "";
        if (products.length === 0) {
          noMsg.innerText = "ขณะนี้ไม่มีสินค้าสำหรับแลกพ้อยท์";
          noMsg.classList.remove("hidden");
          return;
        }
        noMsg.classList.add("hidden");

        products.forEach(prod => {
          const card = document.createElement("div");
          card.className = "bg-white rounded shadow p-4 flex flex-col";

          // รูปสินค้า
          const img = document.createElement("img");
          img.src = prod.ImageURL || "https://via.placeholder.com/150";
          img.alt = prod.ProductName;
          img.className = "h-32 w-full object-cover rounded";
          card.appendChild(img);

          // ชื่อสินค้า
          const name = document.createElement("h4");
          name.className = "mt-2 font-medium text-gray-800 truncate";
          name.innerText = prod.ProductName;
          card.appendChild(name);

          // ราคาพ้อยท์
          const cost = document.createElement("p");
          cost.className = "mt-1 text-gray-600";
          cost.innerText = `${parseInt(prod.PointsCost, 10).toLocaleString()} พ้อยท์`;
          card.appendChild(cost);

          // จำนวนคงเหลือ
          const stock = document.createElement("p");
          stock.className = "text-sm text-gray-500";
          stock.innerText = `คงเหลือ: ${parseInt(prod.Stock, 10)}`;
          card.appendChild(stock);

          // ปุ่มแลกสินค้า
          const btn = document.createElement("button");
          btn.className = "mt-auto bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition";
          btn.innerText = "แลกสินค้า";
          btn.addEventListener("click", () => confirmRedeem(prod));
          card.appendChild(btn);

          grid.appendChild(card);
        });
      } else {
        console.error("listProducts error:", prodRes.message);
        grid.innerHTML = `<p class="col-span-full text-center text-red-600">ไม่สามารถโหลดสินค้าได้ในขณะนี้</p>`;
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      grid.innerHTML = `<p class="col-span-full text-center text-red-600">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</p>`;
    }
  }

  // ยืนยันก่อนแลกสินค้า
  async function confirmRedeem(product) {
    // ตรวจสอบยอดพ้อยท์ปัจจุบันก่อน
    let currentPts = 0;
    try {
      const memRes = await apiGet("getMember", { memberId });
      if (memRes.status === "success") {
        currentPts = parseInt(memRes.member.PointsBalance, 10) || 0;
      }
    } catch {
      currentPts = 0;
    }

    const cost = parseInt(product.PointsCost, 10) || 0;
    if (currentPts < cost) {
      Swal.fire({
        icon: "warning",
        title: "พ้อยท์ไม่เพียงพอ",
        text: `คุณมีพ้อยท์ ${currentPts.toLocaleString()} พ้อยท์ แต่ต้องใช้ ${cost.toLocaleString()} พ้อยท์`,
        confirmButtonText: "ตกลง"
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: `แลก "${product.ProductName}"`,
      html: `
        <p>ใช้พ้อยท์ ${cost.toLocaleString()} พ้อยท์</p>
        <p>คุณมีพ้อยท์คงเหลือ ${currentPts.toLocaleString()} พ้อยท์</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยันแลกสินค้า",
      cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;

    // เรียก API ใช้พ้อยท์แลกสินค้า
    try {
      const res = await apiPost("usePoints", {
        memberId: memberId,
        pointsToUse: cost,
        description: `แลกสินค้า ${product.ProductID}`,
        relatedProductId: product.ProductID
      });
      if (res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "แลกสินค้าสำเร็จ",
          text: `คุณใช้ ${cost.toLocaleString()} พ้อยท์ แลก "${product.ProductName}"`,
          confirmButtonText: "ตกลง"
        });
        // อัปเดตยอดพ้อยท์และโหลดสินค้าใหม่ (stock อาจลดลง)
        await updatePointDisplay();
        await loadProducts();
        await loadUseLogs();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res.message || "ไม่สามารถแลกสินค้าได้",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("usePoints error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // โหลดประวัติการใช้พ้อยท์ (ActivityType === 'Use')
  async function loadUseLogs() {
    try {
      const logRes = await apiGet("getLogsByMember", { memberId });
      if (logRes.status === "success") {
        // กรองเฉพาะ ActivityType='Use'
        let useLogs = logRes.logs.filter(log => log.ActivityType === "Use");

        // เรียงจากใหม่สุด → เก่า
        useLogs.sort((a, b) => {
          const parseDT = (str) => {
            const [datePart, timePart] = String(str).split(" ");
            if (!datePart || !timePart) return new Date(0);
            const [d, m, y] = datePart.split("/").map(x => parseInt(x, 10));
            const [hh, mm] = timePart.split(":").map(x => parseInt(x, 10));
            return new Date(y, m - 1, d, hh, mm);
          };
          return parseDT(b.LogTimestamp) - parseDT(a.LogTimestamp);
        });

        const ul = document.getElementById("useLogList");
        if (!ul) return;
        ul.innerHTML = "";

        if (useLogs.length === 0) {
          const liEmpty = document.createElement("li");
          liEmpty.className = "text-center text-gray-500";
          liEmpty.innerText = "ยังไม่มีการใช้พ้อยท์";
          ul.appendChild(liEmpty);
          return;
        }

        useLogs.forEach(log => {
          const li = document.createElement("li");
          li.className = "flex justify-between bg-gray-50 p-2 rounded";

          // แสดงวันที่และเวลา
          const dtSpan = document.createElement("span");
          dtSpan.className = "text-sm text-gray-600";
          dtSpan.innerText = log.LogTimestamp;

          // แสดงจำนวนพ้อยท์ที่ใช้
          const ptsSpan = document.createElement("span");
          const change = parseInt(log.PointsChange, 10) || 0;
          ptsSpan.innerText = `${change.toLocaleString()} พ้อยท์`;
          ptsSpan.className = "font-medium text-red-600";

          li.appendChild(dtSpan);
          li.appendChild(ptsSpan);
          ul.appendChild(li);
        });
      } else {
        console.error("getLogsByMember error:", logRes.message);
      }
    } catch (err) {
      console.error("Error fetching use logs:", err);
    }
  }

  // เรียกอัปเดตยอดพ้อยท์, โหลดสินค้า, โหลดประวัติการใช้พ้อยท์
  await updatePointDisplay();
  await loadProducts();
  await loadUseLogs();

  // ปุ่มออกจากระบบ
  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      liff.logout();
      localStorage.removeItem("memberId");
      window.location.href = "../index.html";
    });
  }
});
