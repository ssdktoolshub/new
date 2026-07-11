// SSDK Age Calculator Tool Module
// Computes exact ages in years/months/days and parses countdowns to next birthday events.

import { SSDKTool } from "../core/sdk.js";
import { GlassComponents } from "../components/glass-components.js";

export default class AgeCalculator extends SSDKTool {
  constructor() {
    super();
  }

  async init(toolEngine) {
    this.engine = toolEngine;

    const inputsContainer = document.getElementById("tool-inputs-container");
    const optionsContainer = document.getElementById("tool-options-container");
    const outputsContainer = document.getElementById("tool-outputs-container");

    inputsContainer.innerHTML = "";
    optionsContainer.innerHTML = "";
    outputsContainer.innerHTML = "";

    // 1. Create Date of Birth Picker
    const dobPicker = GlassComponents.createInput(
      "dateBirth",
      "date",
      "",
      "Date of Birth",
      "",
      true
    );
    inputsContainer.appendChild(dobPicker);

    // 2. Create Target Date Picker
    const today = new Date().toISOString().split("T")[0];
    const targetPicker = GlassComponents.createInput(
      "dateTarget",
      "date",
      "",
      "Calculate Age At Date",
      today,
      true
    );
    inputsContainer.appendChild(targetPicker);

    // 3. Create placeholder for countdown and results breakdown in options
    const countdownPanel = `
      <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-top: 15px; text-align: center;">
        <p style="font-size: 0.85rem; margin: 0; color: var(--muted);">
          🎂 Next Birthday Countdown: <strong id="birthdayCountdown" style="color: var(--accent);">-</strong>
        </p>
      </div>
    `;
    optionsContainer.insertAdjacentHTML("beforeend", countdownPanel);

    // 4. Create standard output result
    const outputArea = GlassComponents.createTextarea(
      "toolOutput",
      "Configure your birth date to calculate exact age statistics...",
      "Age Calculations & Breakdowns Report"
    );
    outputsContainer.appendChild(outputArea);
    document.getElementById("toolOutput").readOnly = true;
  }

  async run(toolEngine) {
    const dobInput = this.getInputValue("dateBirth");
    const targetInput = this.getInputValue("dateTarget");

    if (!dobInput) {
      this.showStatus("❌ Please select your Date of Birth first.", true);
      return;
    }

    const dob = new Date(dobInput);
    const target = new Date(targetInput);

    if (dob > target) {
      this.showStatus("❌ Date of Birth cannot be after the calculation target date.", true);
      return;
    }

    this.showProgress(true, "Calculating age statistics...");
    await new Promise(resolve => setTimeout(resolve, 400));

    // Calculate exact difference in Year, Month, Days
    let dobYear = dob.getFullYear();
    let dobMonth = dob.getMonth();
    let dobDate = dob.getDate();

    let targetYear = target.getFullYear();
    let targetMonth = target.getMonth();
    let targetDate = target.getDate();

    let years = targetYear - dobYear;
    let months = targetMonth - dobMonth;
    let days = targetDate - dobDate;

    if (days < 0) {
      months--;
      const prevMonth = new Date(targetYear, targetMonth, 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // Next Birthday Countdown
    let nextBday = new Date(targetYear, dobMonth, dobDate);
    if (nextBday < target) {
      nextBday.setFullYear(targetYear + 1);
    }
    
    let bdayDiffMs = nextBday.getTime() - target.getTime();
    let bdayDiffDays = Math.ceil(bdayDiffMs / (1000 * 60 * 60 * 24));
    
    let bdayResult = "";
    if (bdayDiffDays === 365 || bdayDiffDays === 366 || bdayDiffDays === 0) {
      bdayResult = "Happy Birthday! 🎈🍰";
    } else {
      let bdayMonths = nextBday.getMonth() - targetMonth;
      let bdayDays = nextBday.getDate() - targetDate;
      if (bdayDays < 0) {
        bdayMonths--;
        const prevMonth = new Date(nextBday.getFullYear(), nextBday.getMonth(), 0);
        bdayDays += prevMonth.getDate();
      }
      if (bdayMonths < 0) {
        bdayMonths += 12;
      }
      
      if (bdayMonths > 0) bdayResult += `${bdayMonths} Month${bdayMonths > 1 ? 's' : ''} `;
      if (bdayDays > 0) bdayResult += `${bdayDays} Day${bdayDays > 1 ? 's' : ''}`;
    }
    
    const bdayEl = document.getElementById("birthdayCountdown");
    if (bdayEl) bdayEl.textContent = bdayResult.trim() || "-";

    // Complete breakdown calculations
    const diffMs = target.getTime() - dob.getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalWeeks = Math.floor(totalDays / 7);
    
    let totalMonths = (targetYear - dobYear) * 12 + (targetMonth - dobMonth);
    if (targetDate < dobDate) {
      totalMonths--;
    }
    if (totalMonths < 0) totalMonths = 0;

    let mainResultText = "";
    if (years > 0) mainResultText += `${years} Year${years > 1 ? 's' : ''} `;
    if (months > 0) mainResultText += `${months} Month${months > 1 ? 's' : ''} `;
    if (days > 0) mainResultText += `${days} Day${days > 1 ? 's' : ''}`;
    if (years === 0 && months === 0 && days === 0) mainResultText = "Just Born! 🎉";

    const report = `--- AGE CALCULATIONS REPORT ---
Main Age Result: ${mainResultText.trim()}

Breakdown Statistics:
• Total Months  : ${totalMonths.toLocaleString()}
• Total Weeks   : ${totalWeeks.toLocaleString()}
• Total Days    : ${totalDays.toLocaleString()}
• Total Hours   : ${totalHours.toLocaleString()}
• Total Minutes : ${totalMinutes.toLocaleString()}
• Total Seconds : ${totalSeconds.toLocaleString()}
`;

    this.setOutputValue(report, "toolOutput");
    this.showProgress(false);
    this.showStatus("✅ Age statistics computed successfully!");
  }
}
