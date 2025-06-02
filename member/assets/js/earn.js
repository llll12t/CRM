// earn.js

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
      console.error("Error fetching member for points:", err);
    }
  }

  // โหลดประวัติการสะสมพ้อยท์ (ActivityType === 'Earn')
  async function loadEarnLogs() {
    try {
      const logRes = await apiGet("getLogsByMember", { memberId });
      if (logRes.status === "success") {
        // กรองเฉพาะ ActivityType='Earn'
        let earnLogs = logRes.logs.filter(log => log.ActivityType === "Earn");

        // เรียงจากใหม่สุด → เก่า
        earnLogs.sort((a, b) => {
          const parseDT = (str) => {
            const [datePart, timePart] = String(str).split(" ");
            if (!datePart || !timePart) return new Date(0);
            const [d, m, y] = datePart.split("/").map(x => parseInt(x, 10));
            const [hh, mm] = timePart.split(":").map(x => parseInt(x, 10));
            return new Date(y, m - 1, d, hh, mm);
          };
          return parseDT(b.LogTimestamp) - parseDT(a.LogTimestamp);
        });

        const ul = document.getElementById("earnLogList");
        if (!ul) return;
        ul.innerHTML = "";

        if (earnLogs.length === 0) {
          const liEmpty = document.createElement("li");
          liEmpty.className = "text-center text-gray-500";
          liEmpty.innerText = "ยังไม่มีการสะสมพ้อยท์";
          ul.appendChild(liEmpty);
          return;
        }

        earnLogs.forEach(log => {
          const li = document.createElement("li");
          li.className = "flex justify-between bg-gray-50 p-2 rounded";

          // แสดงวันที่และเวลา
          const dtSpan = document.createElement("span");
          dtSpan.className = "text-sm text-gray-600";
          dtSpan.innerText = log.LogTimestamp;

          // แสดงจำนวนพ้อยท์ที่ได้
          const ptsSpan = document.createElement("span");
          const change = parseInt(log.PointsChange, 10) || 0;
          ptsSpan.innerText = `+${change.toLocaleString()} พ้อยท์`;
          ptsSpan.className = "font-medium text-green-600";

          li.appendChild(dtSpan);
          li.appendChild(ptsSpan);
          ul.appendChild(li);
        });
      } else {
        console.error("getLogsByMember error:", logRes.message);
      }
    } catch (err) {
      console.error("Error fetching earn logs:", err);
    }
  }

  // เรียกอัปเดตยอดพ้อยท์และโหลดประวัติเริ่มต้น
  await updatePointDisplay();
  await loadEarnLogs();

  // Event listener สำหรับปุ่ม "สะสมพ้อยท์"
  const earnButton = document.getElementById("earnButton");
  if (earnButton) {
    earnButton.addEventListener("click", async () => {
      const amountInput = document.getElementById("amountInput");
      if (!amountInput) return;

      const amount = parseInt(amountInput.value, 10);
      if (!amount || amount <= 0) {
        Swal.fire({
          icon: "warning",
          title: "กรุณากรอกจำนวนเงินที่ถูกต้อง",
          confirmButtonText: "ตกลง"
        });
        return;
      }

      // ยืนยันการสะสมพ้อยท์
      const { isConfirmed } = await Swal.fire({
        title: `สะสมพ้อยท์จากยอด ${amount.toLocaleString()} บาท`,
        text: "คุณต้องการสะสมพ้อยท์ใช่หรือไม่?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ใช่, สะสมเลย",
        cancelButtonText: "ยกเลิก"
      });
      if (!isConfirmed) return;

      // เรียก API เพื่อสะสมพ้อยท์
      try {
        const res = await apiPost("earnPoints", {
          memberId: memberId,
          amountMoney: amount,
          description: `สะสมพ้อยท์จากยอด ${amount} บาท`
        });
        if (res.status === "success") {
          Swal.fire({
            icon: "success",
            title: "สะสมพ้อยท์สำเร็จ",
            text: res.message,
            confirmButtonText: "ตกลง"
          });
          amountInput.value = "";
          // อัปเดตยอดพ้อยท์และโหลดประวัติใหม่
          await updatePointDisplay();
          await loadEarnLogs();
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: res.message || "ไม่สามารถสะสมพ้อยท์ได้",
            confirmButtonText: "ตกลง"
          });
        }
      } catch (err) {
        console.error("earnPoints error:", err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
          confirmButtonText: "ตกลง"
        });
      }
    });
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
