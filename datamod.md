This documentation defines the architectural blueprint for the HERT VENT investment management system. It translates the technical Prisma schema into business-specific functional units to ensure the system maintains financial integrity and transparency.

1. Company Model
What it means: The "Grand Container." It represents the legal or organizational entity that owns the assets and manages the members.

Business Logic: This is the root of your Multi-tenancy. All data (Users, Investments, Ledger) is "owned" by a Company. This allows the system to scale; you could eventually host multiple different investment groups on the same platform without their data ever mixing.

Feynman Example: Imagine a large Office Building. The Building (Company) has its own name and rules. Inside, there are people (Users), safe deposit boxes (Accounts), and projects (Investments). Everything that happens inside stays within those four walls.

2. User Model
What it means: An individual person (Member or Admin) who has access to the system.

Business Logic: It handles Identity (Who are you?) and Commitment (What is your goal?). The targetMonthlyContribution acts as a "promise" or benchmark used to calculate if a member is "In Good Standing" or "Defaulting" relative to the group's goals.

Feynman Example: Think of a Gym Membership. The User is the person who joined. The targetMonthlyContribution is like your monthly workout goal (e.g., "I will contribute 3,000 every month"). The system tracks if you actually hit that goal based on your confirmed payments.

3. MemberAccount Model
What it means: A specific "Financial Pocket" or "Wallet" within the company.

Business Logic: In accounting, we don't just have one big pile of money. We have categories. This model represents those categories (Cash, Equity, Expenses). If the userId is present, it’s a personal "Equity" bucket. If not, it’s a group bucket like "Company Bank Account."

Feynman Example: Imagine a Chest of Drawers.

The "Stella" drawer is for Stella's ownership stake.

The "Company Cash" drawer is where the physical money stays.

The "Bonds" drawer holds the investment certificates.
You look in a specific drawer to see what is currently inside (the balance).

4. LedgerEntry Model
What it means: The record of a Movement. It is the "Atom" of the double-entry system.

Business Logic: This ensures the "Law of Conservation of Value." Money cannot be created or destroyed; it can only move. Every LedgerEntry must show where value came from (credit) and where it went (debit). This is what makes the system audit-proof and ensures the math always balances to zero.

Feynman Example: Think of a Telegram/Letter. It says: "I took 3,000 from Stella’s Desk and put it into the Company Safe." By reading all these letters in order, you can reconstruct exactly how the safe got full, even if the safe was stolen.

5. Investment Model
What it means: A long-term "Seed" planted by the company to generate growth.

Business Logic: It tracks the Principal (The original cost) and the Status. It allows the group to distinguish between "Liquid Cash" (money in the bank) and "Locked Assets" (money tied up in Bonds or Shares).

Feynman Example: Imagine buying an Apple Tree. The Investment is the tree itself. You paid 50,000 (Principal) for it. You can't spend the tree to buy bread, but you hope it grows "Apples" (Returns) later.

6. ReturnRecord Model
What it means: The "Fruit" produced by an investment.

Business Logic: It links incoming cash specifically to an asset. This allows the system to calculate ROI (Return on Investment). It tells you which assets are performing well (like the 2,700 Bond Coupon) and which are underperforming.

Feynman Example: This is the Basket of Apples harvested from your tree. If the tree (Investment) produces 10 apples (ReturnRecord), you know exactly which tree to thank for the snack.

7. ContributionRequest Model
What it means: An "Intent to Pay" or an unverified claim of a transaction.

Business Logic: This is the Security Air-Lock. Users cannot change their own balance. They "request" a change by providing proof (transactionRef, evidenceUrl). The money only "exists" in the Ledger once an Admin verifies this claim and "approves" the request.

Feynman Example: Think of a Check dropped in a Suggestion Box. Just because you dropped a piece of paper saying "I paid 3,000" doesn't mean the company has the money yet. The Admin must open the box, check the bank statement, and only then move the money to the safe.

8. AuditLog Model
What it means: The "Security Camera" or "Black Box" of the system.

Business Logic: While the Ledger tracks the money, the Audit Log tracks the behavior. It records who logged in, who changed a target, or who rejected a payment. The oldValue and newValue snapshots allow you to see exactly what a record looked like before it was modified.

Feynman Example: Imagine a Logbook at the Entrance of a Vault. It doesn't track how much money is inside; it tracks who entered the vault, at what time, and what they touched. If a drawer is empty, you check this book to see who was last seen near it.

9. System Enums
What they mean: The "Rules and Labels" of the system.

Business Logic: They prevent "Dirty Data." By forcing the system to choose from a fixed list (e.g., BOND, SHARES, EXPENSE), you ensure that reports are always consistent.

Feynman Example: These are like Labels on a Spice Rack. You have specific jars for "Salt," "Pepper," and "Cumin." You aren't allowed to just throw random powders into the rack; you must put them in the correctly labeled jar.