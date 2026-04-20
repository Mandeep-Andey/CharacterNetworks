import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        
        let lines1 = await page.$$eval('g.link-group line', lines => lines.length);
        console.log(`Chapter 1 lines: ${lines1}`);

        console.log("Navigating to chapter 2...");
        const chapterLinks = await page.$$('a[href^="/Book"]');
        if (chapterLinks.length > 1) {
            await chapterLinks[1].click();
            await new Promise(r => setTimeout(r, 3000));
        }

        let lines2 = await page.$$eval('g.link-group line', lines => lines.length);
        console.log(`Chapter 2 lines: ${lines2}`);
        
        let lines2Classes = await page.$$eval('g.link-group line', lines => lines.map(l => l.getAttribute('class')));
        console.log(`Chapter 2 line classes:`, lines2Classes);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
