import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        
        let headerText1 = await page.$$eval('p', ps => ps.find(p => p.textContent.includes('Viewing:')).textContent);
        console.log('Header 1:', headerText1);

        console.log("Navigating to chapter 2...");
        const chapterLinks = await page.$$('a[href^="/Book"]');
        if (chapterLinks.length > 1) {
            await chapterLinks[1].click();
            await new Promise(r => setTimeout(r, 3000));
        }

        let headerText2 = await page.$$eval('p', ps => ps.find(p => p.textContent.includes('Viewing:')).textContent);
        console.log('Header 2:', headerText2);
        
        let lineIds2 = await page.$$eval('g.link-group line', lines => lines.map(l => l.__data__ ? `${l.__data__.source.id}-${l.__data__.target.id}` : 'no data'));
        console.log(`Chapter 2 lines data length:`, lineIds2.length);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
