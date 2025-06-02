// admin/assets/js/coupons.js

document.addEventListener("DOMContentLoaded", () => {
  const couponsTableBody = document.getElementById("couponsTableBody");
  const addCouponButton = document.getElementById("addCouponButton");
  const couponModal = document.getElementById("couponModal");
  const modalTitle = document.getElementById("modalTitle");
  const couponForm = document.getElementById("couponForm");
  const inputCouponCode = document.getElementById("inputCouponCode");
  const inputPointsCost = document.getElementById("inputPointsCost");
  const inputDiscountValue = document.getElementById("inputDiscountValue");
  const inputValidFrom = document.getElementById("inputValidFrom");
  const inputValidTo = document.getElementById("inputValidTo");
  const inputUsageLimit = document.getElementById("inputUsageLimit");
  const inputIsActive = document.getElementById("inputIsActive");
  const saveCouponButton = document.getElementById("saveCouponButton");
  const cancelCouponButton = document.getElementById("cancelCouponButton");
  const logoutButton = document.getElementById("logoutButton");

  let editMode = false;
  let editCouponId = null;

  // Load and display all coupons
  async function loadCoupons() {
    try {
      const res = await apiGet("listCoupons");
      if (res.status === "success") {
        const coupons = res.coupons;
        couponsTableBody.innerHTML = "";
        coupons.forEach(c => {
          const tr = document.createElement("tr");

          // CouponID
          const tdId = document.createElement("td");
          tdId.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdId.innerText = c.CouponID;
          tr.appendChild(tdId);

          // CouponCode
          const tdCode = document.createElement("td");
          tdCode.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdCode.innerText = c.CouponCode || "-";
          tr.appendChild(tdCode);

          // PointsCost
          const tdCost = document.createElement("td");
          tdCost.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdCost.innerText = (parseInt(c.PointsCost, 10) || 0).toLocaleString();
          tr.appendChild(tdCost);

          // DiscountValue
          const tdDiscount = document.createElement("td");
          tdDiscount.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdDiscount.innerText = (parseInt(c.DiscountValue, 10) || 0).toLocaleString();
          tr.appendChild(tdDiscount);

          // ValidFrom
          const tdFrom = document.createElement("td");
          tdFrom.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdFrom.innerText = c.ValidFrom || "-";
          tr.appendChild(tdFrom);

          // ValidTo
          const tdTo = document.createElement("td");
          tdTo.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdTo.innerText = c.ValidTo || "-";
          tr.appendChild(tdTo);

          // UsageLimit
          const tdLimit = document.createElement("td");
          tdLimit.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdLimit.innerText = parseInt(c.UsageLimit, 10) || 0;
          tr.appendChild(tdLimit);

          // TimesUsed
          const tdUsed = document.createElement("td");
          tdUsed.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdUsed.innerText = parseInt(c.TimesUsed, 10) || 0;
          tr.appendChild(tdUsed);

          // Status
          const tdStatus = document.createElement("td");
          tdStatus.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdStatus.innerText = c.IsActive || "-";
          tr.appendChild(tdStatus);

          // Actions
          const tdActions = document.createElement("td");
          tdActions.className = "px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2";

          // Edit button
          const editBtn = document.createElement("button");
          editBtn.className = "text-blue-600 hover:text-blue-800";
          editBtn.innerText = "แก้ไข";
          editBtn.addEventListener("click", () => openEditModal(c));
          tdActions.appendChild(editBtn);

          // Toggle Status button
          const toggleBtn = document.createElement("button");
          toggleBtn.className = c.IsActive === "Active" ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800";
          toggleBtn.innerText = c.IsActive === "Active" ? "ปิดใช้งาน" : "เปิดใช้งาน";
          toggleBtn.addEventListener("click", () => confirmToggleStatus(c));
          tdActions.appendChild(toggleBtn);

          tr.appendChild(tdActions);
          couponsTableBody.appendChild(tr);
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถโหลดคูปองได้",
          text: res.message || "กรุณาลองใหม่ภายหลัง",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("Error loading coupons:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // Open modal for adding a new coupon
  function openAddModal() {
    editMode = false;
    editCouponId = null;
    modalTitle.innerText = "เพิ่มคูปองใหม่";
    inputCouponCode.value = "";
    inputPointsCost.value = "";
    inputDiscountValue.value = "";
    inputValidFrom.value = "";
    inputValidTo.value = "";
    inputUsageLimit.value = "";
    inputIsActive.value = "Active";
    couponModal.classList.remove("hidden");
  }

  // Open modal for editing an existing coupon
  function openEditModal(c) {
    editMode = true;
    editCouponId = c.CouponID;
    modalTitle.innerText = "แก้ไขข้อมูลคูปอง";
    inputCouponCode.value = c.CouponCode || "";
    inputPointsCost.value = c.PointsCost || "";
    inputDiscountValue.value = c.DiscountValue || "";
    // Convert dd/MM/yyyy to yyyy-MM-dd for date input
    const [d1, m1, y1] = c.ValidFrom.split("/");
    inputValidFrom.value = `${y1}-${m1.padStart(2, "0")}-${d1.padStart(2, "0")}`;
    const [d2, m2, y2] = c.ValidTo.split("/");
    inputValidTo.value = `${y2}-${m2.padStart(2, "0")}-${d2.padStart(2, "0")}`;
    inputUsageLimit.value = c.UsageLimit || "";
    inputIsActive.value = c.IsActive || "Active";
    couponModal.classList.remove("hidden");
  }

  // Close the modal
  function closeModal() {
    couponModal.classList.add("hidden");
  }

  // Save coupon (create or update)
  async function saveCoupon() {
    const code = inputCouponCode.value.trim();
    const cost = parseInt(inputPointsCost.value, 10);
    const discount = parseInt(inputDiscountValue.value, 10);
    const validFrom = inputValidFrom.value;
    const validTo = inputValidTo.value;
    const usageLimit = parseInt(inputUsageLimit.value, 10);
    const isActive = inputIsActive.value;

    if (!code || isNaN(cost) || isNaN(discount) || !validFrom || !validTo || isNaN(usageLimit)) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    // Convert date inputs from yyyy-MM-dd to dd/MM/yyyy
    const [y1, m1, d1] = validFrom.split("-");
    const fromStr = `${d1.padStart(2, "0")}/${m1.padStart(2, "0")}/${y1}`;
    const [y2, m2, d2] = validTo.split("-");
    const toStr = `${d2.padStart(2, "0")}/${m2.padStart(2, "0")}/${y2}`;

    if (editMode) {
      // Update existing coupon
      try {
        const res = await apiPost("updateCoupon", {
          couponId: editCouponId,
          couponCode: code,
          pointsCost: cost,
          discountValue: discount,
          validFrom: fromStr,
          validTo: toStr,
          usageLimit: usageLimit,
          isActive: isActive
        });
        if (res.status === "success") {
          Swal.fire({
            icon: "success",
            title: "อัปเดตข้อมูลคูปองสำเร็จ",
            confirmButtonText: "ตกลง"
          });
          closeModal();
          await loadCoupons();
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: res.message || "ไม่สามารถอัปเดตข้อมูลคูปองได้",
            confirmButtonText: "ตกลง"
          });
        }
      } catch (err) {
        console.error("updateCoupon error:", err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
          confirmButtonText: "ตกลง"
        });
      }
    } else {
      // Create new coupon
      try {
        const res = await apiPost("createCoupon", {
          couponCode: code,
          pointsCost: cost,
          discountValue: discount,
          validFrom: fromStr,
          validTo: toStr,
          usageLimit: usageLimit
        });
        if (res.status === "success") {
          Swal.fire({
            icon: "success",
            title: "เพิ่มคูปองสำเร็จ",
            confirmButtonText: "ตกลง"
          });
          closeModal();
          await loadCoupons();
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: res.message || "ไม่สามารถสร้างคูปองใหม่ได้",
            confirmButtonText: "ตกลง"
          });
        }
      } catch (err) {
        console.error("createCoupon error:", err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
          confirmButtonText: "ตกลง"
        });
      }
    }
  }

  // Confirm and toggle coupon status (Active ↔ Inactive)
  async function confirmToggleStatus(c) {
    const newStatus = c.IsActive === "Active" ? "Inactive" : "Active";
    const { isConfirmed } = await Swal.fire({
      title: `เปลี่ยนสถานะคูปอง ${c.CouponID}?`,
      text: `ต้องการเปลี่ยนสถานะเป็น "${newStatus}" ใช่หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;

    try {
      const res = await apiPost("updateCoupon", {
        couponId: c.CouponID,
        isActive: newStatus
      });
      if (res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "เปลี่ยนสถานะสำเร็จ",
          confirmButtonText: "ตกลง"
        });
        await loadCoupons();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res.message || "ไม่สามารถเปลี่ยนสถานะคูปองได้",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("toggle coupon status error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // Event listeners
  addCouponButton.addEventListener("click", openAddModal);
  cancelCouponButton.addEventListener("click", closeModal);
  saveCouponButton.addEventListener("click", saveCoupon);

  logoutButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  // Initial load
  loadCoupons();
});
