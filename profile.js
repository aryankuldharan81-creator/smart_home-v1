/* Profile page */
document.addEventListener("DOMContentLoaded", () => {
  function fill() {
    const user = Store.currentUser();
    document.getElementById("profileAvatar").textContent = user.name.charAt(0).toUpperCase();
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;
    document.getElementById("profileSince").textContent = "Member since " + fmtLongDate(new Date(user.createdAt));
    document.getElementById("name").value = user.name;
    document.getElementById("emailDisabled").value = user.email;
    document.getElementById("userAvatar").textContent = user.name.charAt(0).toUpperCase();
    document.getElementById("userNameLabel").textContent = user.name;
  }
  fill();

  document.getElementById("nameForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const res = Store.updateName(document.getElementById("name").value);
    showFlash(res.message, res.success ? "success" : "danger");
    if (res.success) fill();
    window.scrollTo(0, 0);
  });

  document.getElementById("passwordForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const res = Store.changePassword(
      document.getElementById("current_password").value,
      document.getElementById("new_password").value,
      document.getElementById("confirm_new_password").value
    );
    showFlash(res.message, res.success ? "success" : "danger");
    if (res.success) e.target.reset();
    window.scrollTo(0, 0);
  });
});
