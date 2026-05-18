import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Chapter } from '../../src/models/Chapter';
import { Course } from '../../src/models/Course';
import { CourseProgress } from '../../src/models/CourseProgress';
import { FillInTheBlankQuestion } from '../../src/models/FillInTheBlankQuestion';
import { Module } from '../../src/models/Module';
import { Question } from '../../src/models/Question';
import { QuestionProgress } from '../../src/models/QuestionProgress';
import { ChapterProgress } from '../../src/models/ChapterProgress';
import { ShortAnswerQuestion } from '../../src/models/ShortAnswerQuestion';
import { Subject } from '../../src/models/Subject';
import { TestQuestion } from '../../src/models/TestQuestion';

const cleanupMock = vi.hoisted(() => ({
  deleteSupabaseImages: vi.fn(),
  deleteRemovedSupabaseImages: vi.fn(),
}));

vi.mock('../../src/services/storageCleanupService', () => ({
  deleteSupabaseImages: cleanupMock.deleteSupabaseImages,
  deleteRemovedSupabaseImages: cleanupMock.deleteRemovedSupabaseImages,
}));

describe('entity image cleanup', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    cleanupMock.deleteSupabaseImages.mockReset();
    cleanupMock.deleteRemovedSupabaseImages.mockReset();
  });

  it('deletes a subject image after the subject and nested courses are deleted', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const courseId = new mongoose.Types.ObjectId();
    const { subjectService } = await import('../../src/services/subjectService');
    const { courseService } = await import('../../src/services/courseService');

    vi.spyOn(Subject, 'findById').mockResolvedValue({ _id: subjectId } as any);
    vi.spyOn(Course, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: courseId }]),
    } as any);
    vi.spyOn(courseService, 'deleteCourse').mockResolvedValue({ _id: courseId } as any);
    vi.spyOn(Subject, 'findByIdAndDelete').mockResolvedValue({
      _id: subjectId,
      subject_img: 'https://example.supabase.co/storage/v1/object/public/images/subjects/math.jpg',
    } as any);

    await subjectService.deleteSubject(String(subjectId));

    // Subject deletion cascades through CourseService, then removes the subject thumbnail.
    expect(courseService.deleteCourse).toHaveBeenCalledWith(String(courseId));
    expect(cleanupMock.deleteSupabaseImages).toHaveBeenCalledWith(
      'https://example.supabase.co/storage/v1/object/public/images/subjects/math.jpg'
    );
  });

  it('deletes the old subject image when the subject image is replaced or cleared', async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const oldImageUrl = 'https://example.supabase.co/storage/v1/object/public/images/subjects/old.jpg';
    const newImageUrl = 'https://example.supabase.co/storage/v1/object/public/images/subjects/new.jpg';
    const { subjectService } = await import('../../src/services/subjectService');

    vi.spyOn(Subject, 'findById').mockResolvedValue({
      _id: subjectId,
      subject_img: oldImageUrl,
    } as any);
    vi.spyOn(Subject, 'findByIdAndUpdate').mockResolvedValue({
      _id: subjectId,
      subject_img: newImageUrl,
    } as any);

    await subjectService.updateSubject(String(subjectId), { subject_img: newImageUrl });

    // Replacing an image through the admin form must clean up the previous uploaded file.
    expect(cleanupMock.deleteRemovedSupabaseImages).toHaveBeenCalledWith(oldImageUrl, newImageUrl);
  });

  it('deletes markdown images when a chapter is deleted', async () => {
    const chapterId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();
    const { chapterService } = await import('../../src/services/chapterService');

    vi.spyOn(Chapter, 'findById').mockResolvedValue({ _id: chapterId } as any);
    vi.spyOn(Chapter, 'findByIdAndDelete').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: chapterId,
        module_id: moduleId,
        order: 2,
        content: 'Read this ![diagram](https://example.supabase.co/storage/v1/object/public/images/chapters/diagram.jpg)',
      }),
    } as any);
    vi.spyOn(Chapter, 'updateMany').mockResolvedValue({} as any);

    await chapterService.deleteChapter(String(chapterId));

    // Chapter image URLs are stored inside markdown content rather than a separate model field.
    expect(cleanupMock.deleteSupabaseImages).toHaveBeenCalledWith(
      'Read this ![diagram](https://example.supabase.co/storage/v1/object/public/images/chapters/diagram.jpg)'
    );
  });

  it('deletes chapter markdown images that were removed during editing', async () => {
    const chapterId = new mongoose.Types.ObjectId();
    const oldImageUrl = 'https://example.supabase.co/storage/v1/object/public/images/chapters/old.jpg';
    const keptImageUrl = 'https://example.supabase.co/storage/v1/object/public/images/chapters/keep.jpg';
    const { chapterService } = await import('../../src/services/chapterService');

    vi.spyOn(Chapter, 'findById').mockResolvedValue({
      _id: chapterId,
      content: `![old](${oldImageUrl}) ![keep](${keptImageUrl})`,
    } as any);
    vi.spyOn(Chapter, 'findByIdAndUpdate').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: chapterId,
        content: `![keep](${keptImageUrl})`,
      }),
    } as any);

    await chapterService.updateChapter(String(chapterId), { content: `![keep](${keptImageUrl})` });

    // Chapter editing compares old and new markdown so only removed embedded images are deleted.
    expect(cleanupMock.deleteRemovedSupabaseImages).toHaveBeenCalledWith(
      `![old](${oldImageUrl}) ![keep](${keptImageUrl})`,
      `![keep](${keptImageUrl})`
    );
  });

  it('deletes the type-specific question image when a question is deleted', async () => {
    const questionId = new mongoose.Types.ObjectId();
    const typeId = new mongoose.Types.ObjectId();
    const { questionService } = await import('../../src/services/questionService');

    vi.spyOn(Question, 'findById').mockResolvedValue({
      _id: questionId,
      type: 'test',
      typeId,
    } as any);
    vi.spyOn(TestQuestion, 'findById').mockResolvedValue({
      _id: typeId,
      question_img: 'https://example.supabase.co/storage/v1/object/public/images/questions/q.jpg',
    } as any);
    vi.spyOn(TestQuestion, 'findByIdAndDelete').mockResolvedValue({ _id: typeId } as any);
    vi.spyOn(Question, 'findByIdAndDelete').mockResolvedValue({ _id: questionId } as any);

    await questionService.deleteQuestion(String(questionId));

    // Wrapper questions do not store images; cleanup uses the type-specific question document.
    expect(cleanupMock.deleteSupabaseImages).toHaveBeenCalledWith(
      'https://example.supabase.co/storage/v1/object/public/images/questions/q.jpg'
    );
  });

  it('deletes the old question image when a question image is replaced', async () => {
    const typeId = new mongoose.Types.ObjectId();
    const oldImageUrl = 'https://example.supabase.co/storage/v1/object/public/images/questions/old.jpg';
    const newImageUrl = 'https://example.supabase.co/storage/v1/object/public/images/questions/new.jpg';
    const { questionService } = await import('../../src/services/questionService');

    vi.spyOn(TestQuestion, 'findById').mockResolvedValue({
      _id: typeId,
      question_img: oldImageUrl,
    } as any);
    vi.spyOn(TestQuestion, 'findByIdAndUpdate').mockResolvedValue({
      _id: typeId,
      question_img: newImageUrl,
    } as any);

    await questionService.updateTestQuestion(String(typeId), { question_img: newImageUrl });

    // Question image replacement should not leave the old uploaded object behind.
    expect(cleanupMock.deleteRemovedSupabaseImages).toHaveBeenCalledWith(oldImageUrl, newImageUrl);
  });

  it('deletes course, chapter, and question images when a course is deleted', async () => {
    const courseId = new mongoose.Types.ObjectId();
    const moduleId = new mongoose.Types.ObjectId();
    const chapterId = new mongoose.Types.ObjectId();
    const questionId = new mongoose.Types.ObjectId();
    const { courseService } = await import('../../src/services/courseService');

    vi.spyOn(Course, 'findById').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: courseId,
        course_img: 'https://example.supabase.co/storage/v1/object/public/images/courses/cover.jpg',
      }),
    } as any);
    vi.spyOn(Module, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: moduleId }]),
    } as any);
    vi.spyOn(Chapter, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([
        {
          _id: chapterId,
          content: '![chapter](https://example.supabase.co/storage/v1/object/public/images/chapters/chapter.jpg)',
        },
      ]),
    } as any);
    vi.spyOn(Question, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: questionId }]),
    } as any);
    vi.spyOn(TestQuestion, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([
        { question_img: 'https://example.supabase.co/storage/v1/object/public/images/questions/test.jpg' },
      ]),
    } as any);
    vi.spyOn(ShortAnswerQuestion, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    } as any);
    vi.spyOn(FillInTheBlankQuestion, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    } as any);
    vi.spyOn(ChapterProgress, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(QuestionProgress, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(TestQuestion, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(ShortAnswerQuestion, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(FillInTheBlankQuestion, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(Question, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(Chapter, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(Module, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(CourseProgress, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(Course, 'findByIdAndDelete').mockResolvedValue({ _id: courseId } as any);

    await courseService.deleteCourse(String(courseId));

    // Course deletion removes nested content in bulk, so image URLs must be collected before deleteMany runs.
    expect(cleanupMock.deleteSupabaseImages).toHaveBeenCalledWith(
      '![chapter](https://example.supabase.co/storage/v1/object/public/images/chapters/chapter.jpg)',
      'https://example.supabase.co/storage/v1/object/public/images/questions/test.jpg'
    );
    expect(cleanupMock.deleteSupabaseImages).toHaveBeenCalledWith(
      'https://example.supabase.co/storage/v1/object/public/images/courses/cover.jpg'
    );
  });

  it('deletes the old course image when the course image is replaced', async () => {
    const courseId = new mongoose.Types.ObjectId();
    const oldImageUrl = 'https://example.supabase.co/storage/v1/object/public/images/courses/old.jpg';
    const newImageUrl = 'https://example.supabase.co/storage/v1/object/public/images/courses/new.jpg';
    const { courseService } = await import('../../src/services/courseService');

    vi.spyOn(Course, 'findById').mockResolvedValue({
      _id: courseId,
      course_img: oldImageUrl,
    } as any);
    vi.spyOn(Course, 'findByIdAndUpdate').mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: courseId,
        course_img: newImageUrl,
      }),
    } as any);

    await courseService.updateCourse(String(courseId), { course_img: newImageUrl });

    // Course cover replacement uses the same removed-image cleanup path as subjects.
    expect(cleanupMock.deleteRemovedSupabaseImages).toHaveBeenCalledWith(oldImageUrl, newImageUrl);
  });
});
