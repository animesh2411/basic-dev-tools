document.getElementById("readCronBtn").addEventListener("click", async () => {
  const cronExp = document.getElementById("cronExp").value.trim();
  const output = document.getElementById("cronResult");

  if (!cronExp) {
    alert("Please enter a cron expression!");
    return;
  }

  output.style.display = "block";
  output.innerHTML = "Cron Reading...";

  try {
    const cronRead = cronstrue.toString(cronExp, { use24HourTimeFormat: true });
    output.innerHTML = `✅ Cron result: ${cronRead}`;
  } catch (err) {
    output.innerHTML = "❌ Invalid cron expression! Please try again.";
  }
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("cronExp").value = "";
  document.getElementById("cronResult").style.display = "none";
});