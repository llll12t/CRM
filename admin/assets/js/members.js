// admin/assets/js/members.js

document.addEventListener("DOMContentLoaded", () => {
  const membersTableBody = document.getElementById("membersTableBody");
  const addMemberButton = document.getElementById("addMemberButton");
  const memberModal = document.getElementById("memberModal");
  const modalTitle = document.getElementById("modalTitle");
  const memberForm = document.getElementById("memberForm");
  const inputLineUserID = document.getElementById("inputLineUserID");
  const inputName = document.getElementById("inputName");
  const inputEmail = document.getElementById("inputEmail");
  const inputPhone = document.getElementById("inputPhone");
  const inputAddress = document.getElementById("inputAddress");
  const saveMemberButton = document.getElementById("saveMemberButton");
  const cancelMemberButton = document.getElementById("cancelMemberButton");
  const logoutButton = document.getElementById("logoutButton");

  let editMode = false;
  let editMemberId = null;

  // Load and display all members
  async function loadMembers() {
    try {
      const res = await apiGet("listMembers");
      if (res.status === "success") {
        const members = res.members;
        membersTableBody.innerHTML = "";
        members.forEach(member => {
          const tr = document.createElement("tr");

          // MemberID
          const tdId = document.createElement("td");
          tdId.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdId.innerText = member.MemberID;
          tr.appendChild(tdId);

          // Name
          const tdName = document.createElement("td");
          tdName.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdName.innerText = member.Name || "-";
          tr.appendChild(tdName);

          // Email
          const tdEmail = document.createElement("td");
          tdEmail.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdEmail.innerText = member.Email || "-";
          tr.appendChild(tdEmail);

          // Phone
          const tdPhone = document.createElement("td");
          tdPhone.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdPhone.innerText = member.Phone || "-";
          tr.appendChild(tdPhone);

          // Points
          const tdPoints = document.createElement("td");
          tdPoints.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdPoints.innerText = (parseInt(member.PointsBalance, 10) || 0).toLocaleString();
          tr.appendChild(tdPoints);

          // Tier
          const tdTier = document.createElement("td");
          tdTier.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdTier.innerText = member.MemberTier || "-";
          tr.appendChild(tdTier);

          // Status
          const tdStatus = document.createElement("td");
          tdStatus.className = "px-6 py-4 whitespace-nowrap text-sm text-gray-800";
          tdStatus.innerText = member.Status || "-";
          tr.appendChild(tdStatus);

          // Actions
          const tdActions = document.createElement("td");
          tdActions.className = "px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2";

          // Edit button
          const editBtn = document.createElement("button");
          editBtn.className = "text-blue-600 hover:text-blue-800";
          editBtn.innerText = "แก้ไข";
          editBtn.addEventListener("click", () => openEditModal(member));
          tdActions.appendChild(editBtn);

          // Delete button
          const deleteBtn = document.createElement("button");
          deleteBtn.className = "text-red-600 hover:text-red-800";
          deleteBtn.innerText = "ลบ";
          deleteBtn.addEventListener("click", () => confirmDelete(member.MemberID));
          tdActions.appendChild(deleteBtn);

          tr.appendChild(tdActions);
          membersTableBody.appendChild(tr);
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถโหลดสมาชิกได้",
          text: res.message || "กรุณาลองใหม่ภายหลัง",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("Error loading members:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // Open modal for adding a new member
  function openAddModal() {
    editMode = false;
    editMemberId = null;
    modalTitle.innerText = "เพิ่มสมาชิกใหม่";
    inputLineUserID.value = "";
    inputName.value = "";
    inputEmail.value = "";
    inputPhone.value = "";
    inputAddress.value = "";
    memberModal.classList.remove("hidden");
  }

  // Open modal for editing an existing member
  function openEditModal(member) {
    editMode = true;
    editMemberId = member.MemberID;
    modalTitle.innerText = "แก้ไขข้อมูลสมาชิก";
    inputLineUserID.value = member.LineUserID || "";
    inputName.value = member.Name || "";
    inputEmail.value = member.Email || "";
    inputPhone.value = member.Phone || "";
    inputAddress.value = member.Address || "";
    memberModal.classList.remove("hidden");
  }

  // Close the modal
  function closeModal() {
    memberModal.classList.add("hidden");
  }

  // Save member (create or update)
  async function saveMember() {
    const lineUserId = inputLineUserID.value.trim();
    const name = inputName.value.trim();
    const email = inputEmail.value.trim();
    const phone = inputPhone.value.trim();
    const address = inputAddress.value.trim();

    if (!lineUserId || !name) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    if (editMode) {
      // Update existing member
      try {
        const res = await apiPost("updateMember", {
          memberId: editMemberId,
          lineUserId: lineUserId,
          name: name,
          email: email,
          phone: phone,
          address: address
        });
        if (res.status === "success") {
          Swal.fire({
            icon: "success",
            title: "อัปเดตข้อมูลสมาชิกสำเร็จ",
            confirmButtonText: "ตกลง"
          });
          closeModal();
          await loadMembers();
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: res.message || "ไม่สามารถอัปเดตข้อมูลได้",
            confirmButtonText: "ตกลง"
          });
        }
      } catch (err) {
        console.error("updateMember error:", err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
          confirmButtonText: "ตกลง"
        });
      }
    } else {
      // Create new member
      try {
        const res = await apiPost("createMember", {
          lineUserId: lineUserId,
          name: name,
          email: email,
          phone: phone,
          address: address
        });
        if (res.status === "success") {
          Swal.fire({
            icon: "success",
            title: "สร้างสมาชิกใหม่สำเร็จ",
            confirmButtonText: "ตกลง"
          });
          closeModal();
          await loadMembers();
        } else {
          Swal.fire({
            icon: "error",
            title: "เกิดข้อผิดพลาด",
            text: res.message || "ไม่สามารถสร้างสมาชิกใหม่ได้",
            confirmButtonText: "ตกลง"
          });
        }
      } catch (err) {
        console.error("createMember error:", err);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
          confirmButtonText: "ตกลง"
        });
      }
    }
  }

  // Confirm and delete a member
  async function confirmDelete(memberId) {
    const { isConfirmed } = await Swal.fire({
      title: `ลบสมาชิก ${memberId} ?`,
      text: "การลบสมาชิกจะไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบเลย",
      cancelButtonText: "ยกเลิก"
    });
    if (!isConfirmed) return;

    try {
      const res = await apiPost("deleteMember", { memberId: memberId });
      if (res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "ลบสมาชิกสำเร็จ",
          confirmButtonText: "ตกลง"
        });
        await loadMembers();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res.message || "ไม่สามารถลบสมาชิกได้",
          confirmButtonText: "ตกลง"
        });
      }
    } catch (err) {
      console.error("deleteMember error:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง"
      });
    }
  }

  // Event listeners
  addMemberButton.addEventListener("click", openAddModal);
  cancelMemberButton.addEventListener("click", closeModal);
  saveMemberButton.addEventListener("click", saveMember);

  logoutButton.addEventListener("click", () => {
    window.location.href = "login.html";
  });

  // Initial load
  loadMembers();
});
