(async () => {
    console.log("%c--- Startuji nouzový opravný skript ---", "color: orange; font-weight: bold;");

    const findValue = (regex) => {
        const html = document.body.innerHTML;
        const match = html.match(regex);
        return match ? parseFloat(match[1].replace(',', '.')) : null;
    };

    const solve = async () => {
        // Hledání hodnot v syrovém HTML (řeší problém s MathJax)
        const fs = findValue(/f_{s}\s*=\s*([\d.]+)/);
        const b = findValue(/b\s*=\s*(\d+)/);
        const nCH = findValue(/n_{CH}\s*=\s*(\d+)/);

        if (fs !== null && b !== null && nCH !== null) {
            // Výpočet: (kHz * 1000 * b * nCH) / 1 000 000
            const bitrate = (fs * b * nCH) / 1000;
            const vysledek = parseFloat(bitrate.toFixed(3));
            const formatVysledek = vysledek.toString().replace('.', ',') + " Mbps";

            console.log(`%cNAJEDNO: fs=${fs}, b=${b}, nCH=${nCH} -> ${formatVysledek}`, "color: lime;");

            const input = document.querySelector('input.answer');
            if (input) {
                input.value = formatVysledek;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));

                await new Promise(r => setTimeout(r, 1000));

                const btn = document.querySelector('.checkAnswer');
                if (btn) {
                    btn.click();
                }
            }
        } else {
            console.error("Parametry stále nenalezeny. Zkus stránku obnovit (F5) a vložit skript znovu.");
        }
    };

    // Spustí se 20x s pauzou 7 sekund
    for (let i = 0; i < 20; i++) {
        await solve();
        await new Promise(r => setTimeout(r, 7000));
    }
})();
