// coupon.js

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

  // โหลดประวัติการใช้คูปอง (ActivityType === 'Use' และ RelatedCouponID ไม่ว่าง)
  async function loadCouponLogs() {
    try {
      const logRes = await apiGet("getLogsByMember", { memberId });
      if (logRes.status === "success") {
        // กรองเฉพาะ ActivityType='Use' และ RelatedCouponID != ''
        let couponLogs = logRes.logs.filter(log =>
          log.ActivityType === "Use" && log.RelatedCouponID
        );

        // เรียงจากใหม่สุด → เก่า
        couponLogs.sort((a, b) => {
          const parseDT = (str) => {
            const [datePart, timePart] = String(str).split(" ");
            if (!datePart || !timePart) return new Date(0);
            const [d, m, y] = datePart.split("/").map(x => parseInt(x, 10));
            const [hh, mm] = timePart.split(":").map(x => parseInt(x, 10));
            return new Date(y, m - 1, d, hh, mm);
          };
          return parseDT(b.LogTimestamp) - parseDT(a.LogTimestamp);
        });

        const ul = document.getElementById("couponLogList");
        if (!ul) return;
        ul.innerHTML = "";

        if (couponLogs.length === 0) {
          const liEmpty = document.createElement("li");
          liEmpty.className = "text-center text-gray-500";
          liEmpty.innerText = "ยังไม่มีการใช้คูปอง";
          ul.appendChild(liEmpty);
          return;
        }

        couponLogs.forEach(log => {
          const li = document.createElement("li");
          li.className = "flex justify-between bg-gray-50 p-2 rounded";

          // แสดงโค้ดคูปองและวันที่
          const infoSpan = document.createElement("span");
          infoSpan.className = "text-sm text-gray-800";
          infoSpan.innerText = `ใช้คูปอง ${log.RelatedCouponID}`;

          const dateSpan = document.createElement("span");
          dateSpan.className = "text-sm text-gray-600";
          dateSpan.innerText = log.LogTimestamp;

          li.appendChild(infoSpan);
          li.appendChild(dateSpan);
          ul.appendChild(li);
        });
      } else {
        console.error("getLogsByMember error:", logRes.message);
      }
    } catch (err) {
      console.error("Error fetching coupon logs:", err);
    }
  }

  // ฟังก์ชันสำหรับใช้คูปอง
  async function applyCoupon() {
    const codeInput = document.getElementById("couponCodeInput");
    if (!codeInput) return;

    const couponCode = codeInput.value.trim();
    if (!couponCode) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกโค้ดคูปอง",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    // เรียก API เพื่อดูรายละเอียดคูปอง
    try {
      const couponRes = await apiGet("getCouponByCode", { couponCode });
      if (couponRes.status !== "success") {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถใช้คูปองได้",
          text: couponRes.message || "โค้ดคูปองไม่ถูกต้องหรือหมดอายุ",
          confirmButtonText: "ตกลง"
        });
        return;
      }
      const coupon = couponRes.coupon;
      const ptsCost = parseInt(coupon.PointsCost, 10) || 0;

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

      if (currentPts < ptsCost) {
        Swal.fire({
          icon: "warning",
          title: "พ้อยท์ไม่เพียงพอ",
          text: `คุณมีพ้อยท์ ${currentPts.toLocaleString()} พ้อยท์ แต่ต้องใช้ ${ptsCost.toLocaleString()} พ้อยท์`,
          confirmButtonText: "ตกลง"
        });
        return;
      }

      // ยืนยันการใช้คูปอง
      const { isConfirmed } = await Swal.fire({
        title: `ใช้คูปอง ${couponCode}`,
        html: `
          <p>ใช้พ้อยท์ ${ptsCost.toLocaleString()} พ้อยท์</p>
          <p>คุณมีพ้อยท์คงเหลือ ${currentPts.toLocaleString()} พ้อยท์</p>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ยืนยันใช้คูปอง",
        cancelButtonText: "ยกเลิก"
      });
      if (!isConfirmed) return;

      // เรียก API เพื่อใช้พ้อยท์แลกคูปอง
      const res = await apiPost("usePoints", {
        memberId: memberId,
        pointsToUse: ptsCost,
        description: `ใช้คูปอง ${coupon.CouponID}`,
        relatedCouponId: coupon.CouponID
      });
      if (res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "ใช้คูปองสำเร็จ",
          text: `คุณใช้ ${ptsCost.toLocaleString()} พ้อยท์ สำหรับคูปอง ${couponCode}`,
          confirmButtonText: "ตกลง"
        });
        codeInput.value = "";
        // อัปเดตยอดพ้อยท์และโหลดประวัติใหม่
        await updatePointDisplay();
        await loadCouponLogs();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res.message || "ไม่สามารถใช้คูปองได้",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("getCouponByCode/usePoints error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // เรียกอัปเดตยอดพ้อยท์และโหลดประวัติการใช้คูปอง
  await updatePointDisplay();
  await loadCouponLogs();

  // ตั้ง Event ให้ปุ่มยืนยันใช้คูปอง
  const applyBtn = document.getElementById("applyCouponButton");
  if (applyBtn) {
    applyBtn.addEventListener("click", applyCoupon);
  }

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
