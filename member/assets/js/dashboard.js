// dashboard.js

document.addEventListener("DOMContentLoaded", async () => {
  // รอให้ LIFF ตรวจสอบการล็อกอินเสร็จสิ้นก่อน
  await new Promise(resolve => {
    const check = () => {
      if (localStorage.getItem("memberId")) {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });

  const memberId = localStorage.getItem("memberId");
  if (!memberId) {
    return;
  }

  // ดึงข้อมูลสมาชิก
  try {
    const memRes = await apiGet("getMember", { memberId });
    if (memRes.status === "success") {
      const member = memRes.member;
      // แสดงชื่อสมาชิก
      const nameElem = document.getElementById("memberName");
      if (nameElem) {
        nameElem.innerText = member.Name || member.MemberID;
      }
      // แสดงยอดพ้อยท์
      const balanceElem = document.getElementById("pointBalance");
      const displayPtsElem = document.getElementById("pointsDisplay");
      const pts = parseInt(member.PointsBalance, 10) || 0;
      if (balanceElem) {
        balanceElem.innerText = pts.toLocaleString();
      }
      if (displayPtsElem) {
        displayPtsElem.innerText = pts.toLocaleString();
      }
      // แสดงสีไอคอน Tier ตาม MemberTier
      const tierIcon = document.getElementById("tierIcon");
      if (tierIcon) {
        switch ((member.MemberTier || "").toLowerCase()) {
          case "silver":
            tierIcon.classList.remove("bg-yellow-400", "bg-green-400", "bg-gray-300");
            tierIcon.classList.add("bg-gray-400");
            break;
          case "gold":
            tierIcon.classList.remove("bg-yellow-400", "bg-gray-300");
            tierIcon.classList.add("bg-yellow-400");
            break;
          case "platinum":
            tierIcon.classList.remove("bg-yellow-400", "bg-gray-300");
            tierIcon.classList.add("bg-green-400");
            break;
          default:
            tierIcon.classList.remove("bg-yellow-400", "bg-green-400");
            tierIcon.classList.add("bg-gray-300");
        }
      }
    } else {
      console.error("getMember error:", memRes.message);
    }
  } catch (err) {
    console.error("Error fetching member:", err);
  }

  // ดึงประวัติ 5 รายการล่าสุด
  try {
    const logRes = await apiGet("getLogsByMember", { memberId });
    if (logRes.status === "success") {
      let logs = logRes.logs;

      // แปลง LogTimestamp เป็น Date แล้วเรียงจากใหม่สุดไปเก่าสุด
      logs.sort((a, b) => {
        const parseDT = str => {
          const [datePart, timePart] = str.split(" ");
          const [d, m, y] = datePart.split("/").map(x => parseInt(x, 10));
          const [hh, mm] = timePart.split(":").map(x => parseInt(x, 10));
          return new Date(y, m - 1, d, hh, mm);
        };
        return parseDT(b.LogTimestamp) - parseDT(a.LogTimestamp);
      });

      const latestFive = logs.slice(0, 5);
      const ul = document.getElementById("latestLogList");
      if (ul) {
        ul.innerHTML = "";
        latestFive.forEach(log => {
          const li = document.createElement("li");
          li.className = "flex justify-between bg-gray-50 p-2 rounded";
          // แสดง ActivityType และ PointsChange
          const typeText = document.createElement("span");
          typeText.innerText = log.ActivityType;
          const ptsChange = document.createElement("span");
          const change = parseInt(log.PointsChange, 10) || 0;
          ptsChange.innerText = (change > 0 ? "+" : "") + change.toLocaleString() + " พ้อยท์";
          if (change > 0) {
            ptsChange.classList.add("text-green-600");
          } else if (change < 0) {
            ptsChange.classList.add("text-red-600");
          }
          li.appendChild(typeText);
          li.appendChild(ptsChange);
          ul.appendChild(li);
        });
      }
    } else {
      console.error("getLogsByMember error:", logRes.message);
    }
  } catch (err) {
    console.error("Error fetching logs:", err);
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
