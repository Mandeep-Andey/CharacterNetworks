import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173/BookI/1', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        
        let lines1 = await page.$$eval('g.link-group line', lines => lines.map(l => l.__data__ ? `${l.__data__.source.id}-${l.__data__.target.id}` : 'no data'));
        console.log(`Chapter 1 lines count:`, lines1.length);
        
        console.log("Navigating to chapter 2 directly...");
        await page.goto('http://localhost:5173/BookI/2', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));

        let lines2 = await page.$$eval('g.link-group line', lines => lines.map(l => l.__data__ ? `${l.__data__.source.id}-${l.__data__.target.id}` : 'no data'));
        let lineClasses = await page.$$eval('g.link-group line', lines => lines.map(l => l.getAttribute('class')));
        console.log(`Chapter 2 lines count:`, lines2.length);
        console.log(`Classes:`, lineClasses.filter(c => c && c.includes('exiting')));

        console.log("Navigating to chapter 3 directly...");
        await page.goto('http://localhost:5173/BookI/3', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));

        let lines3 = await page.$$eval('g.link-group line', lines => lines.map(l => l.__data__ ? `${l.__data__.source.id}-${l.__data__.target.id}` : 'no data'));
        let lineClasses3 = await page.$$eval('g.link-group line', lines => lines.map(l => l.getAttribute('class')));
        console.log(`Chapter 3 lines count:`, lines3.length);
        console.log(`Classes:`, lineClasses3.filter(c => c && c.includes('exiting')));
        
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
