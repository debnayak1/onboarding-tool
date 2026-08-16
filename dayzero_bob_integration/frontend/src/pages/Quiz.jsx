import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Award, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getQuizzes, getQuiz, submitQuiz, getQuizResults } from '../services/api';

function Quiz({ user }) {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [quizzesRes, resultsRes] = await Promise.all([
        getQuizzes(),
        getQuizResults(user.id)
      ]);
      setQuizzes(quizzesRes.data);
      setResults(resultsRes.data);
    } catch (error) {
      console.error('Error loading quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quizId) => {
    try {
      const response = await getQuiz(quizId);
      setSelectedQuiz(response.data);
      setAnswers({});
      setShowResults(false);
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length < selectedQuiz.questions.length) {
      alert('Please answer all questions before submitting');
      return;
    }

    try {
      const response = await submitQuiz(user.id, selectedQuiz.id, answers);
      setCurrentResult(response.data);
      setShowResults(true);
      await loadData();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz');
    }
  };

  const getResultsChartData = () => {
    if (!currentResult) return [];
    
    const correct = currentResult.correct_answers;
    const incorrect = currentResult.total_questions - correct;

    return [
      { name: 'Correct', value: correct, color: '#24a148' },
      { name: 'Incorrect', value: incorrect, color: '#da1e28' }
    ];
  };

  const getAreasToRevisit = () => {
    if (!currentResult || !currentResult.detailed_results) return [];
    
    return currentResult.detailed_results
      .filter(r => !r.correct)
      .map(r => r.topic || 'General')
      .filter((v, i, a) => a.indexOf(v) === i);
  };

  if (loading) {
    return <div className="loading">Loading quizzes...</div>;
  }

  if (showResults && currentResult) {
    const chartData = getResultsChartData();
    const areasToRevisit = getAreasToRevisit();

    return (
      <div className="container">
        <button 
          onClick={() => {
            setShowResults(false);
            setSelectedQuiz(null);
            setCurrentResult(null);
          }} 
          className="btn btn-secondary"
          style={{ marginBottom: '20px' }}
        >
          ← Back to Quizzes
        </button>

        <div className="card" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: currentResult.score >= 80 ? '#d4f1d4' : currentResult.score >= 60 ? '#d0e2ff' : '#ffd7d9',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Award size={40} color={currentResult.score >= 80 ? '#24a148' : currentResult.score >= 60 ? '#0f62fe' : '#da1e28'} />
          </div>
          <h1 style={{ margin: '0 0 10px 0' }}>Quiz Completed!</h1>
          <h2 style={{ margin: '0 0 20px 0', color: currentResult.score >= 80 ? '#24a148' : currentResult.score >= 60 ? '#0f62fe' : '#da1e28' }}>
            Score: {currentResult.score}%
          </h2>
          <p style={{ color: '#666' }}>
            You answered {currentResult.correct_answers} out of {currentResult.total_questions} questions correctly
          </p>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Results Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Areas to Revisit</h3>
            {areasToRevisit.length > 0 ? (
              <div>
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  Focus on these topics to improve your understanding:
                </p>
                <ul style={{ paddingLeft: '20px' }}>
                  {areasToRevisit.map((area, idx) => (
                    <li key={idx} style={{ marginBottom: '10px', color: '#da1e28' }}>
                      <strong>{area}</strong>
                    </li>
                  ))}
                </ul>
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  background: '#fcf4d6', 
                  borderRadius: '8px' 
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#8e6a00' }}>
                    💡 Tip: Review the learning modules related to these topics before retaking the quiz
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <CheckCircle size={48} color="#24a148" style={{ marginBottom: '15px' }} />
                <p style={{ color: '#24a148', fontWeight: 500 }}>
                  Perfect score! You've mastered all topics! 🎉
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Detailed Results</h3>
          {currentResult.detailed_results?.map((result, idx) => (
            <div 
              key={idx}
              style={{ 
                padding: '15px', 
                marginBottom: '10px', 
                background: result.correct ? '#d4f1d4' : '#ffd7d9',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'start',
                gap: '15px'
              }}
            >
              {result.correct ? (
                <CheckCircle size={24} color="#24a148" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <XCircle size={24} color="#da1e28" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 500 }}>
                  Question {idx + 1}: {result.question}
                </p>
                <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                  Your answer: <strong>{result.user_answer}</strong>
                  {!result.correct && (
                    <span> | Correct answer: <strong style={{ color: '#24a148' }}>{result.correct_answer}</strong></span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedQuiz) {
    return (
      <div className="container">
        <button 
          onClick={() => setSelectedQuiz(null)} 
          className="btn btn-secondary"
          style={{ marginBottom: '20px' }}
        >
          ← Back to Quizzes
        </button>

        <div className="card">
          <h1>{selectedQuiz.title}</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>{selectedQuiz.description}</p>

          {selectedQuiz.questions.map((question, idx) => (
            <div key={question.id} style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '15px' }}>
                Question {idx + 1}: {question.question}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {question.options.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 15px',
                      background: answers[question.id] === option ? '#d0e2ff' : '#f4f4f4',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: answers[question.id] === option ? '2px solid #0f62fe' : '2px solid transparent',
                      gap: '8px',
                      flex: '0 0 auto'
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => handleAnswerChange(question.id, option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button 
            onClick={handleSubmitQuiz}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px' }}
            disabled={Object.keys(answers).length < selectedQuiz.questions.length}
          >
            Submit Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Quizzes 📝</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Test your knowledge and track your progress
      </p>

      {results.length > 0 && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Your Quiz History</h3>
          <table>
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Score</th>
                <th>Correct Answers</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td>{result.quiz_id}</td>
                  <td>
                    <span className={`badge ${
                      result.score >= 80 ? 'badge-success' : 
                      result.score >= 60 ? 'badge-info' : 
                      'badge-danger'
                    }`}>
                      {result.score}%
                    </span>
                  </td>
                  <td>{result.correct_answers} / {result.total_questions}</td>
                  <td>{new Date(result.completed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-2">
        {quizzes.map((quiz) => {
          const previousAttempt = results.find(r => r.quiz_id === quiz.id);
          return (
            <div key={quiz.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>{quiz.title}</h3>
                {previousAttempt && (
                  <span className={`badge ${
                    previousAttempt.score >= 80 ? 'badge-success' : 
                    previousAttempt.score >= 60 ? 'badge-info' : 
                    'badge-danger'
                  }`}>
                    Last: {previousAttempt.score}%
                  </span>
                )}
              </div>

              <p style={{ color: '#666', marginBottom: '15px' }}>{quiz.description}</p>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                <span>📋 {quiz.questions?.length || 0} questions</span>
                <span>⏱️ {quiz.time_limit || 30} minutes</span>
              </div>

              <button 
                onClick={() => handleStartQuiz(quiz.id)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {previousAttempt ? 'Retake Quiz' : 'Start Quiz'}
              </button>
            </div>
          );
        })}
      </div>

      {quizzes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666' }}>No quizzes available yet.</p>
        </div>
      )}
    </div>
  );
}

export default Quiz;

