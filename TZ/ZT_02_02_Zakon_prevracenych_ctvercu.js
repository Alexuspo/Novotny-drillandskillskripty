(async () => {
    console.log("%c--- Startuji skript: zákon převrácených čtverců (univerzální) ---", "color: orange; font-weight: bold;");

    const html = document.body.innerHTML;
    const text = document.body.innerText || "";

    const parseCzNumber = (raw) => {
        if (!raw) {
            return null;
        }
        const normalized = raw
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, "")
            .replace(",", ".");
        const value = parseFloat(normalized);
        return Number.isFinite(value) ? value : null;
    };

    const findValue = (regex, source) => {
        const match = source.match(regex);
        return match ? parseCzNumber(match[1]) : null;
    };

    const findParam = (mathParam) => {
        const htmlRegex = new RegExp(`${mathParam.replace(/([{}])/g, "\\$1")}\\s*=\\s*([\\d\\s.,]+)`);
        const fromHtml = findValue(htmlRegex, html);
        if (fromHtml !== null) {
            return fromHtml;
        }

        const plainParam = mathParam.replace(/[_{}]/g, "");
        const textRegex = new RegExp(`${plainParam}\\s*=\\s*([\\d\\s.,]+)`, "i");
        return findValue(textRegex, text);
    };

    const hasParamInTask = (plainParam) => {
        const normalizedHtml = html.replace(/[_{}]/g, "");
        const re = new RegExp(`${plainParam}\\s*=`, "i");
        return re.test(text) || re.test(normalizedHtml);
    };

    const formatCzNumber = (num) => {
        const rounded = Math.round(num * 1000) / 1000;
        const fixed = rounded.toFixed(3).replace(/\.?0+$/, "");
        return fixed.replace(".", ",");
    };

    const formatAnswer = (value, unit) => `${formatCzNumber(value)} ${unit}`;

    const detectLevelUnit = () => {
        const normalizedText = text
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .toUpperCase();
        const normalizedHtml = html
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .toUpperCase();

        if (normalizedText.includes("DB SPL") || normalizedHtml.includes("DB SPL")) {
            return "dB SPL";
        }
        if (normalizedText.includes("DB SIL") || normalizedHtml.includes("DB SIL")) {
            return "dB SIL";
        }
        // Jazykový fallback podle typu veličiny v zadání
        if (normalizedText.includes("HLADINA AKUSTICKEHO TLAKU")) {
            return "dB SPL";
        }
        if (normalizedText.includes("HLADINA INTENZITY ZVUKU")) {
            return "dB SIL";
        }
        return "dB";
    };

    // Školní aproximace používaná v těchto úlohách:
    // každé +6 dB => poloviční vzdálenost, každé -6 dB => dvojnásobná vzdálenost.
    const distanceFromLevelDiff = (distance, levelDiffDb) => distance / Math.pow(2, levelDiffDb / 6);
    const levelFromDistances = (baseLevelDb, r1Value, r2Value) => baseLevelDb + 6 * (Math.log(r1Value / r2Value) / Math.log(2));

    const setAnswer = (textAnswer) => {
        const input = document.querySelector("input.answer");
        if (!input) {
            return false;
        }
        input.value = textAnswer;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
    };

    const clickConfirm = () => {
        const btn = document.querySelector(".checkAnswer");
        if (!btn) {
            return false;
        }
        btn.click();
        return true;
    };

    const getRightAnswerFromHint = () => {
        const hint = document.querySelector(".rightAnswer");
        if (!hint) {
            return null;
        }
        const hintText = hint.textContent || "";
        const match = hintText.match(/:\s*(.+)\s*$/);
        return match ? match[1].trim() : null;
    };

    const solve = async () => {
        const r1 = findParam("r_{1}");
        const r2 = findParam("r_{2}");
        const l1 = findParam("L_{1}");
        const l2 = findParam("L_{2}");
        const levelUnit = detectLevelUnit();

        let answer = null;
        let solvedWhat = null;

        // Použit je model 6 dB na dvojnásobek/polovinu vzdálenosti (podle trenažéru).
        if (r1 !== null && l1 !== null && l2 !== null && !hasParamInTask("r2")) {
            answer = formatAnswer(distanceFromLevelDiff(r1, l2 - l1), "m");
            solvedWhat = "r2";
        } else if (r2 !== null && l1 !== null && l2 !== null && !hasParamInTask("r1")) {
            answer = formatAnswer(r2 * Math.pow(2, (l2 - l1) / 6), "m");
            solvedWhat = "r1";
        } else if (r1 !== null && r2 !== null && l1 !== null && !hasParamInTask("L2")) {
            answer = formatAnswer(levelFromDistances(l1, r1, r2), levelUnit);
            solvedWhat = "L2";
        } else if (r1 !== null && r2 !== null && l2 !== null && !hasParamInTask("L1")) {
            answer = formatAnswer(l2 - 6 * (Math.log(r1 / r2) / Math.log(2)), levelUnit);
            solvedWhat = "L1";
        } else {
            // Nouzový fallback, když parser nepozná, co je neznámá veličina.
            if (r2 === null && r1 !== null && l1 !== null && l2 !== null) {
                answer = formatAnswer(distanceFromLevelDiff(r1, l2 - l1), "m");
                solvedWhat = "r2";
            } else if (r1 === null && r2 !== null && l1 !== null && l2 !== null) {
                answer = formatAnswer(r2 * Math.pow(2, (l2 - l1) / 6), "m");
                solvedWhat = "r1";
            } else if (l2 === null && r1 !== null && r2 !== null && l1 !== null) {
                answer = formatAnswer(levelFromDistances(l1, r1, r2), levelUnit);
                solvedWhat = "L2";
            } else if (l1 === null && r1 !== null && r2 !== null && l2 !== null) {
                answer = formatAnswer(l2 - 6 * (Math.log(r1 / r2) / Math.log(2)), levelUnit);
                solvedWhat = "L1";
            }
        }

        if (!answer) {
            console.error("Nepodařilo se určit neznámou veličinu. Zkus stránku obnovit (F5) a spusť skript znovu.");
            console.log({ r1, r2, l1, l2 });
            return;
        }

        console.log(`%cVypočteno (${solvedWhat}): ${answer}`, "color: lime;");

        if (!setAnswer(answer)) {
            console.error("Nenašel jsem vstupní pole pro odpověď.");
            return;
        }

        await new Promise((r) => setTimeout(r, 500));

        if (!clickConfirm()) {
            console.error("Nenašel jsem tlačítko Potvrdit.");
            return;
        }

        // Když server vrátí jiný výsledek, už nic automaticky neopravujeme.
        // Skript jen počká, aby šlo udělat screenshot a ručně to doladit.
        await new Promise((r) => setTimeout(r, 900));
        const rightAnswer = getRightAnswerFromHint();
        if (rightAnswer) {
            console.warn(`Skript vyhodnotil příklad jinak než server. Server uvádí: "${rightAnswer}".`);
            console.warn("Další automatické klikání je vypnuté. Pošli screenshot a opravíme to spolu.");
        }
    };

    await solve();
})();
