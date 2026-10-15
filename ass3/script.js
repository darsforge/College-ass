(function () {
  var SUBJECTS = ["Maths", "Science", "English", "Social Studies", "Hindi"];
  var MAX = 100, PASS_MARK = 35, KEY = "srms-students-v1";
  var students = load();
  var editingId = null;
  var clearArmed = false, clearTimer = null;

  var $ = function (id) { return document.getElementById(id); };
  var form = $("form"), nameEl = $("name"), rollEl = $("roll"), errEl = $("error");

  /* ---------- storage (guarded: may be unavailable) ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(students)); } catch (e) { /* ignore */ }
  }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function round2(n) { return Math.round(n * 100) / 100; }
  function gradeFor(p) { return p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B+" : p >= 60 ? "B" : p >= 50 ? "C" : "D"; }

  function calc(s) {
    var total = s.marks.reduce(function (a, b) { return a + b; }, 0);
    var pct = total / (SUBJECTS.length * MAX) * 100;
    var passed = s.marks.every(function (m) { return m >= PASS_MARK; });
    return { total: round2(total), pct: round2(pct), passed: passed, grade: passed ? gradeFor(pct) : "F" };
  }

  /* ---------- build form inputs and table header ---------- */
  var grid = $("marksGrid");
  SUBJECTS.forEach(function (sub, i) {
    var d = document.createElement("div");
    d.className = "field";
    d.innerHTML = '<label for="m' + i + '">' + esc(sub) + '</label>' +
      '<input type="number" id="m' + i + '" min="0" max="' + MAX + '" step="any" inputmode="decimal" placeholder="0">';
    grid.appendChild(d);
    d.querySelector("input").addEventListener("input", updateLive);
  });
  $("thead").innerHTML =
    '<th class="num">Rank</th><th>Roll no.</th><th>Name</th>' +
    SUBJECTS.map(function (s) { return '<th class="num">' + esc(s) + '</th>'; }).join("") +
    '<th class="num">Total</th><th class="num">Percentage</th><th>Grade</th><th>Result</th><th><span class="sr">Actions</span></th>';

  function readMarks() {
    return SUBJECTS.map(function (_, i) { return $("m" + i).value.trim(); });
  }

  function updateLive() {
    var vals = readMarks().map(function (v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; });
    var total = vals.reduce(function (a, b) { return a + b; }, 0);
    var pct = total / (SUBJECTS.length * MAX) * 100;
    $("live").innerHTML = 'Total <strong>' + round2(total) + '</strong> of ' + (SUBJECTS.length * MAX) +
      ', <strong>' + pct.toFixed(2) + '%</strong>';
  }

  /* ---------- validation ---------- */
  function validate() {
    var name = nameEl.value.trim().replace(/\s+/g, " ");
    var roll = rollEl.value.trim();
    if (!name) return { error: "Enter the student's name.", field: nameEl };
    if (!/^[\p{L}][\p{L}\s.'\-]*$/u.test(name)) return { error: "Name can only contain letters, spaces, dots, hyphens and apostrophes.", field: nameEl };
    if (!roll) return { error: "Enter a roll number.", field: rollEl };
    var dup = students.some(function (s) { return s.id !== editingId && s.roll.toLowerCase() === roll.toLowerCase(); });
    if (dup) return { error: "Roll number " + roll + " already exists. Use a different one.", field: rollEl };
    var raw = readMarks(), marks = [];
    for (var i = 0; i < raw.length; i++) {
      if (raw[i] === "") return { error: "Enter marks for " + SUBJECTS[i] + ".", field: $("m" + i) };
      var n = Number(raw[i]);
      if (!isFinite(n) || n < 0 || n > MAX) return { error: SUBJECTS[i] + " marks must be between 0 and " + MAX + ".", field: $("m" + i) };
      marks.push(n);
    }
    return { name: name, roll: roll, marks: marks };
  }

  /* ---------- form actions ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var r = validate();
    if (r.error) { errEl.textContent = r.error; r.field.focus(); return; }
    errEl.textContent = "";
    if (editingId) {
      students = students.map(function (s) {
        return s.id === editingId ? { id: s.id, name: r.name, roll: r.roll, marks: r.marks } : s;
      });
    } else {
      students.push({ id: uid(), name: r.name, roll: r.roll, marks: r.marks });
    }
    save();
    stopEditing();
    render();
    nameEl.focus();
  });

  function clearForm() {
    form.reset();
    errEl.textContent = "";
    updateLive();
  }
  function stopEditing() {
    editingId = null;
    $("formTitle").textContent = "Add student";
    $("submitBtn").textContent = "Add student";
    $("cancelBtn").hidden = true;
    clearForm();
  }
  $("resetBtn").addEventListener("click", function () { clearForm(); nameEl.focus(); });
  $("cancelBtn").addEventListener("click", stopEditing);

  function startEditing(id) {
    var s = students.find(function (x) { return x.id === id; });
    if (!s) return;
    editingId = id;
    nameEl.value = s.name;
    rollEl.value = s.roll;
    s.marks.forEach(function (m, i) { $("m" + i).value = m; });
    $("formTitle").textContent = "Edit student";
    $("submitBtn").textContent = "Update student";
    $("cancelBtn").hidden = false;
    errEl.textContent = "";
    updateLive();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    nameEl.focus();
  }

  /* ---------- table actions ---------- */
  $("tbody").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-act]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    if (btn.getAttribute("data-act") === "edit") startEditing(id);
    if (btn.getAttribute("data-act") === "delete") {
      students = students.filter(function (s) { return s.id !== id; });
      if (editingId === id) stopEditing();
      save(); render();
    }
  });
  $("search").addEventListener("input", render);

  $("clearAll").addEventListener("click", function () {
    var btn = $("clearAll");
    if (!students.length) return;
    if (!clearArmed) {
      clearArmed = true;
      btn.textContent = "Click again to confirm";
      clearTimeout(clearTimer);
      clearTimer = setTimeout(disarm, 3500);
      return;
    }
    disarm();
    students = [];
    save(); stopEditing(); render();
  });
  function disarm() {
    clearArmed = false;
    $("clearAll").textContent = "Delete all";
  }

  function addSamples() {
    var samples = [
      ["Aarav Patil", "101", [88, 92, 79, 85, 90]],
      ["Isha Deshmukh", "102", [95, 97, 91, 89, 94]],
      ["Rohan Jadhav", "103", [67, 58, 72, 64, 70]],
      ["Sneha Kulkarni", "104", [82, 76, 88, 80, 77]],
      ["Vikram Shinde", "105", [45, 32, 55, 48, 60]],
      ["Meera Pawar", "106", [91, 85, 93, 87, 90]]
    ];
    samples.forEach(function (s) {
      if (!students.some(function (x) { return x.roll === s[1]; })) {
        students.push({ id: uid(), name: s[0], roll: s[1], marks: s[2] });
      }
    });
    save(); render();
  }

  /* ---------- render ---------- */
  function render() {
    // derive + rank
    var rows = students.map(function (s) { var c = calc(s); return Object.assign({}, s, c); });
    rows.forEach(function (r) {
      r.rank = 1 + rows.filter(function (o) { return o.total > r.total; }).length;
    });
    rows.sort(function (a, b) {
      return a.rank - b.rank || a.roll.localeCompare(b.roll, undefined, { numeric: true });
    });

    // summary
    $("sCount").textContent = rows.length;
    if (rows.length) {
      var avg = rows.reduce(function (a, r) { return a + r.pct; }, 0) / rows.length;
      var passed = rows.filter(function (r) { return r.passed; }).length;
      $("sAvg").textContent = avg.toFixed(2) + "%";
      $("sPass").textContent = passed + " of " + rows.length;
      $("sHigh").textContent = Math.max.apply(null, rows.map(function (r) { return r.pct; })).toFixed(2) + "%";
    } else {
      $("sAvg").textContent = $("sPass").textContent = $("sHigh").textContent = "–";
    }

    // topper(s)
    var tEl = $("topper");
    if (!rows.length) {
      tEl.innerHTML = '<div class="topper empty"><strong>No topper yet.</strong> Add a student and the highest scorer will appear here.</div>';
    } else {
      var top = rows.filter(function (r) { return r.rank === 1; });
      var t = top[0];
      var title = top.length > 1 ? top.map(function (x) { return esc(x.name); }).join(" and ") : esc(t.name);
      var sub = top.length > 1
        ? "Joint toppers with equal totals"
        : "Roll no. " + esc(t.roll) + ", grade " + t.grade;
      tEl.innerHTML =
        '<div class="topper">' +
          '<div class="seal" aria-hidden="true"><div><b>1</b><span>' + (top.length > 1 ? "joint" : "topper") + '</span></div></div>' +
          '<div><h3>' + title + '</h3><p>' + sub + '</p></div>' +
          '<div class="score"><div class="pct">' + t.pct.toFixed(2) + '%</div><small>' + t.total + ' of ' + (SUBJECTS.length * MAX) + ' marks</small></div>' +
        '</div>';
    }

    // table (with search filter)
    var q = $("search").value.trim().toLowerCase();
    var shown = rows.filter(function (r) {
      return !q || r.name.toLowerCase().indexOf(q) > -1 || r.roll.toLowerCase().indexOf(q) > -1;
    });
    $("tbody").innerHTML = shown.map(function (r) {
      var marksCells = r.marks.map(function (m) {
        return '<td class="num' + (m < PASS_MARK ? ' low' : '') + '">' + m + '</td>';
      }).join("");
      return '<tr' + (r.rank === 1 ? ' class="is-topper"' : '') + '>' +
        '<td class="num">' + r.rank + '</td>' +
        '<td>' + esc(r.roll) + '</td>' +
        '<td class="name">' + esc(r.name) + '</td>' +
        marksCells +
        '<td class="num"><strong>' + r.total + '</strong></td>' +
        '<td class="num">' + r.pct.toFixed(2) + '%</td>' +
        '<td>' + r.grade + '</td>' +
        '<td><span class="tag ' + (r.passed ? 'pass' : 'fail') + '">' + (r.passed ? 'Pass' : 'Fail') + '</span></td>' +
        '<td><div class="actions">' +
          '<button type="button" class="small" data-act="edit" data-id="' + r.id + '" aria-label="Edit ' + esc(r.name) + '">Edit</button>' +
          '<button type="button" class="small danger" data-act="delete" data-id="' + r.id + '" aria-label="Delete ' + esc(r.name) + '">Delete</button>' +
        '</div></td></tr>';
    }).join("");

    var none = $("none");
    if (!shown.length) {
      none.hidden = false;
      if (!rows.length) {
        none.innerHTML = '<p>No students yet. Add one using the form, or start with a few examples.</p><button type="button" class="primary" id="sampleBtn">Add sample students</button>';
        $("sampleBtn").addEventListener("click", addSamples);
      } else {
        none.innerHTML = '<p>No student matches "' + esc($("search").value.trim()) + '". Check the spelling or roll number.</p>';
      }
    } else {
      none.hidden = true;
      none.innerHTML = "";
    }
  }

  updateLive();
  render();
})();
