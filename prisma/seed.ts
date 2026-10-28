/**
 * Dev seed: realistic fake data for a ~35-person Bengaluru startup.
 * Wipes all app tables first. Refuses to run in production.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { fakerEN_IN as faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type EmploymentStatus, type EmploymentType, type Role } from "../src/generated/prisma/client";
import { blindIndex, encrypt, last4 } from "../src/lib/crypto";
import { formatEmployeeCode } from "../src/lib/employee-code";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed a production database.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "themetadatum.com";
faker.seed(20261028);

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const isoOf = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

const DEPARTMENTS = ["Engineering", "Product", "Design", "Data", "Sales", "Marketing", "People & Operations", "Finance"];
const DESIGNATIONS = [
  "Chief Executive Officer", "Chief Technology Officer", "HR Manager", "Engineering Manager",
  "Senior Software Engineer", "Software Engineer", "QA Engineer", "DevOps Engineer",
  "Product Manager", "Product Designer", "Data Analyst", "Data Engineer",
  "Account Executive", "Marketing Manager", "Content Writer", "Finance Executive",
  "IT & Operations Executive", "Software Engineering Intern", "Design Intern", "Data Intern", "Marketing Intern",
];
const COLLEGES = ["RV College of Engineering", "PES University", "BMS College of Engineering", "Christ University", "MS Ramaiah Institute of Technology", "IIIT Bangalore"];
const SYSTEMS = ["Google Workspace", "Slack", "GitHub", "AWS", "Jira", "Figma", "HubSpot"];

type Spec = {
  first: string;
  last: string;
  role?: Role;
  dept: string;
  title: string;
  type?: EmploymentType;
  status?: EmploymentStatus;
  joined: string;
  manager?: string; // key of another spec
  key?: string;
};

// Leadership and fixed accounts you can sign in as.
const CORE: Spec[] = [
  { key: "ceo", first: "Ananya", last: "Krishnan", role: "ADMIN", dept: "People & Operations", title: "Chief Executive Officer", joined: "2021-04-01" },
  { key: "cto", first: "Vikram", last: "Shetty", dept: "Engineering", title: "Chief Technology Officer", joined: "2021-04-01", manager: "ceo" },
  { key: "hr", first: "Meera", last: "Iyer", role: "HR", dept: "People & Operations", title: "HR Manager", joined: "2022-01-10", manager: "ceo" },
  { key: "em", first: "Rahul", last: "Menon", dept: "Engineering", title: "Engineering Manager", joined: "2022-03-14", manager: "cto" },
  { key: "pm", first: "Kavya", last: "Reddy", dept: "Product", title: "Product Manager", joined: "2022-07-04", manager: "ceo" },
  { key: "sales", first: "Arjun", last: "Nair", dept: "Sales", title: "Account Executive", joined: "2023-02-01", manager: "ceo" },
  { key: "it", first: "Suresh", last: "Gowda", dept: "People & Operations", title: "IT & Operations Executive", joined: "2023-05-15", manager: "hr" },
  { key: "dev", first: "Priya", last: "Sharma", dept: "Engineering", title: "Software Engineer", joined: "2024-06-03", manager: "em" },
];

const RANDOM_EMPLOYEES: { dept: string; titles: string[]; manager: string; count: number }[] = [
  { dept: "Engineering", titles: ["Senior Software Engineer", "Software Engineer", "QA Engineer", "DevOps Engineer"], manager: "em", count: 10 },
  { dept: "Design", titles: ["Product Designer"], manager: "pm", count: 2 },
  { dept: "Data", titles: ["Data Analyst", "Data Engineer"], manager: "cto", count: 3 },
  { dept: "Sales", titles: ["Account Executive"], manager: "sales", count: 2 },
  { dept: "Marketing", titles: ["Marketing Manager", "Content Writer"], manager: "ceo", count: 2 },
  { dept: "Finance", titles: ["Finance Executive"], manager: "ceo", count: 1 },
];

const INTERNS: { dept: string; title: string; manager: string; programme: string }[] = [
  { dept: "Engineering", title: "Software Engineering Intern", manager: "em", programme: "B.E. Computer Science" },
  { dept: "Engineering", title: "Software Engineering Intern", manager: "em", programme: "B.Tech Information Science" },
  { dept: "Engineering", title: "Software Engineering Intern", manager: "em", programme: "M.Tech Software Engineering" },
  { dept: "Design", title: "Design Intern", manager: "pm", programme: "B.Des Interaction Design" },
  { dept: "Data", title: "Data Intern", manager: "cto", programme: "M.Sc Data Science" },
  { dept: "Marketing", title: "Marketing Intern", manager: "ceo", programme: "BBA Marketing" },
];

function fakePan(lastName: string) {
  const L = () => faker.string.alpha({ length: 1, casing: "upper" });
  return `${L()}${L()}${L()}P${lastName[0].toUpperCase()}${faker.string.numeric(4)}${L()}`;
}

async function wipe() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  if (list) await prisma.$executeRawUnsafe(`TRUNCATE ${list} CASCADE`);
}

async function main() {
  await wipe();

  const counters = { MD: 0, "MD-INT": 0 };
  const nextCode = (type: EmploymentType) => {
    const key = type === "INTERN" ? "MD-INT" : "MD";
    counters[key] += 1;
    return formatEmployeeCode(type, counters[key]);
  };

  const departments = new Map<string, string>();
  for (const name of DEPARTMENTS) departments.set(name, (await prisma.department.create({ data: { name } })).id);
  const designations = new Map<string, string>();
  for (const title of DESIGNATIONS) designations.set(title, (await prisma.designation.create({ data: { title } })).id);
  for (const name of SYSTEMS) await prisma.systemApp.create({ data: { name } });

  const usedEmails = new Set<string>();
  const emailFor = (first: string, last: string) => {
    const base = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");
    let email = `${base}@${DOMAIN}`;
    for (let i = 2; usedEmails.has(email); i++) email = `${base}${i}@${DOMAIN}`;
    usedEmails.add(email);
    return email;
  };

  const personByKey = new Map<string, string>();

  async function createPerson(spec: Spec, intern?: { programme: string; start: Date; end: Date; mentorKey: string }) {
    const type = spec.type ?? "FULL_TIME";
    const status = spec.status ?? "ACTIVE";
    const workEmail = emailFor(spec.first, spec.last);
    const exited = status === "EXITED";

    const user = await prisma.user.create({
      data: { email: workEmail, name: `${spec.first} ${spec.last}`, role: spec.role ?? "EMPLOYEE", isActive: !exited },
    });

    const pan = fakePan(spec.last);
    const aadhaar = faker.string.numeric({ length: 12, allowLeadingZeros: false });
    const uan = type === "INTERN" ? null : `10${faker.string.numeric(10)}`;
    const account = faker.string.numeric({ length: 14, allowLeadingZeros: false });
    const ifsc = `${faker.helpers.arrayElement(["HDFC", "ICIC", "SBIN", "UTIB", "KKBK"])}0${faker.string.numeric(6)}`;

    const person = await prisma.person.create({
      data: {
        userId: user.id,
        firstName: spec.first,
        lastName: spec.last,
        workEmail,
        personalEmail: faker.internet.email({ firstName: spec.first, lastName: spec.last, provider: "gmail.com" }).toLowerCase(),
        phone: `+91 ${faker.helpers.arrayElement(["9", "8", "7"])}${faker.string.numeric(4)} ${faker.string.numeric(5)}`,
        dateOfBirth: day(isoOf(faker.date.birthdate({ min: type === "INTERN" ? 20 : 23, max: type === "INTERN" ? 24 : 45, mode: "age" }))),
        addressLine1: faker.location.streetAddress(),
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: `560${faker.string.numeric(3)}`,
        emergencyContactName: faker.person.fullName(),
        emergencyContactPhone: `+91 9${faker.string.numeric(4)} ${faker.string.numeric(5)}`,
        emergencyContactRel: faker.helpers.arrayElement(["Parent", "Spouse", "Sibling"]),
        statutory: {
          create: {
            panEnc: encrypt(pan),
            panLast4: last4(pan),
            panHash: blindIndex(pan),
            aadhaarEnc: encrypt(aadhaar),
            aadhaarLast4: last4(aadhaar),
            uanEnc: uan ? encrypt(uan) : null,
            uanLast4: uan ? last4(uan) : null,
          },
        },
        bankAccounts: {
          create: {
            accountHolder: `${spec.first} ${spec.last}`,
            accountNumberEnc: encrypt(account),
            accountLast4: last4(account),
            ifscEnc: encrypt(ifsc),
            bankName: { HDFC: "HDFC Bank", ICIC: "ICICI Bank", SBIN: "State Bank of India", UTIB: "Axis Bank", KKBK: "Kotak Mahindra Bank" }[ifsc.slice(0, 4)],
          },
        },
      },
    });

    const joiningDate = day(spec.joined);
    await prisma.employment.create({
      data: {
        personId: person.id,
        employeeCode: nextCode(type),
        type,
        status,
        departmentId: departments.get(spec.dept),
        designationId: designations.get(spec.title),
        managerId: spec.manager ? personByKey.get(spec.manager) : undefined,
        joiningDate,
        probationEndDate: type === "INTERN" ? null : addDays(joiningDate, 180),
        endedOn: exited ? addDays(day(isoOf(new Date())), -30) : null,
        endReason: exited ? "Resigned" : null,
        internDetails: intern
          ? {
              create: {
                college: faker.helpers.arrayElement(COLLEGES),
                programme: intern.programme,
                internshipStart: intern.start,
                internshipEnd: intern.end,
                mentorId: personByKey.get(intern.mentorKey),
                stipendPaise: faker.helpers.arrayElement([15000, 20000, 25000, 30000]) * 100,
              },
            }
          : undefined,
      },
    });

    await prisma.auditLog.create({
      data: { actorId: null, action: "CREATE", entityType: "Person", entityId: person.id, after: { firstName: spec.first, lastName: spec.last, workEmail, source: "seed" } },
    });

    if (spec.key) personByKey.set(spec.key, person.id);
    return person;
  }

  for (const spec of CORE) await createPerson(spec);

  for (const group of RANDOM_EMPLOYEES) {
    for (let i = 0; i < group.count; i++) {
      const sex = faker.person.sexType();
      await createPerson({
        first: faker.person.firstName(sex),
        last: faker.person.lastName(sex),
        dept: group.dept,
        title: faker.helpers.arrayElement(group.titles),
        joined: isoOf(faker.date.between({ from: "2022-01-01", to: "2026-08-31" })),
        manager: group.manager,
      });
    }
  }

  // One person serving notice, one who has left.
  await createPerson({ first: "Rohan", last: "Kulkarni", dept: "Engineering", title: "Software Engineer", joined: "2023-09-11", manager: "em", status: "NOTICE" });
  await createPerson({ first: "Sneha", last: "Pillai", dept: "Marketing", title: "Content Writer", joined: "2022-11-21", manager: "ceo", status: "EXITED" });

  // Interns: staggered six-month internships; two end within the next ~3 weeks.
  const today = day(isoOf(new Date()));
  const internEnds = [12, 20, 45, 75, 110, 150];
  for (const [i, intern] of INTERNS.entries()) {
    const sex = faker.person.sexType();
    const end = addDays(today, internEnds[i]);
    const start = addDays(end, -182);
    await createPerson(
      { first: faker.person.firstName(sex), last: faker.person.lastName(sex), dept: intern.dept, title: intern.title, type: "INTERN", joined: isoOf(start), manager: intern.manager },
      { programme: intern.programme, start, end, mentorKey: intern.manager === "ceo" ? "pm" : intern.manager === "em" ? "dev" : intern.manager },
    );
  }

  // Conversion history: Priya Sharma was an intern before joining full-time.
  const priya = personByKey.get("dev")!;
  const priyaFt = await prisma.employment.findFirstOrThrow({ where: { personId: priya, endedOn: null } });
  const priyaIntern = await prisma.employment.create({
    data: {
      personId: priya,
      employeeCode: nextCode("INTERN"),
      type: "INTERN",
      status: "EXITED",
      departmentId: departments.get("Engineering"),
      designationId: designations.get("Software Engineering Intern"),
      managerId: personByKey.get("em"),
      joiningDate: day("2023-12-04"),
      endedOn: day("2024-06-02"),
      endReason: "Converted to full-time",
      internDetails: {
        create: { college: "PES University", programme: "B.E. Computer Science", internshipStart: day("2023-12-04"), internshipEnd: day("2024-06-02"), mentorId: personByKey.get("em"), stipendPaise: 2_000_000 },
      },
    },
  });
  await prisma.employment.update({ where: { id: priyaFt.id }, data: { convertedFromId: priyaIntern.id } });

  for (const [key, value] of Object.entries(counters)) await prisma.counter.create({ data: { key, value } });

  await prisma.companySettings.create({
    data: {
      legalName: "metadatum (set legal name in Settings)",
      displayName: "metadatum",
      addressLines: "Bengaluru, Karnataka",
      weeklyOffs: { SAT: "ALL", SUN: "ALL" },
      halfDayMinMinutes: 240,
      fullDayMinMinutes: 480,
      itOwnerPersonId: personByKey.get("it"),
      statutory: undefined, // left empty on purpose: HR enters PF/ESI/PT after checking with the CA
    },
  });

  const counts = await prisma.employment.groupBy({ by: ["type", "status"], _count: { _all: true }, where: { endedOn: null } });
  console.log("Seeded employments:", counts.map((c) => `${c.type}/${c.status}=${c._count._all}`).join(", "));
  console.log("\nSign in (magic link → http://localhost:8025):");
  for (const key of ["ceo", "hr", "em", "dev"]) {
    const p = await prisma.person.findUniqueOrThrow({ where: { id: personByKey.get(key)! }, include: { user: true } });
    console.log(`  ${p.user!.role.padEnd(8)} ${key === "em" ? "(manager)" : "         "} ${p.workEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
