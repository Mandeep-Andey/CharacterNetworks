import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        
        console.log("Navigating to chapter 2...");
        const chapterLinks = await page.$$('a[href^="/Book"]');
        if (chapterLinks.length > 1) {
            await chapterLinks[1].click();
            await new Promise(r => setTimeout(r, 3000));
        }

        const lines = await page.$$eval('g.link-group line', lines => {
            return lines.map(l => ({
                className: l.getAttribute('class'),
                opacity: l.getAttribute('opacity'),
                stroke: l.getAttribute('stroke')
            }));
        });
        
        const exitingLines = lines.filter(l => l.className && l.className.includes('exiting'));
        const normalLines = lines.filter(l => !l.className || !l.className.includes('exiting'));
        
        console.log(`Total lines: ${lines.length}`);
        console.log(`Exiting lines: ${exitingLines.length}`);
        console.log(`Normal lines: ${normalLines.length}`);

        if (exitingLines.length > 0) {
             console.log("Some exiting lines:", exitingLines.slice(0, 5));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
