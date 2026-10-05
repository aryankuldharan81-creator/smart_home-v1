/* Login + Register pages */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const res = Store.login(
        document.getElementById("email").value,
        document.getElementById("password").value,
        loginForm.querySelector('[name="remember"]').checked
      );
      if (res.success) {
        window.location.href = "dashboard.html";
      } else {
        showFlash(res.errors, "danger");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const pw = document.getElementById("password").value;
      const cpw = document.getElementById("confirm_password").value;
      const err = document.getElementById("matchError");
      if (pw !== cpw) {
        err.style.display = "block";
      } else {
        err.style.display = "none";
      }
      const res = Store.register(
        document.getElementById("name").value,
        document.getElementById("email").value,
        pw, cpw
      );
      if (res.success) {
        Store.flashSet("Account created successfully! Please log in.", "success");
        window.location.href = "login.html";
      } else {
        showFlash(res.errors, "danger");
      }
    });
  }
});
