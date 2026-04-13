import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        
        let lines1 = await page.$$eval('g.link-group line', lines => lines.length);
        console.log(`Chapter 1 lines count:`, lines1);
        
        console.log("Navigating to chapter 2 via react router...");
        // Evaluate clicking the second chapter link using the exact structure
        await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href^="/Book"]'));
            if (links.length > 1) links[1].click();
        });
        await new Promise(r => setTimeout(r, 3000));

        let lines2 = await page.$$eval('g.link-group line', lines => lines.length);
        console.log(`Chapter 2 lines count:`, lines2);

        let exiting2 = await page.$$eval('g.link-group line', lines => lines.filter(l => l.getAttribute('class') === 'exiting').length);
        console.log(`Chapter 2 exiting lines:`, exiting2);
        
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
