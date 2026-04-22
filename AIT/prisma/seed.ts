import {
  PrismaClient,
  RoomType,
  CourseType,
  PreferenceLevel,
  FlexibilityLevel,
  PriorityLevel,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data (including time slots to avoid overlaps)
  console.log("🧹 Clearing existing academic data...");
  await prisma.timetable.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.course.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.program.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.department.deleteMany();
  await prisma.timeSlot.deleteMany();

  // Seed Time Slots
  console.log("📅 Seeding time slots...");
  const timeSlots = [
    { start: "08:00", end: "09:30" },
    { start: "09:30", end: "11:00" },
    { start: "11:00", end: "12:30" },
    { start: "12:30", end: "14:00" },
    { start: "14:00", end: "15:30" },
    { start: "15:30", end: "17:00" },
    { start: "17:00", end: "18:30" },
  ];

  for (const slot of timeSlots) {
    await prisma.timeSlot.create({
      data: slot,
    });
  }

  // Seed Rooms (15 classrooms + 3 labs)
  console.log("🏫 Seeding rooms...");

  // Create 15 classrooms
  for (let i = 1; i <= 15; i++) {
    await prisma.room.upsert({
      where: { name: `Classroom ${i}` },
      update: {},
      create: {
        name: `Classroom ${i}`,
        type: RoomType.CLASSROOM,
      },
    });
  }

  // Create 3 labs
  for (let i = 1; i <= 3; i++) {
    await prisma.room.upsert({
      where: { name: `Lab ${i}` },
      update: {},
      create: {
        name: `Lab ${i}`,
        type: RoomType.LAB,
      },
    });
  }

  // Seed Faculty
  console.log("👨‍🏫 Seeding faculty members...");
  const facultyData = [
    // Computer Science Faculty
    { name: "Dr. Ahmed Hassan", email: "ahmed.hassan@university.edu" },
    { name: "Prof. Sarah Khan", email: "sarah.khan@university.edu" },
    { name: "Dr. Muhammad Ali", email: "muhammad.ali@university.edu" },
    { name: "Dr. Fatima Sheikh", email: "fatima.sheikh@university.edu" },
    { name: "Prof. Omar Malik", email: "omar.malik@university.edu" },
    { name: "Dr. Ayesha Qureshi", email: "ayesha.qureshi@university.edu" },
    { name: "Dr. Hassan Raza", email: "hassan.raza@university.edu" },
    { name: "Prof. Zainab Ahmad", email: "zainab.ahmad@university.edu" },

    // Software Engineering Faculty
    { name: "Dr. Bilal Tariq", email: "bilal.tariq@university.edu" },
    { name: "Prof. Nadia Iqbal", email: "nadia.iqbal@university.edu" },
    { name: "Dr. Usman Ghani", email: "usman.ghani@university.edu" },
    { name: "Dr. Sana Butt", email: "sana.butt@university.edu" },

    // Business Administration Faculty
    { name: "Prof. Imran Shah", email: "imran.shah@university.edu" },
    { name: "Dr. Rabia Nawaz", email: "rabia.nawaz@university.edu" },
    { name: "Dr. Kamran Siddique", email: "kamran.siddique@university.edu" },
    { name: "Prof. Hina Rashid", email: "hina.rashid@university.edu" },
    { name: "Dr. Tariq Mahmood", email: "tariq.mahmood@university.edu" },
    { name: "Dr. Samina Khatoon", email: "samina.khatoon@university.edu" },

    // Mathematics Faculty
    { name: "Prof. Abdul Rehman", email: "abdul.rehman@university.edu" },
    { name: "Dr. Farah Naz", email: "farah.naz@university.edu" },
    { name: "Dr. Shahid Mehmood", email: "shahid.mehmood@university.edu" },

    // English Faculty
    { name: "Prof. Maria Johnson", email: "maria.johnson@university.edu" },
    { name: "Dr. Asma Riaz", email: "asma.riaz@university.edu" },

    // Physics Faculty
    { name: "Dr. Nasir Ahmed", email: "nasir.ahmed@university.edu" },
    { name: "Prof. Rubina Khalil", email: "rubina.khalil@university.edu" },
  ];

  const createdFaculty = [];
  for (const faculty of facultyData) {
    const created = await prisma.faculty.create({
      data: faculty,
    });
    createdFaculty.push(created);
  }

  // Seed Departments
  console.log("� Seeeding departments...");
  const departmentsData = [
    {
      name: "Computer Science",
      code: "CS",
      description: "Department of Computer Science and Information Technology",
      headOfDept: "Dr. Ahmed Hassan",
      email: "cs@university.edu",
      phone: "+92-51-1234567",
      location: "CS Building, Block A",
    },
    {
      name: "Business Administration",
      code: "BBA",
      description: "Department of Business Administration and Management",
      headOfDept: "Prof. Imran Shah",
      email: "bba@university.edu",
      phone: "+92-51-1234568",
      location: "Business Block, Block B",
    },
    {
      name: "Mathematics",
      code: "MATH",
      description: "Department of Mathematics and Statistics",
      headOfDept: "Prof. Abdul Rehman",
      email: "math@university.edu",
      phone: "+92-51-1234569",
      location: "Science Block, Block C",
    },
  ];

  const createdDepartments = [];
  for (const deptData of departmentsData) {
    const department = await prisma.department.create({
      data: deptData,
    });
    createdDepartments.push(department);
  }

  // Seed Programs
  console.log("🎓 Seeding academic programs...");
  const programsData = [
    {
      name: "Bachelor of Science in Computer Science (BSCS)",
      code: "BSCS",
      description: "4-year undergraduate program in Computer Science",
      duration: 4,
      departmentId: createdDepartments.find((d) => d.code === "CS")!.id,
    },
    {
      name: "Bachelor of Science in Software Engineering (BSSE)",
      code: "BSSE",
      description: "4-year undergraduate program in Software Engineering",
      duration: 4,
      departmentId: createdDepartments.find((d) => d.code === "CS")!.id,
    },
    {
      name: "Bachelor of Business Administration (BBA)",
      code: "BBA",
      description: "4-year undergraduate program in Business Administration",
      duration: 4,
      departmentId: createdDepartments.find((d) => d.code === "BBA")!.id,
    },
  ];

  const createdPrograms = [];
  for (const programData of programsData) {
    const program = await prisma.program.create({
      data: programData,
    });
    createdPrograms.push(program);
  }

  // Seed Semesters (8 semesters for each program)
  console.log("📚 Seeding semesters...");
  const createdSemesters = [];
  for (const program of createdPrograms) {
    for (let semesterNumber = 1; semesterNumber <= 8; semesterNumber++) {
      const semester = await prisma.semester.create({
        data: {
          number: semesterNumber,
          programId: program.id,
        },
      });
      createdSemesters.push({ ...semester, programName: program.name });
    }
  }

  // Seed Courses
  console.log("📖 Seeding courses...");

  // BSCS Courses by Semester
  const bscsCoursesData: Record<
    number,
    Array<{ name: string; code: string; type: CourseType }>
  > = {
    1: [
      {
        name: "Introduction to Computing",
        code: "CS101",
        type: CourseType.THEORY,
      },
      {
        name: "Programming Fundamentals",
        code: "CS102",
        type: CourseType.THEORY,
      },
      { name: "Programming Lab", code: "CS103", type: CourseType.LAB },
      { name: "Calculus I", code: "MATH101", type: CourseType.THEORY },
      { name: "English Composition", code: "ENG101", type: CourseType.THEORY },
      { name: "Islamic Studies", code: "ISL101", type: CourseType.THEORY },
      { name: "Pakistan Studies", code: "PAK101", type: CourseType.THEORY },
    ],
    2: [
      {
        name: "Object Oriented Programming",
        code: "CS201",
        type: CourseType.THEORY,
      },
      { name: "OOP Lab", code: "CS202", type: CourseType.LAB },
      { name: "Digital Logic Design", code: "CS203", type: CourseType.THEORY },
      { name: "Digital Logic Lab", code: "CS204", type: CourseType.LAB },
      { name: "Calculus II", code: "MATH201", type: CourseType.THEORY },
      { name: "Physics", code: "PHY201", type: CourseType.THEORY },
      { name: "Technical Writing", code: "ENG201", type: CourseType.THEORY },
    ],
    3: [
      { name: "Data Structures", code: "CS301", type: CourseType.THEORY },
      { name: "Data Structures Lab", code: "CS302", type: CourseType.LAB },
      { name: "Computer Organization", code: "CS303", type: CourseType.THEORY },
      {
        name: "Discrete Mathematics",
        code: "MATH301",
        type: CourseType.THEORY,
      },
      { name: "Linear Algebra", code: "MATH302", type: CourseType.THEORY },
      { name: "Database Systems", code: "CS304", type: CourseType.THEORY },
      { name: "Database Lab", code: "CS305", type: CourseType.LAB },
    ],
    4: [
      { name: "Algorithms", code: "CS401", type: CourseType.THEORY },
      { name: "Computer Networks", code: "CS402", type: CourseType.THEORY },
      { name: "Networks Lab", code: "CS403", type: CourseType.LAB },
      { name: "Operating Systems", code: "CS404", type: CourseType.THEORY },
      { name: "OS Lab", code: "CS405", type: CourseType.LAB },
      { name: "Software Engineering", code: "CS406", type: CourseType.THEORY },
      { name: "Statistics", code: "STAT401", type: CourseType.THEORY },
    ],
    5: [
      {
        name: "Artificial Intelligence",
        code: "CS501",
        type: CourseType.THEORY,
      },
      { name: "AI Lab", code: "CS502", type: CourseType.LAB },
      { name: "Web Technologies", code: "CS503", type: CourseType.THEORY },
      { name: "Web Lab", code: "CS504", type: CourseType.LAB },
      { name: "Computer Graphics", code: "CS505", type: CourseType.THEORY },
      { name: "Graphics Lab", code: "CS506", type: CourseType.LAB },
      { name: "Theory of Computation", code: "CS507", type: CourseType.THEORY },
    ],
    6: [
      { name: "Machine Learning", code: "CS601", type: CourseType.THEORY },
      { name: "ML Lab", code: "CS602", type: CourseType.LAB },
      {
        name: "Mobile App Development",
        code: "CS603",
        type: CourseType.THEORY,
      },
      { name: "Mobile Lab", code: "CS604", type: CourseType.LAB },
      { name: "Information Security", code: "CS605", type: CourseType.THEORY },
      {
        name: "Human Computer Interaction",
        code: "CS606",
        type: CourseType.THEORY,
      },
      {
        name: "Professional Practices",
        code: "CS607",
        type: CourseType.THEORY,
      },
    ],
    7: [
      { name: "Final Year Project I", code: "CS701", type: CourseType.THEORY },
      { name: "Distributed Systems", code: "CS702", type: CourseType.THEORY },
      { name: "Cloud Computing", code: "CS703", type: CourseType.THEORY },
      { name: "Data Mining", code: "CS704", type: CourseType.THEORY },
      { name: "Compiler Construction", code: "CS705", type: CourseType.THEORY },
      { name: "Parallel Computing", code: "CS706", type: CourseType.THEORY },
    ],
    8: [
      { name: "Final Year Project II", code: "CS801", type: CourseType.THEORY },
      { name: "Software Architecture", code: "CS802", type: CourseType.THEORY },
      { name: "Entrepreneurship", code: "MGT801", type: CourseType.THEORY },
      { name: "Research Methodology", code: "CS803", type: CourseType.THEORY },
      { name: "Advanced Algorithms", code: "CS804", type: CourseType.THEORY },
      { name: "Internship", code: "CS805", type: CourseType.THEORY },
    ],
  };

  // BSSE Courses by Semester
  const bsseCoursesData: Record<
    number,
    Array<{ name: string; code: string; type: CourseType }>
  > = {
    1: [
      {
        name: "Introduction to Software Engineering",
        code: "SE101",
        type: CourseType.THEORY,
      },
      {
        name: "Programming Fundamentals",
        code: "SE102",
        type: CourseType.THEORY,
      },
      { name: "Programming Lab", code: "SE103", type: CourseType.LAB },
      { name: "Calculus I", code: "MATH111", type: CourseType.THEORY },
      { name: "English Composition", code: "ENG111", type: CourseType.THEORY },
      { name: "Islamic Studies", code: "ISL111", type: CourseType.THEORY },
      { name: "Pakistan Studies", code: "PAK111", type: CourseType.THEORY },
    ],
    2: [
      {
        name: "Object Oriented Programming",
        code: "SE201",
        type: CourseType.THEORY,
      },
      { name: "OOP Lab", code: "SE202", type: CourseType.LAB },
      {
        name: "Software Requirements Engineering",
        code: "SE203",
        type: CourseType.THEORY,
      },
      {
        name: "Discrete Mathematics",
        code: "MATH211",
        type: CourseType.THEORY,
      },
      { name: "Calculus II", code: "MATH212", type: CourseType.THEORY },
      { name: "Physics", code: "PHY211", type: CourseType.THEORY },
      { name: "Technical Writing", code: "ENG211", type: CourseType.THEORY },
    ],
    3: [
      {
        name: "Data Structures & Algorithms",
        code: "SE301",
        type: CourseType.THEORY,
      },
      { name: "DSA Lab", code: "SE302", type: CourseType.LAB },
      {
        name: "Software Design & Architecture",
        code: "SE303",
        type: CourseType.THEORY,
      },
      { name: "Database Systems", code: "SE304", type: CourseType.THEORY },
      { name: "Database Lab", code: "SE305", type: CourseType.LAB },
      { name: "Linear Algebra", code: "MATH311", type: CourseType.THEORY },
      {
        name: "Software Project Management",
        code: "SE306",
        type: CourseType.THEORY,
      },
    ],
    4: [
      { name: "Software Testing", code: "SE401", type: CourseType.THEORY },
      { name: "Testing Lab", code: "SE402", type: CourseType.LAB },
      { name: "Web Engineering", code: "SE403", type: CourseType.THEORY },
      { name: "Web Lab", code: "SE404", type: CourseType.LAB },
      { name: "Operating Systems", code: "SE405", type: CourseType.THEORY },
      { name: "Computer Networks", code: "SE406", type: CourseType.THEORY },
      { name: "Statistics", code: "STAT411", type: CourseType.THEORY },
    ],
    5: [
      {
        name: "Software Quality Assurance",
        code: "SE501",
        type: CourseType.THEORY,
      },
      {
        name: "Mobile Application Development",
        code: "SE502",
        type: CourseType.THEORY,
      },
      { name: "Mobile Lab", code: "SE503", type: CourseType.LAB },
      {
        name: "Human Computer Interaction",
        code: "SE504",
        type: CourseType.THEORY,
      },
      { name: "Software Metrics", code: "SE505", type: CourseType.THEORY },
      { name: "Agile Development", code: "SE506", type: CourseType.THEORY },
      { name: "DevOps Practices", code: "SE507", type: CourseType.THEORY },
    ],
    6: [
      { name: "Software Maintenance", code: "SE601", type: CourseType.THEORY },
      { name: "Cloud Computing", code: "SE602", type: CourseType.THEORY },
      { name: "Information Security", code: "SE603", type: CourseType.THEORY },
      {
        name: "Software Configuration Management",
        code: "SE604",
        type: CourseType.THEORY,
      },
      {
        name: "Machine Learning for SE",
        code: "SE605",
        type: CourseType.THEORY,
      },
      {
        name: "Professional Practices",
        code: "SE606",
        type: CourseType.THEORY,
      },
      { name: "Formal Methods", code: "SE607", type: CourseType.THEORY },
    ],
    7: [
      { name: "Final Year Project I", code: "SE701", type: CourseType.THEORY },
      {
        name: "Software Process Improvement",
        code: "SE702",
        type: CourseType.THEORY,
      },
      {
        name: "Enterprise Software Development",
        code: "SE703",
        type: CourseType.THEORY,
      },
      {
        name: "Software Risk Management",
        code: "SE704",
        type: CourseType.THEORY,
      },
      {
        name: "Advanced Software Engineering",
        code: "SE705",
        type: CourseType.THEORY,
      },
      { name: "Software Economics", code: "SE706", type: CourseType.THEORY },
    ],
    8: [
      { name: "Final Year Project II", code: "SE801", type: CourseType.THEORY },
      {
        name: "Software Engineering Research",
        code: "SE802",
        type: CourseType.THEORY,
      },
      { name: "Entrepreneurship", code: "MGT811", type: CourseType.THEORY },
      { name: "Software Innovation", code: "SE803", type: CourseType.THEORY },
      {
        name: "Industry Collaboration",
        code: "SE804",
        type: CourseType.THEORY,
      },
      { name: "Internship", code: "SE805", type: CourseType.THEORY },
    ],
  };

  // BBA Courses by Semester
  const bbaCoursesData: Record<
    number,
    Array<{ name: string; code: string; type: CourseType }>
  > = {
    1: [
      {
        name: "Principles of Management",
        code: "MGT101",
        type: CourseType.THEORY,
      },
      {
        name: "Introduction to Business",
        code: "BUS101",
        type: CourseType.THEORY,
      },
      {
        name: "Business Mathematics",
        code: "MATH121",
        type: CourseType.THEORY,
      },
      { name: "English Composition", code: "ENG121", type: CourseType.THEORY },
      { name: "Islamic Studies", code: "ISL121", type: CourseType.THEORY },
      { name: "Pakistan Studies", code: "PAK121", type: CourseType.THEORY },
      { name: "Computer Applications", code: "CS121", type: CourseType.THEORY },
    ],
    2: [
      {
        name: "Principles of Accounting",
        code: "ACC201",
        type: CourseType.THEORY,
      },
      { name: "Microeconomics", code: "ECO201", type: CourseType.THEORY },
      {
        name: "Business Communication",
        code: "ENG221",
        type: CourseType.THEORY,
      },
      {
        name: "Statistics for Business",
        code: "STAT221",
        type: CourseType.THEORY,
      },
      {
        name: "Organizational Behavior",
        code: "MGT201",
        type: CourseType.THEORY,
      },
      { name: "Business Ethics", code: "BUS201", type: CourseType.THEORY },
      {
        name: "Introduction to Psychology",
        code: "PSY201",
        type: CourseType.THEORY,
      },
    ],
    3: [
      { name: "Macroeconomics", code: "ECO301", type: CourseType.THEORY },
      { name: "Financial Accounting", code: "ACC301", type: CourseType.THEORY },
      { name: "Marketing Management", code: "MKT301", type: CourseType.THEORY },
      {
        name: "Human Resource Management",
        code: "HRM301",
        type: CourseType.THEORY,
      },
      { name: "Business Law", code: "LAW301", type: CourseType.THEORY },
      {
        name: "Operations Management",
        code: "OPM301",
        type: CourseType.THEORY,
      },
      { name: "Research Methods", code: "RES301", type: CourseType.THEORY },
    ],
    4: [
      { name: "Financial Management", code: "FIN401", type: CourseType.THEORY },
      { name: "Cost Accounting", code: "ACC401", type: CourseType.THEORY },
      { name: "Consumer Behavior", code: "MKT401", type: CourseType.THEORY },
      { name: "Strategic Management", code: "MGT401", type: CourseType.THEORY },
      {
        name: "International Business",
        code: "IB401",
        type: CourseType.THEORY,
      },
      {
        name: "Supply Chain Management",
        code: "SCM401",
        type: CourseType.THEORY,
      },
      { name: "Business Analytics", code: "BA401", type: CourseType.THEORY },
    ],
    5: [
      { name: "Investment Analysis", code: "FIN501", type: CourseType.THEORY },
      { name: "Digital Marketing", code: "MKT501", type: CourseType.THEORY },
      {
        name: "Leadership & Change Management",
        code: "MGT501",
        type: CourseType.THEORY,
      },
      { name: "Corporate Finance", code: "FIN502", type: CourseType.THEORY },
      { name: "Brand Management", code: "MKT502", type: CourseType.THEORY },
      { name: "Project Management", code: "PM501", type: CourseType.THEORY },
      { name: "Business Intelligence", code: "BI501", type: CourseType.THEORY },
    ],
    6: [
      { name: "Risk Management", code: "FIN601", type: CourseType.THEORY },
      { name: "Sales Management", code: "MKT601", type: CourseType.THEORY },
      {
        name: "Compensation Management",
        code: "HRM601",
        type: CourseType.THEORY,
      },
      { name: "Corporate Governance", code: "MGT601", type: CourseType.THEORY },
      { name: "E-Commerce", code: "EC601", type: CourseType.THEORY },
      { name: "Quality Management", code: "QM601", type: CourseType.THEORY },
      {
        name: "Business Process Management",
        code: "BPM601",
        type: CourseType.THEORY,
      },
    ],
    7: [
      { name: "Final Year Project I", code: "BUS701", type: CourseType.THEORY },
      { name: "Entrepreneurship", code: "ENT701", type: CourseType.THEORY },
      {
        name: "Advanced Financial Analysis",
        code: "FIN701",
        type: CourseType.THEORY,
      },
      { name: "Global Marketing", code: "MKT701", type: CourseType.THEORY },
      { name: "Business Consulting", code: "CON701", type: CourseType.THEORY },
      {
        name: "Innovation Management",
        code: "INV701",
        type: CourseType.THEORY,
      },
    ],
    8: [
      {
        name: "Final Year Project II",
        code: "BUS801",
        type: CourseType.THEORY,
      },
      {
        name: "Business Strategy Implementation",
        code: "MGT821",
        type: CourseType.THEORY,
      },
      {
        name: "Advanced Business Analytics",
        code: "BA801",
        type: CourseType.THEORY,
      },
      { name: "Crisis Management", code: "CM801", type: CourseType.THEORY },
      { name: "Business Simulation", code: "SIM801", type: CourseType.THEORY },
      { name: "Internship", code: "INT801", type: CourseType.THEORY },
    ],
  };

  // Create courses for each program and semester
  let totalCourses = 0;
  for (const semester of createdSemesters) {
    let coursesData = [];

    if (semester.programName.includes("BSCS")) {
      coursesData = bscsCoursesData[semester.number] || [];
    } else if (semester.programName.includes("BSSE")) {
      coursesData = bsseCoursesData[semester.number] || [];
    } else if (semester.programName.includes("BBA")) {
      coursesData = bbaCoursesData[semester.number] || [];
    }

    for (const courseData of coursesData) {
      // Assign faculty randomly
      const randomFaculty =
        createdFaculty[Math.floor(Math.random() * createdFaculty.length)];

      await prisma.course.create({
        data: {
          name: courseData.name,
          code: courseData.code,
          type: courseData.type,
          semesterId: semester.id,
          facultyId: randomFaculty.id,
        },
      });
      totalCourses++;
    }
  }

  // Seed Students
  console.log("�‍🎓 Seneding students...");
  const studentsData = [];

  // Generate students for each program and semester
  for (const program of createdPrograms) {
    const programCode = program.code;
    const currentYear = new Date().getFullYear();

    // Generate students for semesters 1-8 (representing different batches)
    for (let semesterNum = 1; semesterNum <= 8; semesterNum++) {
      const semester = createdSemesters.find(
        (s) => s.programId === program.id && s.number === semesterNum
      );
      if (!semester) continue;

      // Calculate batch year (current students in semester 1 are from current year)
      const batchYear = currentYear - Math.floor((semesterNum - 1) / 2);

      // Number of students per semester (varies by program and semester)
      const studentsPerSemester = programCode === "BBA" ? 40 : 35;
      const currentSemesterStudents = Math.max(
        10,
        studentsPerSemester - (semesterNum - 1) * 2
      ); // Fewer students in higher semesters

      for (let i = 1; i <= currentSemesterStudents; i++) {
        const studentNumber = (semesterNum - 1) * 50 + i; // Ensure unique numbers across semesters
        const regId = `${batchYear}-${programCode}-${String(
          studentNumber
        ).padStart(3, "0")}`;
        const studentNames = [
          "Ahmed Ali",
          "Fatima Khan",
          "Muhammad Hassan",
          "Ayesha Sheikh",
          "Omar Malik",
          "Zainab Ahmad",
          "Hassan Raza",
          "Sana Butt",
          "Bilal Tariq",
          "Nadia Iqbal",
          "Usman Ghani",
          "Rabia Nawaz",
          "Kamran Siddique",
          "Hina Rashid",
          "Tariq Mahmood",
          "Samina Khatoon",
          "Abdul Rehman",
          "Farah Naz",
          "Shahid Mehmood",
          "Asma Riaz",
          "Nasir Ahmed",
          "Rubina Khalil",
          "Imran Shah",
          "Maria Johnson",
          "Salman Khan",
          "Khadija Malik",
          "Faisal Ahmed",
          "Amna Siddique",
          "Waqas Ali",
          "Saira Batool",
          "Adnan Qureshi",
          "Mehwish Awan",
          "Rizwan Shah",
          "Noor Fatima",
          "Hamza Malik",
          "Aisha Nawaz",
          "Junaid Khan",
          "Sadia Iqbal",
          "Fahad Ali",
          "Mariam Sheikh",
          "Arslan Ahmed",
          "Bushra Khatoon",
          "Daniyal Hassan",
          "Iqra Malik",
          "Kashif Raza",
        ];

        const randomName =
          studentNames[Math.floor(Math.random() * studentNames.length)];
        const firstName = randomName.split(" ")[0];
        const lastName = randomName.split(" ")[1];

        studentsData.push({
          regId,
          regName: randomName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${regId
            .toLowerCase()
            .replace(/-/g, ".")}@student.university.edu`,
          phone: `+92-300-${String(
            Math.floor(Math.random() * 9000000) + 1000000
          )}`,
          dateOfBirth: new Date(
            2000 + Math.floor(Math.random() * 5),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
          ),
          address: `House ${Math.floor(Math.random() * 999) + 1}, Street ${
            Math.floor(Math.random() * 50) + 1
          }, Islamabad`,
          programId: program.id,
          semesterId: semester.id,
          isActive: Math.random() > 0.05, // 95% active students
        });
      }
    }
  }

  const createdStudents = [];
  for (const studentData of studentsData) {
    const student = await prisma.student.create({
      data: studentData,
    });
    createdStudents.push(student);
  }

  // Seed Enrollments (OPTIMIZED - batch insert)
  console.log("📝 Seeding course enrollments (batch mode)...");
  const allCourses = await prisma.course.findMany({
    include: {
      semester: {
        include: {
          program: true,
        },
      },
    },
  });

  // Build all enrollments in memory first
  const enrollmentsToCreate: Array<{
    studentId: number;
    courseId: number;
    isActive: boolean;
    grade: string | null;
    attendance: number | null;
  }> = [];

  for (const student of createdStudents) {
    if (!student.isActive || !student.semesterId) continue;

    // Find courses for this student's semester
    const studentCourses = allCourses.filter(
      (course) => course.semesterId === student.semesterId
    );

    // Enroll student in 80-100% of their semester's courses
    const enrollmentRate = 0.8 + Math.random() * 0.2;
    const coursesToEnroll = Math.floor(studentCourses.length * enrollmentRate);

    // Randomly select courses to enroll in
    const shuffledCourses = studentCourses.sort(() => 0.5 - Math.random());
    const selectedCourses = shuffledCourses.slice(0, coursesToEnroll);

    for (const course of selectedCourses) {
      enrollmentsToCreate.push({
        studentId: student.id,
        courseId: course.id,
        isActive: true,
        grade:
          Math.random() > 0.7
            ? ["A", "A-", "B+", "B", "B-", "C+", "C"][
                Math.floor(Math.random() * 7)
              ]
            : null,
        attendance:
          Math.random() > 0.3
            ? Math.floor(75 + Math.random() * 25)
            : null,
      });
    }
  }

  // Batch insert enrollments (much faster!)
  console.log(`   Creating ${enrollmentsToCreate.length} enrollments in batches...`);
  const BATCH_SIZE = 500;
  for (let i = 0; i < enrollmentsToCreate.length; i += BATCH_SIZE) {
    const batch = enrollmentsToCreate.slice(i, i + BATCH_SIZE);
    await prisma.enrollment.createMany({
      data: batch,
      // skipDuplicates: true, // Not supported in SQLite
    });
    console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(enrollmentsToCreate.length / BATCH_SIZE)} completed`);
  }
  const totalEnrollments = enrollmentsToCreate.length;

  // Seed Enhanced Data for Advanced Features
  console.log("🔧 Seeding enhanced data for advanced features...");

  // Seed Room Enhancements
  console.log("🏢 Seeding room enhancements...");
  const rooms = await prisma.room.findMany();

  for (const room of rooms) {
    const isLab = room.type === "LAB";
    const roomNumberMatch = room.name.match(/\d+/);
    const roomNumber = roomNumberMatch ? parseInt(roomNumberMatch[0]) : room.id; // Fallback to room.id if no number found

    await prisma.roomEnhancement.upsert({
      where: { roomId: room.id },
      update: {},
      create: {
        room: {
          connect: { id: room.id }
        },
        capacity: isLab ? 25 : 30 + (roomNumber % 10) * 5, // Labs: 25, Classrooms: 30-75
        optimalCapacity: isLab ? 20 : 24 + (roomNumber % 10) * 4, // 80% of capacity
        equipment: isLab
          ? [
              { name: "Computers", count: 25, type: "Hardware" },
              { name: "Projector", count: 1, type: "Display" },
              { name: "Whiteboard", count: 1, type: "Teaching Aid" },
              { name: "Network Switch", count: 1, type: "Network" },
            ]
          : [
              { name: "Projector", count: 1, type: "Display" },
              { name: "Whiteboard", count: 1, type: "Teaching Aid" },
              {
                name: "Sound System",
                count: roomNumber % 3 === 0 ? 1 : 0,
                type: "Audio",
              },
            ],
        roomCharacteristics: {
          lighting:
            roomNumber % 2 === 0 ? "Natural + Artificial" : "Artificial",
          acoustics: roomNumber % 3 === 0 ? "Excellent" : "Good",
          airConditioning: true,
          accessibility: roomNumber <= 5 ? "Wheelchair Accessible" : "Standard",
        },
        suitableForCourseTypes: isLab ? ["LAB"] : ["THEORY"],
        departmentPreferences: isLab
          ? ["Computer Science", "Software Engineering"]
          : roomNumber % 3 === 0
          ? ["Business Administration"]
          : ["Computer Science", "Software Engineering"],
        building: "Main Campus",
        floor:
          roomNumber <= 6
            ? "Ground Floor"
            : roomNumber <= 12
            ? "First Floor"
            : "Second Floor",
        accessibilityFeatures:
          roomNumber <= 5
            ? ["Ramp Access", "Wide Doors", "Accessible Restroom Nearby"]
            : [],
      },
    });
  }

  // Seed Faculty Preferences
  console.log("👥 Seeding faculty preferences...");
  const faculty = await prisma.faculty.findMany();

  for (let i = 0; i < faculty.length; i++) {
    const facultyMember = faculty[i];
    const timeSlots = await prisma.timeSlot.findMany();

    // Create varied preferences for different faculty
    const preferredDays =
      i % 3 === 0
        ? ["MONDAY", "WEDNESDAY", "FRIDAY"]
        : i % 3 === 1
        ? ["TUESDAY", "THURSDAY"]
        : ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

    const preferredTimeSlots = timeSlots.map((slot) => ({
      timeSlotId: slot.id,
      dayOfWeek: "ANY",
      preference:
        i % 4 === 0
          ? "STRONGLY_PREFER"
          : i % 4 === 1
          ? "PREFER"
          : i % 4 === 2
          ? "NEUTRAL"
          : "PREFER",
    }));

    await prisma.facultyPreference.create({
      data: {
        facultyId: facultyMember.id,
        preferredTimeSlots: preferredTimeSlots,
        unavailableTimeSlots:
          i % 5 === 0
            ? [
                {
                  timeSlotId: timeSlots[0].id,
                  dayOfWeek: "FRIDAY",
                  reason: "Personal commitment",
                },
              ]
            : [],
        preferredDays: preferredDays,
        unavailableDays: i % 7 === 0 ? ["SATURDAY"] : [],
        maxDailyHours: 6 + (i % 3),
        maxConsecutiveHours: 3 + (i % 2),
        preferredBreakDuration: 30 + (i % 3) * 15,
        preferredTeachingPatterns: [
          {
            name: "Balanced Schedule",
            description: "Even distribution across days",
            daysPerWeek: preferredDays.length,
            hoursPerDay: 2,
            preferredTimeRanges: [{ start: "09:00", end: "15:00" }],
          },
        ],
        avoidBackToBackClasses: i % 3 === 0,
        preferredRoomTypes:
          facultyMember.name.includes("Lab") ||
          facultyMember.name.includes("CS")
            ? ["LAB", "CLASSROOM"]
            : ["CLASSROOM"],
        preferredBuildings: ["Main Campus"],
        preferredCourseTypes: facultyMember.name.includes("Math")
          ? ["THEORY"]
          : ["THEORY", "LAB"],
        maxCoursesPerDay: 3 + (i % 2),
        flexibilityLevel:
          i % 3 === 0 ? "STRICT" : i % 3 === 1 ? "MODERATE" : "FLEXIBLE",
        priorityLevel: i % 4 === 0 ? "HIGH" : i % 4 === 1 ? "MEDIUM" : "MEDIUM",
      },
    });
  }

  // Seed Course Enhancements
  console.log("📚 Seeding course enhancements...");
  const courses = await prisma.course.findMany();

  for (const course of courses) {
    const isLab = course.type === "LAB";
    const isCS =
      course.name.includes("Programming") ||
      course.name.includes("Computer") ||
      course.name.includes("Software") ||
      course.name.includes("Database");

    await prisma.courseEnhancement.create({
      data: {
        courseId: course.id,
        expectedEnrollment: isLab ? 25 : 25 + Math.floor(Math.random() * 20),
        maxEnrollment: isLab ? 25 : 40 + Math.floor(Math.random() * 15),
        minEnrollment: isLab ? 15 : 15 + Math.floor(Math.random() * 10),
        requiredEquipment: isLab
          ? [
              {
                name: "Computers",
                specifications: { ram: "8GB", processor: "i5" },
              },
              {
                name: "Development Software",
                specifications: { ide: "VS Code", compiler: "GCC" },
              },
            ]
          : isCS
          ? [
              { name: "Projector", specifications: { resolution: "1080p" } },
              { name: "Computer", specifications: { for: "demonstrations" } },
            ]
          : [{ name: "Projector", specifications: { resolution: "1080p" } }],
        preferredEquipment: [
          { name: "Sound System", specifications: { wireless: true } },
          { name: "Interactive Whiteboard", specifications: { touch: true } },
        ],
        requiredRoomType: isLab ? "LAB" : "CLASSROOM",
        preferredRoomFeatures: isLab
          ? ["Air Conditioning", "Network Access", "Power Outlets"]
          : ["Air Conditioning", "Natural Light", "Sound System"],
        preferredTimeSlots: course.name.includes("Lab")
          ? [
              {
                timeSlotId: 2,
                preference: "PREFER",
                reason: "Better for hands-on work",
              },
            ]
          : [],
        avoidTimeSlots: course.name.includes("Math")
          ? [
              {
                timeSlotId: 3,
                preference: "AVOID",
                reason: "Students less focused in evening",
              },
            ]
          : [],
        requiresSpecialSetup: isLab,
        setupTimeMinutes: isLab ? 15 : 5,
        cleanupTimeMinutes: isLab ? 10 : 5,
      },
    });
  }

  // Seed Equipment
  console.log("🔧 Seeding equipment inventory...");
  const equipmentData = [
    {
      name: "Projector Model A",
      type: "Display",
      model: "Epson EB-X41",
      manufacturer: "Epson",
    },
    {
      name: "Projector Model B",
      type: "Display",
      model: "BenQ MX550",
      manufacturer: "BenQ",
    },
    {
      name: "Desktop Computer",
      type: "Hardware",
      model: "OptiPlex 7090",
      manufacturer: "Dell",
    },
    {
      name: "Laptop Computer",
      type: "Hardware",
      model: "ThinkPad E15",
      manufacturer: "Lenovo",
    },
    {
      name: "Sound System",
      type: "Audio",
      model: "SoundMax Pro",
      manufacturer: "AudioTech",
    },
    {
      name: "Interactive Whiteboard",
      type: "Teaching Aid",
      model: "SMART Board MX275",
      manufacturer: "SMART",
    },
    {
      name: "Network Switch",
      type: "Network",
      model: "Catalyst 2960",
      manufacturer: "Cisco",
    },
    {
      name: "Document Camera",
      type: "Display",
      model: "AverVision F17",
      manufacturer: "AVerMedia",
    },
  ];

  for (const equipment of equipmentData) {
    await prisma.equipment.create({
      data: {
        ...equipment,
        specifications: {
          warranty: "3 years",
          condition: "Excellent",
          lastService: "2024-01-15",
        },
        isAvailable: true,
        isOperational: true,
        lastMaintenanceDate: new Date("2024-01-15"),
        nextMaintenanceDate: new Date("2024-07-15"),
        requiredForCourseTypes:
          equipment.type === "Hardware" ? ["LAB"] : ["THEORY", "LAB"],
        compatibleRoomTypes: ["CLASSROOM", "LAB"],
        usageCount: Math.floor(Math.random() * 100),
        lastUsedDate: new Date(),
        purchaseDate: new Date("2023-08-01"),
        purchaseCost: 50000 + Math.floor(Math.random() * 200000), // PKR
        warrantyExpiration: new Date("2026-08-01"),
      },
    });
  }

  console.log("✅ Database seeding completed!");
  console.log(`🏢 Created ${createdDepartments.length} departments`);
  console.log(`📅 Created ${timeSlots.length} time slots`);
  console.log("🏫 Created 15 classrooms and 3 labs");
  console.log(`👨‍�e Created ${createdFaculty.length} faculty members`);
  console.log(`🎓 Created ${createdPrograms.length} academic programs`);
  console.log(
    `� CCreated ${createdSemesters.length} semesters (8 per program)`
  );
  console.log(`📖 Created ${totalCourses} courses`);
  console.log(`👨‍🎓 Created ${createdStudents.length} students`);
  console.log(`📝 Created ${totalEnrollments} course enrollments`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
