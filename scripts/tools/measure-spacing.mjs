import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();

  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 }
  ];

  await page.goto('http://localhost:5173/test/dashboard');
  await page.waitForSelector('section');
  await page.waitForTimeout(1600);

  for (const vp of viewports) {
    await page.setViewportSize(vp);
    await page.waitForTimeout(500);

    const measurements = await page.evaluate(() => {
      try {
        const getBottomEdge = (el) => el.getBoundingClientRect().bottom;
        const getTopEdge = (el) => el.getBoundingClientRect().top;

      const sections = Array.from(document.querySelectorAll('section'));
      const racingLines = Array.from(document.querySelectorAll('svg[viewBox="0 0 25200 200"]'));
      const footer = document.querySelector('footer');
      
      const results = [];
      for (let i = 0; i < sections.length - 1; i++) {
        const current = sections[i];
        const next = sections[i + 1];
        
        // Find last content element of current section (ignoring background graphics/3D track)
        let contentContainer = current;
        if (current.id === 'next-race') {
          contentContainer = current.querySelector('.relative.z-10') || current;
        }
        
        const currentChildren = Array.from(contentContainer.querySelectorAll('*')).filter(el => {
          const r = el.getBoundingClientRect();
          return r.height > 0 && !el.closest('.pointer-events-none') && !el.getAttribute('aria-hidden');
        });

        let maxBottom = getBottomEdge(contentContainer);
        if (currentChildren.length > 0) {
          maxBottom = Math.max(...currentChildren.map(getBottomEdge));
        }

        // Find heading of next section
        const nextHeading = next.querySelector('.sticky, h1, h2, h3, [data-heading]') || next;
        const nextTop = getTopEdge(nextHeading);

        // Distance measured around the red RacingLine
        const rl = racingLines[i];
        let distance;
        let spaceAbove = 0;
        let spaceBelow = 0;
        if (rl) {
          const rlRect = rl.getBoundingClientRect();
          spaceAbove = Math.max(0, rlRect.top - maxBottom);
          spaceBelow = Math.max(0, nextTop - rlRect.bottom);
          distance = Math.round(spaceAbove + spaceBelow);
        } else {
          distance = Math.round(nextTop - maxBottom);
        }

        results.push({
          from: current.id || `Section ${i+1}`,
          to: next.id || `Section ${i+2}`,
          distance
        });
      }

      if (sections.length > 0 && footer) {
        const lastSection = sections[sections.length - 1];
        const currentChildren = Array.from(lastSection.querySelectorAll('*')).filter(el => {
          const r = el.getBoundingClientRect();
          return r.height > 0 && !el.closest('.pointer-events-none') && !el.getAttribute('aria-hidden');
        });

        let maxBottom = getBottomEdge(lastSection);
        if (currentChildren.length > 0) {
          maxBottom = Math.max(...currentChildren.map(getBottomEdge));
        }
        
        const footerTop = getTopEdge(footer);

        results.push({
          from: lastSection.id || 'Last Section',
          to: 'Footer',
          distance: Math.round(footerTop - maxBottom)
        });
      }

        return results;
      } catch (err) {
        return [{ from: 'ERROR', to: err.message, distance: 0 }];
      }
    });

    console.log(`\nViewport: ${vp.width}x${vp.height}`);
    console.log('RAW MEASUREMENTS:', measurements);
    console.table(measurements);
  }

  await browser.close();
})();
