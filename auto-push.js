const { exec } = require("child_process");

exec(`
  git add . &&
  git commit -m "Auto-update" &&
  git push origin main
`, (err, stdout, stderr) => {
  if (err) {
    console.error("❌ Git error:", stderr);
  } else {
    console.log("✅ Changes pushed to GitHub");
  }
});
