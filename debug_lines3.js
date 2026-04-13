import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        
        let nodes1 = await page.$$eval('g.node-group circle', nodes => nodes.map(n => n.getAttribute('cx')).slice(0, 3));
        console.log(`Chapter 1 some node positions: ${nodes1}`);

        console.log("Navigating to chapter 2...");
        const chapterLinks = await page.$$('a[href^="/Book"]');
        if (chapterLinks.length > 1) {
            await chapterLinks[1].click();
            await new Promise(r => setTimeout(r, 3000));
        }

        let nodes2 = await page.$$eval('g.node-group circle', nodes => nodes.map(n => n.getAttribute('cx')).slice(0, 3));
        console.log(`Chapter 2 some node positions: ${nodes2}`);

        let lineIds = await page.$$eval('g.link-group line', lines => lines.map(l => l.__data__ ? `${l.__data__.source.id}-${l.__data__.target.id}` : 'no data'));
        console.log(`Chapter 2 lines data:`, lineIds);
        
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
