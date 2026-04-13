import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        
        // Listen to console to count re-renders
        page.on('console', msg => {
            if(msg.text().includes('D3ForceGraph Effect Ran')) {
                console.log(msg.text());
            }
        });

        console.log("Navigating to chapter 2 via react router...");
        await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href^="/Book"]'));
            if (links.length > 1) links[1].click();
        });
        await new Promise(r => setTimeout(r, 3000));
        
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
