(function() {
  const mnTags = [...document.querySelectorAll('.solve .leftCol mn')];
  const moTags = [...document.querySelectorAll('.solve .leftCol mo')];
  const questionText = document.querySelector('.solve .leftCol').textContent;
  
  // Detekce typu veličiny
  const hasDB = /dB/i.test(questionText);
  const isVoltageOrCurrent = /proud|napětí|voltage|current/i.test(questionText);
  const multiplier = isVoltageOrCurrent ? 20 : 10;
  console.log("Typ:", isVoltageOrCurrent ? "proud/napětí (×20)" : "výkon (×10)");

  // Najdi hodnotu - pozor na zlomek v otázce
  let value = null;
  const hasMinusSign = moTags.some(e => ['−','-','–'].includes(e.textContent.trim()));

  // Zkus mfrac v otázce (zlomek jako 1/40000)
  const mfracQ = document.querySelector('.solve .leftCol mfrac');
  if (mfracQ) {
    const nums = mfracQ.querySelectorAll('mn');
    if (nums.length >= 2) {
      value = parseFloat(nums[0].textContent) / parseFloat(nums[1].textContent);
      console.log("Zlomek v otázce:", nums[0].textContent, "/", nums[1].textContent, "=", value);
    }
  } else {
    mnTags.forEach(el => { const v = parseFloat(el.textContent); if (!isNaN(v)) value = v; });
    if (hasMinusSign) value = -value;
  }

  if (value === null) { console.error("Hodnota nenalezena!"); return; }
  console.log("Hodnota A =", value, hasDB ? "dB" : "absolutní");

  function parseAnswerValue(btn) {
    const mfrac = btn.querySelector('mfrac');
    if (mfrac) {
      const nums = mfrac.querySelectorAll('mn');
      if (nums.length >= 2) return parseFloat(nums[0].textContent) / parseFloat(nums[1].textContent);
    }
    const mnInBtn = btn.querySelectorAll('mn');
    if (mnInBtn.length === 1) return parseFloat(mnInBtn[0].textContent);
    const text = btn.innerText.replace(/\s+/g, ' ').trim();
    const multiLine = text.match(/^1\s+([\d]+)/);
    if (multiLine) return 1 / parseFloat(multiLine[1]);
    const simple = text.match(/^([-\d.]+)/);
    if (simple) return parseFloat(simple[1]);
    return null;
  }

  const answers = document.querySelectorAll('.answer');
  let bestAnswer = null;
  let bestDiff = Infinity;

  if (hasDB) {
    // dB → absolutní
    const A_abs = Math.pow(10, value / multiplier);
    console.log("Hledám absolutní:", A_abs);
    answers.forEach(btn => {
      const ansVal = parseAnswerValue(btn);
      console.log(" ", btn.innerText.trim(), "→", ansVal);
      if (ansVal !== null) {
        const diff = Math.abs(ansVal - A_abs);
        if (diff < bestDiff) { bestDiff = diff; bestAnswer = btn; }
      }
    });
  } else {
    // absolutní → dB
    const A_dB = multiplier * Math.log10(value);
    console.log("Hledám dB:", A_dB.toFixed(2));
    answers.forEach(btn => {
      const text = btn.innerText.trim();
      const numMatch = text.match(/([-\d.]+)\s*dB/i);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        const diff = Math.abs(val - A_dB);
        console.log(" ", text, "→ diff:", diff.toFixed(2));
        if (diff < bestDiff) { bestDiff = diff; bestAnswer = btn; }
      }
    });
  }

  if (bestAnswer) {
    console.log("✅ Klikám na:", bestAnswer.innerText.trim());
    bestAnswer.click();
  } else {
    console.error("Odpověď nenalezena!");
  }
})();
