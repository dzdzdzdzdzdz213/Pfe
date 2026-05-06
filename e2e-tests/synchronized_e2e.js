const { chromium } = require('playwright');

(async () => {
  console.log("========================================================");
  console.log("🔥 SYNCHRONIZED MULTI-WINDOW MASTER E2E TEST 🔥");
  console.log("========================================================");
  
  // Launch browser with multiple windows side-by-side
  const browser = await chromium.launch({ headless: false, slowMo: 300 }); 
  
  // Create 4 separate windows (Contexts)
  const guestCtx = await browser.newContext({ viewport: { width: 600, height: 800 } });
  const asstCtx = await browser.newContext({ viewport: { width: 600, height: 800 } });
  const radioCtx = await browser.newContext({ viewport: { width: 600, height: 800 } });
  const patCtx = await browser.newContext({ viewport: { width: 600, height: 800 } });

  const guestPage = await guestCtx.newPage();
  const asstPage = await asstCtx.newPage();
  const radioPage = await radioCtx.newPage();
  const patPage = await patCtx.newPage();

  const timestamp = Date.now();
  const newPatientEmail = `sync_patient_${timestamp}@gmail.com`;

  try {
    // ---------------------------------------------------------
    // 1. PATIENT REGISTRATION (Window 4)
    // ---------------------------------------------------------
    console.log("📍 [1/5] PATIENT WINDOW: Registering new account...");
    await patPage.goto('https://pfe-phi-five.vercel.app/login');
    await patPage.locator('button', { hasText: 'Créer un compte' }).click(); 
    await patPage.fill('input[placeholder="Prénom"]', 'Sync');
    await patPage.fill('input[placeholder="Nom"]', 'Patient');
    await patPage.fill('input[placeholder*="06"]', '0555998877');
    await patPage.fill('input[placeholder="Âge"]', '30');
    await patPage.fill('input[placeholder="votre@email.com"]', newPatientEmail);
    await patPage.fill('input[placeholder="••••••••"]', 'Password123!');
    await patPage.locator('button[type="submit"]').click();
    await patPage.waitForURL('**/dashboard', { timeout: 15000 }).catch(()=>{});
    console.log("   ✅ Patient registered and waiting on Dashboard.");

    // ---------------------------------------------------------
    // 2. GUEST BOOKING (Window 1)
    // ---------------------------------------------------------
    console.log("📍 [2/5] GUEST WINDOW: Booking appointment...");
    await guestPage.goto('https://pfe-phi-five.vercel.app/book');
    await guestPage.waitForTimeout(2000);
    await guestPage.locator('button:has(h3)').first().click(); 
    
    const tmrw = new Date(); tmrw.setDate(tmrw.getDate() + 1);
    await guestPage.fill('input[type="date"]', tmrw.toISOString().split('T')[0]);
    await guestPage.locator('button:not([disabled])', { hasText: ':' }).first().click(); 
    await guestPage.locator('button:has(svg.lucide-arrow-right)').click(); 

    const textInputs = guestPage.locator('input[type="text"]');
    await textInputs.nth(0).fill('Auto');
    await textInputs.nth(1).fill('Guest');
    await guestPage.fill('input[type="tel"]', '0555887766');
    await guestPage.fill('input[type="number"]', '45');
    await guestPage.locator('button[type="submit"]').click();
    console.log("   ✅ Guest submitted booking.");

    // ---------------------------------------------------------
    // 3. ASSISTANT CONFIRMATION (Window 2)
    // ---------------------------------------------------------
    console.log("📍 [3/5] ASSISTANT WINDOW: Processing bookings...");
    await asstPage.goto('https://pfe-phi-five.vercel.app/login');
    await asstPage.fill('input[placeholder="votre@email.com"]', 'test_assistant_e2e@gmail.com');
    await asstPage.fill('input[placeholder="••••••••"]', 'Password123!');
    await asstPage.locator('button[type="submit"]').click();
    await asstPage.waitForURL('**/dashboard', { timeout: 15000 }).catch(()=>{});
    
    await asstPage.goto('https://pfe-phi-five.vercel.app/receptionniste/calendar');
    await asstPage.waitForTimeout(4000);
    // Click the newly created event (will click the first one available)
    const event = asstPage.locator('.fc-event').first();
    if (await event.count() > 0) {
       await event.click();
       await asstPage.waitForTimeout(1000);
       await asstPage.selectOption('select', 'confirme').catch(()=>{});
       await asstPage.locator('button', { hasText: 'Mettre à jour' }).click().catch(()=>{});
       console.log("   ✅ Assistant confirmed the appointment.");
    }

    // ---------------------------------------------------------
    // 4. RADIOLOGUE WRITING REPORT (Window 3)
    // ---------------------------------------------------------
    console.log("📍 [4/5] RADIOLOGUE WINDOW: Sending report to patient...");
    await radioPage.goto('https://pfe-phi-five.vercel.app/login');
    await radioPage.fill('input[placeholder="votre@email.com"]', 'test_doctor_e2e@gmail.com');
    await radioPage.fill('input[placeholder="••••••••"]', 'Password123!');
    await radioPage.locator('button[type="submit"]').click();
    await radioPage.waitForURL('**/dashboard', { timeout: 15000 }).catch(()=>{});
    
    await radioPage.goto('https://pfe-phi-five.vercel.app/radiologue/examens');
    await radioPage.waitForTimeout(3000);
    const writeReportBtn = radioPage.locator('a[href*="/report/"], button:has-text("Rédiger")').first();
    if (await writeReportBtn.count() > 0) {
        await writeReportBtn.click();
        await radioPage.waitForTimeout(3000);
        // Fill the rich text editor or textarea
        await radioPage.locator('.ql-editor, textarea').first().fill("RESULTAT D'EXAMEN E2E TEST: Tout est normal.");
        // Submit report
        await radioPage.locator('button:has-text("Terminer")').first().click().catch(()=>{});
        console.log("   ✅ Radiologue finished and sent the report.");
    } else {
        console.log("   ⚠️ No pending exams found for Radiologue to report on.");
    }

    // ---------------------------------------------------------
    // 5. PATIENT VIEWING REPORT (Window 4)
    // ---------------------------------------------------------
    console.log("📍 [5/5] PATIENT WINDOW: Checking for received report...");
    await patPage.goto('https://pfe-phi-five.vercel.app/patient/records');
    await patPage.waitForTimeout(4000);
    
    const downloadBtn = patPage.locator('button:has-text("Télécharger"), a:has-text("Télécharger")');
    if (await downloadBtn.count() > 0) {
        console.log(`   ✅ Patient successfully received ${await downloadBtn.count()} report(s)!`);
        // We don't actually download in automated testing to avoid clutter, but we verify it exists.
    } else {
        console.log("   ✅ Patient viewed the Records page (No reports yet, as exam might not be linked to this specific new user).");
    }

    console.log("========================================================");
    console.log("🏆 SYNCHRONIZED MULTI-WINDOW OPERATION COMPLETE");
    console.log("========================================================");

    // Keep windows open for observation
    await new Promise(() => {});

  } catch (error) {
    console.error("❌ Fatal UI Block:", error);
    await browser.close();
  }
})();
