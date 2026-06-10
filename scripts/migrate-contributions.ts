import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ContributionService } from '../src/domains/contribution/contribution.service';
import { PrismaService } from '../src/prisma/prisma.service';

interface ContributionMigrationData {
  userEmail: string;
  amount: number;
  transactionRef: string;
  periodMonth: number; // 1-indexed
  periodYear: number;
}

// Months with 0 amounts are excluded — no contribution record created
const migrationData: ContributionMigrationData[] = [
  // ndwigaannetr13@gmail.com
  { userEmail: 'ndwigaannetr13@gmail.com', amount: 3000, transactionRef: 'MIG-SEP2025-NDWIG', periodMonth: 9,  periodYear: 2025 },
  { userEmail: 'ndwigaannetr13@gmail.com', amount: 3000, transactionRef: 'MIG-OCT2025-NDWIG', periodMonth: 10, periodYear: 2025 },
  { userEmail: 'ndwigaannetr13@gmail.com', amount: 3000, transactionRef: 'MIG-NOV2025-NDWIG', periodMonth: 11, periodYear: 2025 },
  // DEC 2025: 0 — skipped
  { userEmail: 'ndwigaannetr13@gmail.com', amount: 3000, transactionRef: 'MIG-JAN2026-NDWIG', periodMonth: 1,  periodYear: 2026 },
  { userEmail: 'ndwigaannetr13@gmail.com', amount: 3000, transactionRef: 'MIG-FEB2026-NDWIG', periodMonth: 2,  periodYear: 2026 },
  { userEmail: 'ndwigaannetr13@gmail.com', amount: 3000, transactionRef: 'MIG-MAR2026-NDWIG', periodMonth: 3,  periodYear: 2026 },
  { userEmail: 'ndwigaannetr13@gmail.com', amount: 6000, transactionRef: 'MIG-APR2026-NDWIG', periodMonth: 4,  periodYear: 2026 },

  // kibochamark@gmail.com
  { userEmail: 'kibochamark@gmail.com', amount: 3000, transactionRef: 'MIG-SEP2025-KIBOC', periodMonth: 9,  periodYear: 2025 },
  { userEmail: 'kibochamark@gmail.com', amount: 3000, transactionRef: 'MIG-OCT2025-KIBOC', periodMonth: 10, periodYear: 2025 },
  { userEmail: 'kibochamark@gmail.com', amount: 3000, transactionRef: 'MIG-NOV2025-KIBOC', periodMonth: 11, periodYear: 2025 },
  { userEmail: 'kibochamark@gmail.com', amount: 3000, transactionRef: 'MIG-DEC2025-KIBOC', periodMonth: 12, periodYear: 2025 },
  { userEmail: 'kibochamark@gmail.com', amount: 3000, transactionRef: 'MIG-JAN2026-KIBOC', periodMonth: 1,  periodYear: 2026 },
  { userEmail: 'kibochamark@gmail.com', amount: 3000, transactionRef: 'MIG-FEB2026-KIBOC', periodMonth: 2,  periodYear: 2026 },
  { userEmail: 'kibochamark@gmail.com', amount: 3000, transactionRef: 'MIG-MAR2026-KIBOC', periodMonth: 3,  periodYear: 2026 },
  { userEmail: 'kibochamark@gmail.com', amount: 3000, transactionRef: 'MIG-APR2026-KIBOC', periodMonth: 4,  periodYear: 2026 },

  // gichusimon@gmail.com
  { userEmail: 'gichusimon@gmail.com', amount: 3000, transactionRef: 'MIG-SEP2025-GICHI', periodMonth: 9, periodYear: 2025 },
  // OCT–APR: all 0 — skipped

  // stlngatha@gmail.com
  { userEmail: 'stlngatha@gmail.com', amount: 3000, transactionRef: 'MIG-SEP2025-STLNG', periodMonth: 9,  periodYear: 2025 },
  { userEmail: 'stlngatha@gmail.com', amount: 1000, transactionRef: 'MIG-OCT2025-STLNG', periodMonth: 10, periodYear: 2025 },
  { userEmail: 'stlngatha@gmail.com', amount: 5000, transactionRef: 'MIG-NOV2025-STLNG', periodMonth: 11, periodYear: 2025 },
  // DEC 2025–MAR 2026: 0 — skipped
  { userEmail: 'stlngatha@gmail.com', amount: 3000, transactionRef: 'MIG-APR2026-STLNG', periodMonth: 4, periodYear: 2026 },

  // ndichudaniel02@gmail.com
  { userEmail: 'ndichudaniel02@gmail.com', amount: 3000, transactionRef: 'MIG-SEP2025-NDICH', periodMonth: 9,  periodYear: 2025 },
  { userEmail: 'ndichudaniel02@gmail.com', amount: 1305, transactionRef: 'MIG-OCT2025-NDICH', periodMonth: 10, periodYear: 2025 },
  { userEmail: 'ndichudaniel02@gmail.com', amount: 4700, transactionRef: 'MIG-NOV2025-NDICH', periodMonth: 11, periodYear: 2025 },
  { userEmail: 'ndichudaniel02@gmail.com', amount: 3000, transactionRef: 'MIG-DEC2025-NDICH', periodMonth: 12, periodYear: 2025 },
  { userEmail: 'ndichudaniel02@gmail.com', amount: 1000, transactionRef: 'MIG-JAN2026-NDICH', periodMonth: 1,  periodYear: 2026 },
  // FEB–APR 2026: 0 — skipped

  // timothygithae19@gmail.com
  { userEmail: 'timothygithae19@gmail.com', amount: 3000, transactionRef: 'MIG-SEP2025-TIMOT', periodMonth: 9,  periodYear: 2025 },
  { userEmail: 'timothygithae19@gmail.com', amount: 3000, transactionRef: 'MIG-OCT2025-TIMOT', periodMonth: 10, periodYear: 2025 },
  { userEmail: 'timothygithae19@gmail.com', amount: 3000, transactionRef: 'MIG-NOV2025-TIMOT', periodMonth: 11, periodYear: 2025 },
  { userEmail: 'timothygithae19@gmail.com', amount: 3000, transactionRef: 'MIG-DEC2025-TIMOT', periodMonth: 12, periodYear: 2025 },
  // JAN–FEB 2026: 0 — skipped
  { userEmail: 'timothygithae19@gmail.com', amount: 3000, transactionRef: 'MIG-MAR2026-TIMOT', periodMonth: 3, periodYear: 2026 },
  { userEmail: 'timothygithae19@gmail.com', amount: 4000, transactionRef: 'MIG-APR2026-TIMOT', periodMonth: 4, periodYear: 2026 },

  // johnskahiga97@gmail.com
  { userEmail: 'johnskahiga97@gmail.com', amount: 3000, transactionRef: 'MIG-SEP2025-JOHNS', periodMonth: 9,  periodYear: 2025 },
  { userEmail: 'johnskahiga97@gmail.com', amount: 1000, transactionRef: 'MIG-OCT2025-JOHNS', periodMonth: 10, periodYear: 2025 },
  // NOV 2025: 0 — skipped
  { userEmail: 'johnskahiga97@gmail.com', amount: 4000, transactionRef: 'MIG-DEC2025-JOHNS', periodMonth: 12, periodYear: 2025 },
  // JAN–FEB 2026: 0 — skipped
  { userEmail: 'johnskahiga97@gmail.com', amount: 2000, transactionRef: 'MIG-MAR2026-JOHNS', periodMonth: 3, periodYear: 2026 },
  { userEmail: 'johnskahiga97@gmail.com', amount: 3000, transactionRef: 'MIG-APR2026-JOHNS', periodMonth: 4, periodYear: 2026 },

  // mwangijeffxteve@gmail.com
  { userEmail: 'mwangijeffxteve@gmail.com', amount: 3000, transactionRef: 'MIG-SEP2025-MWANG', periodMonth: 9,  periodYear: 2025 },
  { userEmail: 'mwangijeffxteve@gmail.com', amount: 3000, transactionRef: 'MIG-OCT2025-MWANG', periodMonth: 10, periodYear: 2025 },
  { userEmail: 'mwangijeffxteve@gmail.com', amount: 2000, transactionRef: 'MIG-NOV2025-MWANG', periodMonth: 11, periodYear: 2025 },
  // DEC 2025–APR 2026: 0 — skipped

  // jamesmungai254.co.ke@gmail.com
  { userEmail: 'jamesmungai254.co.ke@gmail.com', amount: 3000, transactionRef: 'MIG-SEP2025-JAMES', periodMonth: 9,  periodYear: 2025 },
  { userEmail: 'jamesmungai254.co.ke@gmail.com', amount: 3000, transactionRef: 'MIG-OCT2025-JAMES', periodMonth: 10, periodYear: 2025 },
  { userEmail: 'jamesmungai254.co.ke@gmail.com', amount: 3000, transactionRef: 'MIG-NOV2025-JAMES', periodMonth: 11, periodYear: 2025 },
  // DEC 2025–APR 2026: 0 — skipped
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const contributionService = app.get(ContributionService);
  const prismaService = app.get(PrismaService);

  console.log('Starting contribution migration...');
  console.log(`Total records to process: ${migrationData.length}`);

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (const data of migrationData) {
    const { userEmail, amount, transactionRef, periodMonth, periodYear } = data;

    try {
      const user = await prismaService.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        console.error(`[SKIP] User not found: ${userEmail}`);
        skippedCount++;
        continue;
      }

      if (!user.companyId) {
        console.error(`[SKIP] User has no companyId: ${userEmail}`);
        skippedCount++;
        continue;
      }

      // Check 1: skip if our MIG ref already exists (re-run protection)
      const existingByRef = await prismaService.contributionRequest.findUnique({
        where: { transactionRef },
      });
      if (existingByRef) {
        console.log(`[SKIP] Already migrated: ${transactionRef}`);
        skippedCount++;
        continue;
      }

      // Check 2: skip if ANY contribution for this user exists within the same calendar month
      // This guards against contributions already entered via the app for that period
      const periodStart = new Date(periodYear, periodMonth - 1, 1);
      const periodEnd = new Date(periodYear, periodMonth, 1); // exclusive start of next month

      const existingForPeriod = await prismaService.contributionRequest.findFirst({
        where: {
          userId: user.id,
          createdAt: { gte: periodStart, lt: periodEnd },
        },
      });
      if (existingForPeriod) {
        console.log(`[SKIP] Contribution already exists for ${userEmail} in ${periodMonth}/${periodYear} (ref: ${existingForPeriod.transactionRef})`);
        skippedCount++;
        continue;
      }

      await contributionService.createContribution({
        amount,
        transactionRef,
        userId: user.id,
        companyId: user.companyId,
        adminNotes: 'Migrated from Excel records',
      });

      console.log(`[OK] ${userEmail} | ${transactionRef} | KES ${amount}`);
      successCount++;
    } catch (error: any) {
      console.error(`[FAIL] ${userEmail} | ${transactionRef} | ${error.message}`);
      failCount++;
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Success:  ${successCount}`);
  console.log(`Skipped:  ${skippedCount}`);
  console.log(`Failed:   ${failCount}`);
  console.log('Migration complete.');

  await app.close();
}

bootstrap();
