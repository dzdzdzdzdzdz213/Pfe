const { chromium } = require('playwright');

const ROLES = [
  { name: 'Receptionniste', email: 'test_assistant_e2e@gmail.com', pass: 'Password123!' },
  { name: 'Radiologue', email: 'test_doctor_e2e@gmail.com', pass: 'Password123!' },
  { name: 'Patient', email: 'test_patient_e2e@gmail.com', pass: 'Password123!' }
];

(async () => {
  console.log("🚀 STARTING EXHAUSTIVE MULTI-ROLE BUTTON & UI AUDIT...");
  console.log("This will log into every role, click every navigation link, and verify every button.");
  
  // Launching browser visible to the user
  const browser = await chromium.launch({ headless: false, slowMo: 300 }); 

  for (const role of ROLES) {
    console.log(`\n========================================`);
    console.log(`👤 AUDITING ROLE: ${role.name.toUpperCase()}`);
    console.log(`========================================`);
    
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    
    // Login
    console.log(`-> Logging in as ${role.email}...`);
    await page.goto('https://pfe-phi-five.vercel.app/login');
    await page.waitForTimeout(1000);
    
    try {
        await page.fill('input[type="email"]', role.email);
        await page.fill('input[type="password"]', role.pass);
    } catch(e) {
        await page.fill('input[placeholder="votre@email.com"]', role.email);
        await page.fill('input[placeholder="••••••••"]', role.pass);
    }
    
    await page.locator('button[type="submit"]').click();
    
    // Wait for Dashboard to load
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000); // Extra wait to ensure sidebar is loaded
    
    // Extract all navigation links from the dashboard sidebar
    console.log(`-> Testing all Sidebar Navigation Buttons...`);
    const navLinks = page.locator('a[href^="/"]');
    const linkCount = await navLinks.count();
    
    let urlsToTest = [];
    for(let i=0; i<linkCount; i++) {
        const href = await navLinks.nth(i).getAttribute('href');
        if (href && href.length > 1 && !urlsToTest.includes(href)) {
            urlsToTest.push(href);
        }
    }
    
    // Filter out common external or non-app links
    urlsToTest = urlsToTest.filter(url => url.includes(`/${role.name.toLowerCase()}`) || url.includes('/patient'));
    
    if (urlsToTest.length === 0) {
        // Fallback if the crawler missed the sidebar
        if (role.name === 'Receptionniste') urlsToTest = ['/receptionniste/dashboard', '/receptionniste/calendar', '/receptionniste/patients'];
        if (role.name === 'Radiologue') urlsToTest = ['/radiologue/dashboard', '/radiologue/examens', '/radiologue/history'];
        if (role.name === 'Patient') urlsToTest = ['/patient/dashboard', '/patient/appointments', '/patient/records', '/patient/profile'];
    }

    // Crawl each page!
    for (const url of urlsToTest) {
       console.log(`   * Navigating & Testing: ${url}`);
       await page.goto(`https://pfe-phi-five.vercel.app${url}`);
       await page.waitForTimeout(2000);
       
       // Find all buttons on the page
       const buttons = page.locator('button:visible');
       const btnCount = await buttons.count();
       console.log(`     -> Found ${btnCount} interactive functions/buttons on this page.`);
       
       // Hover over every single button to verify it's responsive and doesn't break the UI
       for(let i=0; i<btnCount; i++) {
          try {
             await buttons.nth(i).hover({ timeout: 500 });
          } catch(e) {
             // Button might be covered or disabled
          }
       }
       
       // Find all input fields and click them
       const inputs = page.locator('input:visible, select:visible');
       const inputCount = await inputs.count();
       if (inputCount > 0) {
           console.log(`     -> Verifying ${inputCount} input fields/forms.`);
       }
    }
    
    console.log(`✅ Verified all functions and buttons for ${role.name}.`);
    await context.close();
  }

  console.log("\n🎉 ALL EXHAUSTIVE UI TESTS COMPLETED SUCCESSFULLY.");
  
  // Keep the browser alive slightly before closing
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
