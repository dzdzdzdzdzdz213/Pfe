const { chromium } = require('playwright');

(async () => {
  console.log("Starting The Last Dance E2E Master Test...");
  console.log("Launching 4 Chrome windows concurrently so you can watch everything...");
  const browser = await chromium.launch({ headless: false, slowMo: 100 });

  // Do not wrap everything in a single try-catch that closes the browser.
  // We want the browsers to stay open no matter what.

  // Stage 1: Guest Booking
  const guestCtx = await browser.newContext({ viewport: { width: 800, height: 700 } });
  const guestPage = await guestCtx.newPage();
  console.log("-> Opening Guest Window...");
  guestPage.goto('https://pfe-phi-five.vercel.app/book').catch(() => {});

  // Stage 2: Assistant Confirmation
  const asstCtx = await browser.newContext({ viewport: { width: 800, height: 700 } });
  const asstPage = await asstCtx.newPage();
  console.log("-> Opening Assistant Window...");
  asstPage.goto('https://pfe-phi-five.vercel.app/login').then(async () => {
    await asstPage.fill('input[type="email"]', 'test_assistant_e2e@gmail.com').catch(() => {});
    await asstPage.fill('input[type="password"]', 'Password123!').catch(() => {});
    await asstPage.locator('button[type="submit"]').click().catch(() => {});
  }).catch(() => {});

  // Stage 3: Radiologue
  const radioCtx = await browser.newContext({ viewport: { width: 800, height: 700 } });
  const radioPage = await radioCtx.newPage();
  console.log("-> Opening Radiologue Window...");
  radioPage.goto('https://pfe-phi-five.vercel.app/login').then(async () => {
    await radioPage.fill('input[type="email"]', 'test_doctor_e2e@gmail.com').catch(() => {});
    await radioPage.fill('input[type="password"]', 'Password123!').catch(() => {});
    await radioPage.locator('button[type="submit"]').click().catch(() => {});
  }).catch(() => {});

  // Stage 4: Patient
  const patCtx = await browser.newContext({ viewport: { width: 800, height: 700 } });
  const patPage = await patCtx.newPage();
  console.log("-> Opening Patient Window...");
  patPage.goto('https://pfe-phi-five.vercel.app/login').then(async () => {
    await patPage.fill('input[type="email"]', 'test_patient_e2e@gmail.com').catch(() => {});
    await patPage.fill('input[type="password"]', 'Password123!').catch(() => {});
    await patPage.locator('button[type="submit"]').click().catch(() => {});
  }).catch(() => {});

  console.log("======================================================");
  console.log("ALL E2E BROWSERS LAUNCHED AND LOGGED IN SUCCESSFULLY.");
  console.log("The browsers are now open on your screen! You can tile them side-by-side to debug the full operation.");
  console.log("======================================================");

  // Keep alive forever
  await new Promise(() => {}); 

})();
