import puppeteer from 'puppeteer';

(async () => {
    console.log('Starting UI testing to check for regressions...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    const errors = [];
    page.on('pageerror', error => {
        errors.push({ type: 'pageerror', error: error.message });
    });
    page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('baseline-browser-mapping') && !msg.text().includes('Failed to load resource')) {
            errors.push({ type: 'console', error: msg.text() });
        }
    });

    try {
        console.log('Navigating to http://localhost:5173...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
        console.log('Page loaded.');
        
        await new Promise(r => setTimeout(r, 2000));
        
        // 1. Check navigation
        console.log('Testing navigation...');
        const chapterLinks = await page.$$('a[href^="/Book"]');
        if (chapterLinks.length > 0) {
            console.log(`Clicking chapter link...`);
            if(chapterLinks[2]) {
                await chapterLinks[2].click().catch(() => {});
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        // 2. Check search (which previously triggered the bug)
        console.log('Testing search interaction...');
        const searchInput = await page.$('input[placeholder="Search character..."]');
        if (searchInput) {
            await searchInput.type('Fred');
            await new Promise(r => setTimeout(r, 1000));
            await searchInput.click({ clickCount: 3 });
            await searchInput.press('Backspace');
            await new Promise(r => setTimeout(r, 500));
        }

        // 3. Check slider (minConnections)
        console.log('Testing slider interaction...');
        const sliders = await page.$$('div[role="slider"]');
        if (sliders.length > 0) {
            // Focus and use arrow keys to change slider value
            await sliders[0].focus();
            await page.keyboard.press('ArrowRight');
            await new Promise(r => setTimeout(r, 1000));
            await page.keyboard.press('ArrowLeft');
            await new Promise(r => setTimeout(r, 1000));
        }
        
        // 4. Check interaction types filter
        console.log('Testing interaction types filter...');
        const tabs = await page.$$('button[role="tab"]');
        for (const tab of tabs) {
             const text = await page.evaluate(el => el.textContent, tab);
             if (text === 'Filters') {
                 await tab.click();
                 await new Promise(r => setTimeout(r, 500));
                 break;
             }
        }
        
        const checkboxes = await page.$$('input[type="checkbox"]');
        if (checkboxes.length > 0) {
             await page.evaluate(el => el.click(), checkboxes[0]);
             await new Promise(r => setTimeout(r, 1000));
             await page.evaluate(el => el.click(), checkboxes[0]); // Toggle back
             await new Promise(r => setTimeout(r, 1000));
        }

        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.includes('TypeError') || bodyText.includes('Cannot read properties') || bodyText.includes('React error')) {
             errors.push({ type: 'rendered-error', error: 'Found error stack trace in rendered HTML.' });
        }

        if (errors.length > 0) {
            console.log('\n--- REGRESSION REPORT ---');
            console.log(JSON.stringify(errors, null, 2));
        } else {
            console.log('\n--- NO BUGS FOUND ---');
            console.log('No obvious JS errors or exceptions found during automated navigation and interactions.');
        }

    } catch (error) {
        console.log('Error during testing:', error.message);
    } finally {
        await browser.close();
    }
})();
