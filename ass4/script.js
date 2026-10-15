(function () {
  "use strict";

  /* ---------- Settings ---------- */
  var STORAGE_KEY = "erf-employees-v1";
  var DEPT_COLORS = {
    "Engineering": "#2F6FED",
    "Human Resources": "#C2417B",
    "Finance": "#1B7F4B",
    "Marketing": "#D9701A",
    "Sales": "#7A4CC2",
    "Operations": "#0E8A8A",
    "IT Support": "#5A6B7A"
  };
  var DEFAULT_COLOR = "#5A6B7A";

  // Password rules (also drive the checklist and the strength meter)
  var PASSWORD_RULES = [
    { id: "len",   label: "8 or more characters",    test: function (p) { return p.length >= 8; } },
    { id: "upper", label: "an uppercase letter",     test: function (p) { return /[A-Z]/.test(p); } },
    { id: "lower", label: "a lowercase letter",      test: function (p) { return /[a-z]/.test(p); } },
    { id: "num",   label: "a number",                test: function (p) { return /\d/.test(p); } },
    { id: "sym",   label: "a special character",     test: function (p) { return /[^A-Za-z0-9\s]/.test(p); } }
  ];

  /* ---------- Elements ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var form = $("regForm");
  var fields = ["name", "email", "phone", "department", "password", "confirm"];
  var touched = {};
  var employees = loadEmployees();

  /* ---------- Storage (guarded: may be unavailable) ---------- */
  // Only non-sensitive details are kept. Passwords are never stored.
  function loadEmployees() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }
  function saveEmployees() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(employees)); } catch (e) { /* ignore */ }
  }

  /* ---------- Cleaning helpers ---------- */
  function cleanName(v) { return v.trim().replace(/\s+/g, " "); }

  // Returns the 10-digit number, or "" if the input is not a valid Indian mobile number.
  function normalizePhone(v) {
    var s = v.replace(/[\s\-()]/g, "");
    if (s.indexOf("+91") === 0) s = s.slice(3);
    else if (/^91\d{10}$/.test(s)) s = s.slice(2);
    else if (/^0\d{10}$/.test(s)) s = s.slice(1);
    return /^[6-9]\d{9}$/.test(s) ? s : "";
  }

  /* ---------- Validators: return an error message, or "" when valid ---------- */
  var validators = {
    name: function (raw) {
      var v = cleanName(raw);
      if (!v) return "Enter the employee's full name.";
      if (v.length < 2 || v.length > 50) return "Name must be between 2 and 50 characters.";
      if (!/^\p{L}[\p{L} .'\-]*$/u.test(v)) return "Use letters, spaces, dots, hyphens or apostrophes only.";
      if (v.indexOf(" ") === -1) return "Enter both first and last name.";
      return "";
    },
    email: function (raw) {
      var v = raw.trim();
      if (!v) return "Enter a work email address.";
      if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/.test(v) || /\.\./.test(v)) {
        return "Enter a valid email, like name@company.com.";
      }
      return "";
    },
    phone: function (raw) {
      var v = raw.trim();
      if (!v) return "Enter a phone number.";
      if (/[^\d\s\-+()]/.test(v)) return "Phone number can only contain digits, spaces, + and -.";
      if (!normalizePhone(v)) return "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";
      return "";
    },
    department: function (v) {
      return v ? "" : "Select a department.";
    },
    password: function (v) {
      if (!v) return "Create a password.";
      if (/\s/.test(v)) return "Password cannot contain spaces.";
      var missing = PASSWORD_RULES.filter(function (r) { return !r.test(v); })
                                  .map(function (r) { return r.label; });
      return missing.length ? "Password still needs " + missing.join(", ") + "." : "";
    },
    confirm: function (v) {
      if (!v) return "Re-enter the password to confirm it.";
      if (v !== $("password").value) return "Passwords do not match.";
      return "";
    }
  };

  /* ---------- Show / clear errors ---------- */
  function showField(id, error) {
    var input = $(id);
    var wrap = input.closest(".field");
    $(id + "-error").textContent = error;
    wrap.classList.toggle("is-invalid", !!error);
    wrap.classList.toggle("is-valid", !error && !!input.value);
    if (error) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function validateField(id) {
    var error = validators[id]($(id).value);
    showField(id, error);
    return error;
  }

  /* ---------- Password checklist and strength meter ---------- */
  function updatePasswordUI() {
    var p = $("password").value;
    var score = 0;
    PASSWORD_RULES.forEach(function (r) {
      var ok = r.test(p);
      if (ok) score++;
      var li = document.querySelector('#rules [data-rule="' + r.id + '"]');
      li.classList.toggle("ok", ok);
      li.querySelector(".mark").textContent = ok ? "✓" : "○";
    });

    var labels = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];
    var colors = ["#B3261E", "#B3261E", "#D9701A", "#C79A00", "#4C9A2A", "#1B7F4B"];
    var fill = $("strengthFill");
    fill.style.width = (p ? score / PASSWORD_RULES.length * 100 : 0) + "%";
    fill.style.backgroundColor = colors[score];
    $("strengthLabel").innerHTML = p ? "Strength: <b>" + labels[score] + "</b>" : "Password strength";
  }

  /* ---------- Live badge preview ---------- */
  function initials(name) {
    var parts = cleanName(name).split(" ").filter(Boolean);
    if (!parts.length) return "?";
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
  }

  function setBadgeText(id, value, placeholder) {
    var el = $(id);
    el.textContent = value || placeholder;
    el.classList.toggle("ph", !value);
  }

  function updateBadge() {
    var name = cleanName($("name").value);
    var dept = $("department").value;
    var email = $("email").value.trim();

    setBadgeText("badgeName", name, "Your name");
    setBadgeText("badgeDept", dept, "Department");
    setBadgeText("badgeEmail", email, "name@company.com");
    $("badgeAvatar").textContent = initials(name);

    var color = DEPT_COLORS[dept] || DEFAULT_COLOR;
    document.documentElement.style.setProperty("--dept", color);
  }

  /* ---------- Events: live feedback ---------- */
  fields.forEach(function (id) {
    var el = $(id);
    var evt = id === "department" ? "change" : "input";

    el.addEventListener(evt, function () {
      if (id === "phone") {
        // keep only characters a phone number can contain
        el.value = el.value.replace(/[^\d\s\-+()]/g, "");
      }
      if (id === "password") {
        updatePasswordUI();
        if (touched.confirm || $("confirm").value) validateField("confirm");
      }
      if (touched[id]) validateField(id);
      updateBadge();
    });

    el.addEventListener("blur", function () {
      touched[id] = true;
      validateField(id);
    });
  });

  // Show / hide password buttons
  Array.prototype.forEach.call(document.querySelectorAll(".toggle"), function (btn) {
    btn.addEventListener("click", function () {
      var input = $(btn.getAttribute("data-target"));
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
      btn.setAttribute("aria-label", (show ? "Hide " : "Show ") + (input.id === "confirm" ? "confirm password" : "password"));
    });
  });

  /* ---------- Submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var status = $("formStatus");
    status.textContent = "";

    var firstBad = null, count = 0;
    fields.forEach(function (id) {
      touched[id] = true;
      if (validateField(id)) {
        count++;
        if (!firstBad) firstBad = $(id);
      }
    });

    if (firstBad) {
      status.textContent = count === 1
        ? "Fix the highlighted field to continue."
        : "Fix the " + count + " highlighted fields to continue.";
      firstBad.focus();
      return;
    }

    // Duplicate check (same email cannot register twice)
    var email = $("email").value.trim().toLowerCase();
    if (employees.some(function (emp) { return emp.email === email; })) {
      showField("email", "This email is already registered. Use a different one.");
      status.textContent = "Fix the highlighted field to continue.";
      $("email").focus();
      return;
    }

    var record = {
      id: "EMP-" + String(employees.length + 1).padStart(4, "0"),
      name: cleanName($("name").value),
      email: email,
      phone: normalizePhone($("phone").value),
      department: $("department").value
    };
    employees.push(record);
    saveEmployees();
    showSuccess(record);
  });

  function showSuccess(r) {
    var rows = [
      ["Employee ID", r.id],
      ["Name", r.name],
      ["Email", r.email],
      ["Phone", "+91 " + r.phone.slice(0, 5) + " " + r.phone.slice(5)],
      ["Department", r.department]
    ];
    $("details").innerHTML = rows.map(function (row) {
      return "<div><dt>" + row[0] + "</dt><dd></dd></div>";
    }).join("");
    // textContent keeps user input from being interpreted as HTML
    Array.prototype.forEach.call($("details").querySelectorAll("dd"), function (dd, i) {
      dd.textContent = rows[i][1];
    });

    setBadgeText("badgeId", r.id, "Assigned on registration");
    $("formPanel").hidden = true;
    $("successPanel").hidden = false;
    $("successTitle").focus();
  }

  /* ---------- Reset / register another ---------- */
  function resetAll() {
    form.reset();
    touched = {};
    fields.forEach(function (id) { showField(id, ""); $(id).closest(".field").classList.remove("is-valid"); });
    $("formStatus").textContent = "";
    // return any visible password fields to hidden
    Array.prototype.forEach.call(document.querySelectorAll(".toggle"), function (btn) {
      var input = $(btn.getAttribute("data-target"));
      input.type = "password";
      btn.textContent = "Show";
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Show " + (input.id === "confirm" ? "confirm password" : "password"));
    });
    setBadgeText("badgeId", "", "Assigned on registration");
    updatePasswordUI();
    updateBadge();
  }

  $("resetBtn").addEventListener("click", function () { resetAll(); $("name").focus(); });
  $("againBtn").addEventListener("click", function () {
    resetAll();
    $("successPanel").hidden = true;
    $("formPanel").hidden = false;
    $("name").focus();
  });

  /* ---------- Initial state ---------- */
  updatePasswordUI();
  updateBadge();
  setBadgeText("badgeId", "", "Assigned on registration");
})();
