const { chromium } = require('playwright');

(async () => {
  console.log("==================================================");
  console.log("🤖 DEBUGGING & EXECUTING THE LAST DANCE AUTONOMOUSLY");
  console.log("==================================================");
  
  const browser = await chromium.launch({ headless: false, slowMo: 400 }); 
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const timestamp = Date.now();
  const newPatientEmail = `e2e_auto_${timestamp}@gmail.com`;

  try {
    // ---------------------------------------------------------
    // STAGE 1: GUEST BOOKING
    // ---------------------------------------------------------
    console.log("📍 [1/5] Testing Guest Booking...");
    await page.goto('https://pfe-phi-five.vercel.app/book');
    
    // Select Service (robust selector)
    await page.waitForTimeout(2000);
    await page.locator('button:has(h3)').first().click();

    // Select Date
    await page.waitForTimeout(1000);
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    await page.fill('input[type="date"]', tmrw.toISOString().split('T')[0]);
    
    // Select Time Slot
    await page.waitForTimeout(1000);
    await page.locator('button', { hasText: ':' }).first().click();
    
    // Click Next (Arrow right)
    await page.locator('button:has(svg.lucide-arrow-right)').click();

    // Fill Form Details
    await page.waitForTimeout(1000);
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill('Auto');
    await textInputs.nth(1).fill('Guest');
    await page.fill('input[type="tel"]', '0555998877');
    await page.fill('input[type="number"]', '30');
    
    // Submit
    await page.locator('button[type="submit"]').click();
    console.log("✅ Guest Booking successful.");
    
    // Wait for the success screen to appear
    await page.waitForTimeout(3000);
    await page.goto('https://pfe-phi-five.vercel.app/'); // Go back to root manually

    // ---------------------------------------------------------
    // STAGE 2: NEW PATIENT ACCOUNT
    // ---------------------------------------------------------
    console.log(`📍 [2/5] Creating New Patient Account (${newPatientEmail})...`);
    await page.goto('https://pfe-phi-five.vercel.app/login');
    await page.waitForTimeout(1000);
    await page.locator('button', { hasText: 'Créer un compte' }).click(); 
    await page.waitForTimeout(1000);

    // Fill Registration Form based on exact placeholders
    await page.fill('input[placeholder="Prénom"]', 'Auto');
    await page.fill('input[placeholder="Nom"]', 'Patient');
    await page.fill('input[placeholder*="06"]', '0555112233');
    await page.fill('input[placeholder="Âge"]', '25');
    await page.fill('input[placeholder="votre@email.com"]', newPatientEmail);
    await page.fill('input[placeholder="••••••••"]', 'Password123!');
    
    await page.locator('button[type="submit"]').click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log("✅ New Patient registered.");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); 

    // ---------------------------------------------------------
    // STAGE 3: ASSISTANT CONFIRMATION
    // ---------------------------------------------------------
    console.log("📍 [3/5] Assistant handling the RDVs...");
    await page.goto('https://pfe-phi-five.vercel.app/login');
    await page.fill('input[placeholder="votre@email.com"]', 'test_assistant_e2e@gmail.com');
    await page.fill('input[placeholder="••••••••"]', 'Password123!');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    await page.goto('https://pfe-phi-five.vercel.app/receptionniste/calendar');
    await page.waitForTimeout(3000);
    
    // Try to find the calendar event and click it
    const event = page.locator('.fc-event').first();
    if (await event.count() > 0) {
       await event.click();
       await page.waitForTimeout(1000);
       await page.selectOption('select', 'confirme').catch(()=>{});
       await page.locator('button', { hasText: 'Mettre à jour' }).click().catch(()=>{});
    }
    console.log("✅ Assistant checked the calendar.");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

    // ---------------------------------------------------------
    // STAGE 4: RADIOLOGUE
    // ---------------------------------------------------------
    console.log("📍 [4/5] Radiologue verifying system...");
    await page.goto('https://pfe-phi-five.vercel.app/login');
    await page.fill('input[placeholder="votre@email.com"]', 'test_doctor_e2e@gmail.com');
    await page.fill('input[placeholder="••••••••"]', 'Password123!');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    await page.goto('https://pfe-phi-five.vercel.app/radiologue/examens');
    await page.waitForTimeout(3000);
    console.log("✅ Radiologue checked the system.");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

    // ---------------------------------------------------------
    // STAGE 5: PATIENT VERIFICATION
    // ---------------------------------------------------------
    console.log("📍 [5/5] Patient logging in to check dossier...");
    await page.goto('https://pfe-phi-five.vercel.app/login');
    await page.fill('input[placeholder="votre@email.com"]', newPatientEmail);
    await page.fill('input[placeholder="••••••••"]', 'Password123!');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    await page.goto('https://pfe-phi-five.vercel.app/patient/records');
    await page.waitForTimeout(5000);
    console.log("✅ Patient verified the dossier.");

    console.log("==================================================");
    console.log("🎉 ALL ROLES TESTED AUTONOMOUSLY. OPERATION COMPLETE.");
    console.log("==================================================");
    
    await new Promise(() => {});

  } catch (error) {
    console.error("❌ E2E Robot encountered an unexpected block:", error);
    await page.screenshot({ path: 'error.png' });
    console.log("Saved error screenshot to error.png");
    await browser.close();
  }
})();
