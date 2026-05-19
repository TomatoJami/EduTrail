import '../config/env';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import { User } from '../models/User';
import { Subject } from '../models/Subject';
import { Course } from '../models/Course';
import { Module } from '../models/Module';
import { Chapter } from '../models/Chapter';
import { Question } from '../models/Question';
import { TestQuestion } from '../models/TestQuestion';
import { ShortAnswerQuestion } from '../models/ShortAnswerQuestion';
import { FillInTheBlankQuestion } from '../models/FillInTheBlankQuestion';
import { CourseProgress } from '../models/CourseProgress';
import { ChapterProgress } from '../models/ChapterProgress';
import { QuestionProgress } from '../models/QuestionProgress';
import { Feedback } from '../models/Feedback';

/** Provides deterministic learner credentials for Playwright scenarios. */
const E2E_STUDENT_EMAIL = process.env.E2E_USER_EMAIL || 'student@test.com';
const E2E_STUDENT_PASSWORD = process.env.E2E_USER_PASSWORD || '12345678A!';

/** Mirrors default admin envs, with test-only fallbacks for isolated E2E database seeding. */
const E2E_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@test.com';
const E2E_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || '12345678A!';

/** Prevents the seed script from clearing a non-test database by accident. */
function assertSafeDatabase() {
  const uri = process.env.MONGODB_URI || '';
  const allowReset = process.env.ALLOW_E2E_DB_RESET === 'true';

  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Refusing to seed E2E data unless NODE_ENV=test');
  }

  if (!allowReset && !/(test|e2e)/i.test(uri)) {
    throw new Error('Refusing to clear database because MONGODB_URI does not look like a test database');
  }
}

/** Clears every collection that the seeded journey depends on. */
async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    Subject.deleteMany({}),
    Course.deleteMany({}),
    Module.deleteMany({}),
    Chapter.deleteMany({}),
    Question.deleteMany({}),
    TestQuestion.deleteMany({}),
    ShortAnswerQuestion.deleteMany({}),
    FillInTheBlankQuestion.deleteMany({}),
    CourseProgress.deleteMany({}),
    ChapterProgress.deleteMany({}),
    QuestionProgress.deleteMany({}),
    Feedback.deleteMany({}),
  ]);
}

/** Creates a compact course catalog and progress fixtures for Playwright flows. */
async function seed() {
  assertSafeDatabase();
  await connectDB();
  await clearCollections();

  const mathSubject = await Subject.create({
    subject_name: 'Mathematics',
    subject_img: 'https://example.com/images/math.png',
  });

  const programmingSubject = await Subject.create({
    subject_name: 'Programming',
    subject_img: 'https://example.com/images/programming.png',
  });

  const algebraCourse = await Course.create({
    title: 'Basic Algebra',
    description: 'Learn variables and simple equations.',
    goals: ['Understand variables', 'Solve equations'],
    ageGroup: '10-12',
    course_img: 'https://example.com/images/algebra.png',
    subject_id: mathSubject._id,
  });

  await Course.create({
    title: 'Intro to Programming',
    description: 'Learn basic programming concepts.',
    goals: ['Understand code', 'Practice logic'],
    ageGroup: '10-12',
    course_img: 'https://example.com/images/programming-course.png',
    subject_id: programmingSubject._id,
  });

  const algebraModule = await Module.create({
    title: 'Introduction to Algebra',
    order: 1,
    course_id: algebraCourse._id,
  });

  await Chapter.create({
    title: 'What is Algebra?',
    content: 'Algebra uses symbols to describe numbers and relationships.',
    order: 1,
    module_id: algebraModule._id,
  });

  const testQuestion = await TestQuestion.create({
    module_id: algebraModule._id,
    question: 'What is 2 + 2?',
    question_img: '',
    options: ['3', '4', '5'],
    correctAnswer: 1,
    explanation: '2 + 2 equals 4.',
  });

  await Question.create({
    module_id: algebraModule._id,
    type: 'test',
    typeId: testQuestion._id,
  });

  const shortAnswerQuestion = await ShortAnswerQuestion.create({
    module_id: algebraModule._id,
    question: 'What language is commonly used with React?',
    question_img: '',
    correctAnswers: ['JavaScript', 'TypeScript'],
    caseSensitive: false,
    explanation: 'React apps are commonly written with JavaScript or TypeScript.',
  });

  await Question.create({
    module_id: algebraModule._id,
    type: 'short-answer',
    typeId: shortAnswerQuestion._id,
  });

  const fillBlankQuestion = await FillInTheBlankQuestion.create({
    module_id: algebraModule._id,
    questionText: 'The result of 5 + 3 is ___.',
    question_img: '',
    blanks: [{ blankId: 'blank1', correctAnswers: ['8'], caseSensitive: false }],
    explanation: '5 + 3 equals 8.',
  });

  await Question.create({
    module_id: algebraModule._id,
    type: 'fill-blank',
    typeId: fillBlankQuestion._id,
  });

  await User.create({
    email: E2E_STUDENT_EMAIL,
    password: E2E_STUDENT_PASSWORD,
    name: 'E2E Student',
    role: 'student',
    ageGroup: '10-12',
    preferredSubjects: [mathSubject._id],
    hasCompletedOnboarding: true,
  });

  await User.create({
    email: E2E_ADMIN_EMAIL,
    password: E2E_ADMIN_PASSWORD,
    name: 'E2E Admin',
    role: 'admin',
    ageGroup: '10-12',
    preferredSubjects: [mathSubject._id, programmingSubject._id],
    hasCompletedOnboarding: true,
  });

  console.info(`Seeded E2E database with ${E2E_STUDENT_EMAIL} and ${E2E_ADMIN_EMAIL}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
