import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
    console.log('Starting Thorough UI A/B testing...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    const errors = [];
    page.on('pageerror', error => {
        errors.push({ type: 'pageerror', error: error.message });
    });

    const screenshotDir = './test_screenshots';
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
    }

    const checkMode = async (modeName, chapterId) => {
        console.log(`Checking ${modeName} Mode for Chapter ${chapterId}...`);
        await new Promise(r => setTimeout(r, 2000));
        const bodyText = await page.evaluate(() => document.body.innerText);
        
        if (modeName === 'Stable') {
            if (!bodyText.includes('Start Auto-Play')) {
                errors.push({ type: 'ui', error: `Stable mode UI (Start Auto-Play) missing for Ch ${chapterId}` });
            }
        } else {
            if (!bodyText.includes('Evidence Lint Status')) {
                errors.push({ type: 'ui', error: `Experimental mode UI (Evidence Lint Status) missing for Ch ${chapterId}` });
            }
        }
        
        await page.screenshot({ path: path.join(screenshotDir, `${modeName.toLowerCase()}_ch${chapterId}.png`), fullPage: true });
    };

    const toggleMode = async (targetMode) => {
        console.log(`Switching to ${targetMode}...`);
        const toggle = await page.evaluateHandle((target) => {
            const elements = Array.from(document.querySelectorAll('div, span, p, button, a'));
            return elements.find(el => el.textContent === target && el.offsetParent !== null);
        }, targetMode === 'Experimental' ? 'Pipeline v4' : 'Stable');

        if (toggle && toggle.asElement()) {
            await toggle.asElement().click();
            await new Promise(r => setTimeout(r, 3000));
        } else {
            errors.push({ type: 'ui', error: `${targetMode} toggle not found.` });
        }
    };

    try {
        // 1. Chapter 1 Stable
        console.log('Navigating to Chapter 1...');
        await page.goto('http://localhost:5173/BookI/1', { waitUntil: 'networkidle2' });
        await checkMode('Stable', '1');

        // 2. Chapter 1 Experimental
        await toggleMode('Experimental');
        await checkMode('Experimental', '1');

        // 3. Chapter 15 Experimental
        console.log('Navigating to Chapter 15...');
        // Clicking from chapter list or direct navigation? Let's try clicking.
        const ch15Link = await page.evaluateHandle(() => {
            const links = Array.from(document.querySelectorAll('a'));
            return links.find(l => l.getAttribute('href') === '/BookII/15');
        });
        if (ch15Link && ch15Link.asElement()) {
            await ch15Link.asElement().click();
            await new Promise(r => setTimeout(r, 2000));
        } else {
            await page.goto('http://localhost:5173/BookII/15', { waitUntil: 'networkidle2' });
        }
        await checkMode('Experimental', '15');

        // 4. Chapter 15 Stable
        await toggleMode('Stable');
        await checkMode('Stable', '15');

        if (errors.length > 0) {
            console.log('\n--- A/B TEST REPORT ---');
            console.log(JSON.stringify(errors, null, 2));
        } else {
            console.log('\n--- A/B TEST SUCCESS ---');
            console.log('Thorough A/B testing completed successfully for chapters 1 and 15.');
        }

    } catch (error) {
        console.log('Error during A/B testing:', error.message);
    } finally {
        await browser.close();
    }
})();
