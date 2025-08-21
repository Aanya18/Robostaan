import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, X, Save, HelpCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Auth/AuthProvider';
import {
  ModuleQuiz,
  QuizQuestion,
  QuizOption
} from '../../lib/courseModuleTypes';

import {
  getLectureQuiz,
  createModuleQuiz,
  updateModuleQuiz,
  getQuizQuestions,
  createQuizQuestion,
  getQuizOptions,
  createQuizOption,
  getModuleLectureById
} from '../../lib/courseModuleService';

const QuizManager: React.FC = () => {
  const { courseId, moduleId, lectureId } = useParams<{ 
    courseId: string;
    moduleId: string;
    lectureId: string;
  }>();
  const { isAdmin } = useAuth();
  
  const [lecture, setLecture] = useState<any>(null);
  const [quiz, setQuiz] = useState<ModuleQuiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [options, setOptions] = useState<Record<string, QuizOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    passing_score: 70
  });
  
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    sequence_order: 1,
    options: [
      { option_text: '', is_correct: true, sequence_order: 1 },
      { option_text: '', is_correct: false, sequence_order: 2 }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!lectureId) return;
      
      try {
        setLoading(true);
        
        // Fetch lecture details
        const { data: lectureData, error: lectureError } = await getModuleLectureById(lectureId);
        
        if (lectureError) throw new Error(`Failed to load lecture: ${lectureError.message}`);
        if (!lectureData) throw new Error('Lecture not found');
        
        setLecture(lectureData);
        
        // Fetch quiz for this lecture
        const { data: quizData, error: quizError } = await getLectureQuiz(lectureId);
        
        if (!quizError && quizData) {
          setQuiz(quizData);
          setQuizForm({
            title: quizData.title,
            description: quizData.description || '',
            passing_score: quizData.passing_score
          });
          
          // Fetch questions for this quiz
          const { data: questionsData, error: questionsError } = await getQuizQuestions(quizData.id);
          
          if (questionsError) throw new Error(`Failed to load questions: ${questionsError.message}`);
          
          setQuestions(questionsData);
          
          // Fetch options for each question
          const optionsMap: Record<string, QuizOption[]> = {};
          for (const question of questionsData) {
            const { data: optionsData, error: optionsError } = await getQuizOptions(question.id);
            
            if (optionsError) throw new Error(`Failed to load options: ${optionsError.message}`);
            
            optionsMap[question.id] = optionsData;
          }
          
          setOptions(optionsMap);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [lectureId]);
  
  // Check permissions
  if (!isAdmin) {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  const handleQuizFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuizForm(prev => ({
      ...prev,
      [name]: name === 'passing_score' ? parseInt(value) || 0 : value
    }));
  };
  
  const handleQuestionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuestionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleOptionChange = (index: number, field: 'option_text' | 'is_correct', value: string | boolean) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index 
          ? { ...option, [field]: value } 
          : field === 'is_correct' && value === true 
              ? { ...option, is_correct: false } // Ensure only one option is correct
              : option
      )
    }));
  };
  
  const addOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { 
          option_text: '', 
          is_correct: false, 
          sequence_order: prev.options.length + 1 
        }
      ]
    }));
  };
  
  const removeOption = (index: number) => {
    if (questionForm.options.length <= 2) {
      alert('Quiz questions must have at least two options.');
      return;
    }
    
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options
        .filter((_, i) => i !== index)
        .map((option, i) => ({ ...option, sequence_order: i + 1 }))
    }));
  };
  
  const handleSaveQuiz = async () => {
    try {
      setLoading(true);
      
      if (!quizForm.title.trim()) {
        alert('Quiz title is required');
        return;
      }
      
      if (quiz) {
        // Update existing quiz
        const { data, error } = await updateModuleQuiz(quiz.id, {
          title: quizForm.title,
          description: quizForm.description,
          passing_score: quizForm.passing_score
        });
        
        if (error) throw error;
        
        setQuiz(data);
      } else {
        // Create new quiz
        const { data, error } = await createModuleQuiz({
          lecture_id: lectureId || '',
          title: quizForm.title,
          description: quizForm.description,
          passing_score: quizForm.passing_score
        });
        
        if (error) throw error;
        
        setQuiz(data);
      }
      
      setEditingQuiz(false);
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Failed to save quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveQuestion = async () => {
    try {
      setLoading(true);
      
      if (!questionForm.question_text.trim()) {
        alert('Question text is required');
        return;
      }
      
      if (questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false') {
        // Check if at least one option is marked as correct
        const hasCorrectOption = questionForm.options.some(option => option.is_correct);
        if (!hasCorrectOption) {
          alert('You must mark at least one option as correct');
          return;
        }
      }
      
      if (editingQuestion) {
        // TODO: Add question update logic
        alert('Question update not yet implemented');
      } else {
        // Create new question
        const { data: questionData, error: questionError } = await createQuizQuestion({
          quiz_id: quiz?.id || '',
          question_text: questionForm.question_text,
          question_type: questionForm.question_type,
          sequence_order: questions.length + 1
        });
        
        if (questionError) throw questionError;
        
        // Create options for the question
        if (questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false') {
          for (const option of questionForm.options) {
            await createQuizOption({
              question_id: questionData.id,
              option_text: option.option_text,
              is_correct: option.is_correct,
              sequence_order: option.sequence_order
            });
          }
        }
        
        // Refresh questions
        const { data: refreshedQuestions } = await getQuizQuestions(quiz?.id || '');
        setQuestions(refreshedQuestions);
        
        // Refresh options for the new question
        const { data: optionsData } = await getQuizOptions(questionData.id);
        setOptions(prev => ({
          ...prev,
          [questionData.id]: optionsData
        }));
      }
      
      // Reset form and close modal
      setQuestionForm({
        question_text: '',
        question_type: 'multiple_choice',
        sequence_order: questions.length + 1,
        options: [
          { option_text: '', is_correct: true, sequence_order: 1 },
          { option_text: '', is_correct: false, sequence_order: 2 }
        ]
      });
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const deleteQuestion = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question? This will also delete all associated options.')) {
      try {
        // TODO: Implement delete question functionality
        alert('Delete question not yet implemented');
        
        // Refresh questions
        const { data: refreshedQuestions } = await getQuizQuestions(quiz?.id || '');
        setQuestions(refreshedQuestions);
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question. Please try again.');
      }
    }
  };
  
  const handleTrueFalseType = () => {
    setQuestionForm(prev => ({
      ...prev,
      question_type: 'true_false',
      options: [
        { option_text: 'True', is_correct: true, sequence_order: 1 },
        { option_text: 'False', is_correct: false, sequence_order: 2 }
      ]
    }));
  };
  
  if (loading && !lecture) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-gray-600 dark:text-gray-300">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a 
          href={`/admin/course/${courseId}/module/${moduleId}/lectures`}
          className="text-orange-500 hover:text-orange-600 transition-colors mb-4 inline-block"
        >
          &larr; Back to Lectures
        </a>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Quiz
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {lecture?.title || 'Loading lecture...'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Quiz Section */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            {quiz && !editingQuiz ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {quiz.title}
                    </h2>
                    {quiz.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-2">
                        {quiz.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Passing score: {quiz.passing_score}%
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingQuiz(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Edit className="inline-block w-4 h-4 mr-2" />
                    Edit Quiz
                  </motion.button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {quiz ? 'Edit Quiz' : 'Create Quiz'}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quiz Title*
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={quizForm.title}
                      onChange={handleQuizFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter quiz title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={quizForm.description}
                      onChange={handleQuizFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter quiz description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      name="passing_score"
                      value={quizForm.passing_score}
                      onChange={handleQuizFormChange}
                      min={0}
                      max={100}
                      className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <motion.button
                      type="button"
                      onClick={() => setEditingQuiz(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleSaveQuiz}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors ${
                        loading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>{quiz ? 'Update Quiz' : 'Create Quiz'}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Questions Section */}
      {quiz && !editingQuiz && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Questions
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditingQuestion({})}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              <Plus className="inline-block w-4 h-4 mr-2" />
              Add Question
            </motion.button>
          </div>
          
          {/* Questions List */}
          <div className="space-y-4">
            {questions.length > 0 ? (
              questions
                .sort((a, b) => a.sequence_order - b.sequence_order)
                .map((question, index) => (
                <div 
                  key={question.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          Q{index + 1}: {question.question_text}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Type: {question.question_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingQuestion(question)}
                          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteQuestion(question.id)}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Options List */}
                    {options[question.id] && question.question_type !== 'short_answer' && (
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Options:</h4>
                        <ul className="space-y-2">
                          {options[question.id]
                            .sort((a, b) => a.sequence_order - b.sequence_order)
                            .map((option, optIndex) => (
                            <li 
                              key={option.id}
                              className={`p-2 rounded-md ${
                                option.is_correct 
                                  ? 'bg-green-100 dark:bg-green-900 border-l-4 border-green-500' 
                                  : 'bg-gray-50 dark:bg-gray-750'
                              }`}
                            >
                              <span className={option.is_correct ? 'font-medium' : ''}>
                                {option.option_text}
                              </span>
                              {option.is_correct && (
                                <span className="ml-2 text-green-600 dark:text-green-400 text-sm">
                                  (Correct)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Questions Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Add questions to complete your quiz.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingQuestion({})}
                  className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  <Plus className="inline-block w-5 h-5 mr-2" />
                  Add Your First Question
                </motion.button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add/Edit Question Modal */}
      {editingQuestion !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingQuestion.id ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button
                onClick={() => setEditingQuestion(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Question Text*
                </label>
                <textarea
                  name="question_text"
                  value={questionForm.question_text}
                  onChange={handleQuestionFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your question"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Question Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setQuestionForm(prev => ({ ...prev, question_type: 'multiple_choice' }))}
                    className={`px-4 py-2 rounded-md ${
                      questionForm.question_type === 'multiple_choice'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={handleTrueFalseType}
                    className={`px-4 py-2 rounded-md ${
                      questionForm.question_type === 'true_false'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    True/False
                  </button>
                </div>
              </div>
              
              {/* Options Section */}
              {(questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false') && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Options
                    </label>
                    {questionForm.question_type === 'multiple_choice' && (
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-blue-500 hover:text-blue-700"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          checked={option.is_correct}
                          onChange={() => handleOptionChange(index, 'is_correct', true)}
                          className="w-4 h-4 text-orange-500"
                        />
                        <input
                          type="text"
                          value={option.option_text}
                          onChange={(e) => handleOptionChange(index, 'option_text', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={`Option ${index + 1}`}
                          disabled={questionForm.question_type === 'true_false'}
                          required
                        />
                        {questionForm.question_type === 'multiple_choice' && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                            disabled={questionForm.options.length <= 2}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  onClick={handleSaveQuestion}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{editingQuestion.id ? 'Update Question' : 'Add Question'}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default QuizManager;
