import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        
        const nodes = await page.$$eval('g.node-group circle', circles => {
            return circles.map(c => ({
                r: c.getAttribute('r'),
                opacity: c.getAttribute('opacity'),
                cx: c.getAttribute('cx'),
                cy: c.getAttribute('cy'),
                fill: c.getAttribute('fill')
            }));
        });
        
        console.log(`Found ${nodes.length} nodes.`);
        if (nodes.length > 0) {
            console.log('First 5 nodes:', nodes.slice(0, 5));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
