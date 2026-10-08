import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  console.log('🌱 Starting VidyaSutra Database Seeding...');

  // Clean existing attendance, assignments, allotments, student profiles, analytics and timetables
  await prisma.attendanceRecord.deleteMany({});
  await prisma.attendanceSession.deleteMany({});
  await prisma.teacherAssignment.deleteMany({});
  await prisma.courseAllotment.deleteMany({});
  await prisma.studentAnalyticsProfile.deleteMany({});
  await prisma.timetableEntry.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Purged existing records.');

  const now = new Date();

  // 1. Initial Student: Student (Overall Strong Performer: High Academic / High Placement)
  const studentUser = await prisma.user.create({
    data: {
      name: 'Student',
      email: 'student@vidyasutra.edu.in',
      password_hash: hashPassword('Student@123'),
      role: 'STUDENT',
      created_at: now,
      last_login_at: now,
      student: {
        create: {
          roll_no: '21BCSE101',
          course: 'Computer Science & Engineering',
          department: 'Computer Science & Engineering',
          semester: 6,
          section: 'CSE-A',
          admission_year: 2021,
          courses: {
            create: [
              { subject_code: 'CS301', subject_name: 'Data Structures & Algorithms', status: 'ACTIVE' },
              { subject_code: 'CS302', subject_name: 'Database Management Systems', status: 'ACTIVE' },
              { subject_code: 'CS303', subject_name: 'Operating Systems', status: 'ACTIVE' },
              { subject_code: 'CS304', subject_name: 'Computer Networks', status: 'ACTIVE' },
            ],
          },
          analytics_profile: {
            create: {
              cgpa: 8.85,
              internal_marks_avg: 88.0,
              semester_marks_avg: 86.5,
              backlogs_count: 0,
              academic_trend: 'improving',
              assignments_completed: 10,
              assignments_total: 10,
              lms_activity_score: 92.0,
              events_attended_count: 5,
              clubs_count: 2,
              hackathons_count: 2,
              certifications_count: 3,
              engagement_score: 86.0,
              aptitude_score: 86.0,
              coding_score: 90.0,
              mock_interview_score: 88.0,
              placement_readiness_pct: 88.0,
              placement_status: 'ready',
              verified_skills_count: 6,
              faculty_feedback_rating: 4.8,
              faculty_feedback_notes: 'Consistent high performer with outstanding algorithmic and development competence.',
            },
          },
        },
      },
    },
  });
  console.log(`✅ Seeded Student User: ${studentUser.email} (Roll: 21BCSE101)`);

  // 2. Additional Student: Ananya Sen (High Academic / Low Placement Readiness)
  await prisma.user.create({
    data: {
      name: 'Ananya Sen',
      email: 'ananya.sen@vidyasutra.edu.in',
      password_hash: hashPassword('Student@123'),
      role: 'STUDENT',
      created_at: now,
      student: {
        create: {
          roll_no: '21BCSE102',
          department: 'Computer Science & Engineering',
          semester: 6,
          section: 'CSE-A',
          admission_year: 2021,
          courses: {
            create: [
              { subject_code: 'CS301', subject_name: 'Data Structures & Algorithms', status: 'ACTIVE' },
              { subject_code: 'CS302', subject_name: 'Database Management Systems', status: 'ACTIVE' },
            ],
          },
          analytics_profile: {
            create: {
              cgpa: 8.42,
              internal_marks_avg: 82.0,
              semester_marks_avg: 84.0,
              backlogs_count: 0,
              academic_trend: 'stable',
              assignments_completed: 9,
              assignments_total: 10,
              lms_activity_score: 84.0,
              events_attended_count: 2,
              clubs_count: 1,
              hackathons_count: 0,
              certifications_count: 1,
              engagement_score: 54.0,
              aptitude_score: 55.0,
              coding_score: 48.0,
              mock_interview_score: 52.0,
              placement_readiness_pct: 51.5,
              placement_status: 'in_preparation',
              verified_skills_count: 2,
              faculty_feedback_rating: 4.2,
              faculty_feedback_notes: 'Excels in academic theory and internal tests, but requires hands-on coding interview preparation.',
            },
          },
        },
      },
    },
  });
  console.log('✅ Seeded Student User: ananya.sen@vidyasutra.edu.in');

  // 3. Additional Student: Rohit Kumar (Low Academic / Low Attendance -> High Risk)
  await prisma.user.create({
    data: {
      name: 'Rohit Kumar',
      email: 'rohit.kumar@vidyasutra.edu.in',
      password_hash: hashPassword('Student@123'),
      role: 'STUDENT',
      created_at: now,
      student: {
        create: {
          roll_no: '22BIT105',
          department: 'Information Technology',
          semester: 4,
          section: 'B',
          admission_year: 2022,
          courses: {
            create: [
              { subject_code: 'IT201', subject_name: 'Object Oriented Programming', status: 'ACTIVE' },
              { subject_code: 'IT202', subject_name: 'Computer Architecture', status: 'ACTIVE' },
            ],
          },
          analytics_profile: {
            create: {
              cgpa: 5.35,
              internal_marks_avg: 48.0,
              semester_marks_avg: 52.0,
              backlogs_count: 2,
              academic_trend: 'declining',
              assignments_completed: 4,
              assignments_total: 10,
              lms_activity_score: 44.0,
              events_attended_count: 0,
              clubs_count: 0,
              hackathons_count: 0,
              certifications_count: 0,
              engagement_score: 22.0,
              aptitude_score: 42.0,
              coding_score: 38.0,
              mock_interview_score: 40.0,
              placement_readiness_pct: 40.0,
              placement_status: 'in_preparation',
              verified_skills_count: 1,
              faculty_feedback_rating: 2.5,
              faculty_feedback_notes: 'Urgent intervention needed. Attendance dropped below mandatory limits and internal exams show backlog risk.',
            },
          },
        },
      },
    },
  });
  console.log('✅ Seeded Student User: rohit.kumar@vidyasutra.edu.in');

  // 4. Additional Student: Kavya Nair (Strong Attendance / Weak Academic Performance)
  await prisma.user.create({
    data: {
      name: 'Kavya Nair',
      email: 'kavya.nair@vidyasutra.edu.in',
      password_hash: hashPassword('Student@123'),
      role: 'STUDENT',
      created_at: now,
      student: {
        create: {
          roll_no: '21BCSE104',
          department: 'Computer Science & Engineering',
          semester: 6,
          section: 'CSE-A',
          admission_year: 2021,
          courses: {
            create: [
              { subject_code: 'CS301', subject_name: 'Data Structures & Algorithms', status: 'ACTIVE' },
              { subject_code: 'CS302', subject_name: 'Database Management Systems', status: 'ACTIVE' },
            ],
          },
          analytics_profile: {
            create: {
              cgpa: 5.85,
              internal_marks_avg: 56.0,
              semester_marks_avg: 58.0,
              backlogs_count: 1,
              academic_trend: 'declining',
              assignments_completed: 8,
              assignments_total: 10,
              lms_activity_score: 72.0,
              events_attended_count: 1,
              clubs_count: 1,
              hackathons_count: 0,
              certifications_count: 1,
              engagement_score: 48.0,
              aptitude_score: 52.0,
              coding_score: 45.0,
              mock_interview_score: 48.0,
              placement_readiness_pct: 48.0,
              placement_status: 'in_preparation',
              verified_skills_count: 2,
              faculty_feedback_rating: 3.2,
              faculty_feedback_notes: 'Maintains excellent classroom attendance, but struggles with advanced core engineering concepts.',
            },
          },
        },
      },
    },
  });
  console.log('✅ Seeded Student User: kavya.nair@vidyasutra.edu.in');

  // 5. Fresh Unallotted Student (Clean Zero-Telemetry Testing & Missing Data Normalization)
  await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'fresh.student@vidyasutra.edu.in',
      password_hash: hashPassword('Student@123'),
      role: 'STUDENT',
      created_at: now,
      last_login_at: now,
      student: {
        create: {
          roll_no: '24BCSE001',
          department: 'Computer Science & Engineering',
          semester: 1,
          section: 'A',
          admission_year: 2024,
        },
      },
    },
  });
  console.log('✅ Seeded Fresh Student User: fresh.student@vidyasutra.edu.in (0 allotments)');

  // 5. Faculty: Dr. Ramesh Verma
  const facultyUser = await prisma.user.create({
    data: {
      name: 'Dr. Ramesh Verma',
      email: 'faculty@vidyasutra.edu.in',
      password_hash: hashPassword('Faculty@123'),
      role: 'FACULTY',
      created_at: now,
      last_login_at: now,
      teacher_assignments: {
        create: [
          {
            course_code: 'CS301',
            course_name: 'Data Structures & Algorithms',
            section: 'CSE-A',
            room: 'Hall 301 (Block A)',
          },
          {
            course_code: 'CS302',
            course_name: 'Database Management Systems',
            section: 'CSE-A',
            room: 'Hall 402 (Block B)',
          },
        ],
      },
    },
  });
  console.log('✅ Seeded Faculty User with Course Assignments: faculty@vidyasutra.edu.in (CS301 & CS302, CSE-A)');

  // 5. Mentor: Prof. Sneha Iyer
  const mentorUser = await prisma.user.create({
    data: {
      name: 'Prof. Sneha Iyer',
      email: 'mentor@vidyasutra.edu.in',
      password_hash: hashPassword('Mentor@123'),
      role: 'MENTOR',
      created_at: now,
      last_login_at: now,
    },
  });
  console.log('✅ Seeded Mentor User: mentor@vidyasutra.edu.in');

  // 6. Administrator: Academic Affairs
  await prisma.user.create({
    data: {
      name: 'Academic Administrator',
      email: 'admin@vidyasutra.edu.in',
      password_hash: hashPassword('Admin@123'),
      role: 'ADMIN',
      created_at: now,
      last_login_at: now,
    },
  });
  console.log('✅ Seeded Admin User: admin@vidyasutra.edu.in');

  // 7. Placement Coordinator: Vikram Malhotra
  await prisma.user.create({
    data: {
      name: 'Vikram Malhotra',
      email: 'coordinator@vidyasutra.edu.in',
      password_hash: hashPassword('Coordinator@123'),
      role: 'COORDINATOR',
      created_at: now,
      last_login_at: now,
    },
  });
  console.log('✅ Seeded Coordinator User: coordinator@vidyasutra.edu.in');

  // 8. Timetable Entries Master (Course/Section-wise schedules)
  await prisma.timetableEntry.createMany({
    data: [
      // Computer Science & Engineering • Sem 6 • CSE-A (Wednesday schedule)
      {
        course: 'Computer Science & Engineering',
        semester: 6,
        section: 'CSE-A',
        day: 'Wednesday',
        start_time: '09:00 AM',
        end_time: '10:00 AM',
        subject: 'Data Structures & Algorithms',
        subject_code: 'CS301',
        teacher_name: 'Dr. Ramesh Verma',
        teacher_id: facultyUser.id,
        room: 'Hall 301 (Block A)',
      },
      {
        course: 'Computer Science & Engineering',
        semester: 6,
        section: 'CSE-A',
        day: 'Wednesday',
        start_time: '10:00 AM',
        end_time: '11:00 AM',
        subject: 'Database Management Systems',
        subject_code: 'CS302',
        teacher_name: 'Dr. Ramesh Verma',
        teacher_id: facultyUser.id,
        room: 'Hall 402 (Block B)',
      },
      {
        course: 'Computer Science & Engineering',
        semester: 6,
        section: 'CSE-A',
        day: 'Wednesday',
        start_time: '11:15 AM',
        end_time: '12:15 PM',
        subject: 'Operating Systems',
        subject_code: 'CS303',
        teacher_name: 'Prof. Sneha Iyer',
        teacher_id: mentorUser.id,
        room: 'Hall 205 (Block B)',
      },
      {
        course: 'Computer Science & Engineering',
        semester: 6,
        section: 'CSE-A',
        day: 'Wednesday',
        start_time: '01:30 PM',
        end_time: '03:30 PM',
        subject: 'Data Structures Lab',
        subject_code: 'CS301-L',
        teacher_name: 'Dr. Ramesh Verma',
        teacher_id: facultyUser.id,
        room: 'Lab 2 (Computing Block)',
      },
      // Monday
      {
        course: 'Computer Science & Engineering',
        semester: 6,
        section: 'CSE-A',
        day: 'Monday',
        start_time: '09:00 AM',
        end_time: '10:00 AM',
        subject: 'Data Structures & Algorithms',
        subject_code: 'CS301',
        teacher_name: 'Dr. Ramesh Verma',
        teacher_id: facultyUser.id,
        room: 'Hall 301 (Block A)',
      },
      {
        course: 'Computer Science & Engineering',
        semester: 6,
        section: 'CSE-A',
        day: 'Monday',
        start_time: '10:00 AM',
        end_time: '11:00 AM',
        subject: 'Database Management Systems',
        subject_code: 'CS302',
        teacher_name: 'Dr. Ramesh Verma',
        teacher_id: facultyUser.id,
        room: 'Hall 402 (Block B)',
      },
      // Friday
      {
        course: 'Computer Science & Engineering',
        semester: 6,
        section: 'CSE-A',
        day: 'Friday',
        start_time: '10:00 AM',
        end_time: '11:00 AM',
        subject: 'Operating Systems',
        subject_code: 'CS303',
        teacher_name: 'Prof. Sneha Iyer',
        teacher_id: mentorUser.id,
        room: 'Hall 205 (Block B)',
      },
      // Information Technology • Sem 4 • B
      {
        course: 'Information Technology',
        semester: 4,
        section: 'B',
        day: 'Wednesday',
        start_time: '01:30 PM',
        end_time: '02:30 PM',
        subject: 'Object Oriented Programming',
        subject_code: 'IT201',
        teacher_name: 'Course Faculty',
        room: 'Block C 201',
      },
    ],
  });
  console.log('✅ Seeded Course/Section-Wise Timetable Master entries');

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
